var express = require('express');
var router = express.Router();

var crypto = require('crypto')
const cbor = require('cbor')
const base64url = require('base64url')
require('dotenv').config()
const { Fido2Lib } = require('fido2-lib')
let f2l = new Fido2Lib({
  timeout: 300000, // in milliseconds
  rpId: process.env.RPID,
  rpName: process.env.RPNAME,
  // rpIcon: `${process.env.RPID}/img/favicon.svg`,
  challengeSize: 64,
  cryptoParams: [-7, -257],
  // authenticatorRequireResidentKey: true,
  authenticatorUserVerification: 'required'
})

var db = require('../db/index.js');

require('dotenv').config()

/* POST check for username availability */
router.post('/checkUsername', async (req, res, next) => {
  try {

    const { rows } = await db.query(
      'SELECT * FROM "Users" WHERE username = $1',
      [ req.body.username ]
    )
    if (rows.length === 0) {
      // No user with requested name, all OK
      return res.status(200).json({ available: true })
    }
    // User already exists, 409 conflict error
    return res.status(409).json({ available: false })

  } catch (err) {
    console.error(err)
    return res.status(500).send()
  }
})

/* POST user registration request */
router.post('/registerUsername', async (req, res, next) => {
  try {
    // Make attestationOptions object
    let registrationOptions = await f2l.attestationOptions()
    registrationOptions.user.id = base64url(req.body.username)
    registrationOptions.user.name = req.body.username
    registrationOptions.user.displayName = req.body.username
    registrationOptions.challenge = base64url(registrationOptions.challenge)

    // Store challenge, unique username
    const timeout = 5*60000
    const now = new Date()
    const expiration = new Date(now.getTime() + timeout) // 5 minutes from now
    await db.query(
      'INSERT INTO "Challenges"(username, challenge, expiration) VALUES ($1, $2, $3)',
      [ req.body.username, registrationOptions.challenge, expiration ]
    )

    // Return the registrationOptions object (incl. userId, challenge)
    return res.status(200).send(registrationOptions);

  } catch (err) {
    console.error(err)
    return res.status(500).send()
  }
});

/* POST attestationObject (credential registration) */
router.post('/postAttestation', async (req, res, next) => {
  try {
    const returnedAttestation = JSON.parse(req.body.attestation)
    let clientData = JSON.parse(base64url.decode(returnedAttestation.response.clientDataJSON))
    // rawId from base64 to Buffer to ArrayBuffer
    let buf = base64url.toBuffer(returnedAttestation.rawId)
    let abRawId = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    returnedAttestation.rawId = abRawId

    // Look up challenge
    const { rows } = await db.query(
      'SELECT * FROM "Challenges" WHERE challenge = $1',
      [ clientData.challenge ]
    )
    // If expired or DNE, return error message
    if (rows.length === 0) {
      return res.status(404).send()
    }

    const now = new Date()
    const expiry = new Date(rows[0].expiration)
    if (now.getTime() > expiry.getTime()) {
      return res.status(404).send()
    }

    // Validate attestation. Throws error if bad.
    let attestationExpectations = {
      challenge: clientData.challenge,
      origin: clientData.origin,
      factor: 'either'
    }
    let regResult = await f2l.attestationResult(returnedAttestation, attestationExpectations)

    let pubKeyX = base64url(Buffer.from(regResult.authnrData.get('credentialPublicKeyJwk').x, 'base64'))

    // register user, credId, pubkey
    await db.query(
      'INSERT INTO "Users"(username, "credId", "pubKeyBytes", counter, "pubKeyPem") VALUES ($1, $2, $3, $4, $5)',
      [ rows[0].username,
        base64url(Buffer.from(regResult.authnrData.get('credId'))),
        pubKeyX,
        regResult.authnrData.get('counter'),
        regResult.authnrData.get('credentialPublicKeyPem') ]
    )

    // Delete challenge
    await db.query(
      'DELETE from "Challenges" WHERE challenge = $1',
      [ clientData.challenge ]
    )

    // Return pubkey
    console.log(`Returning pubkey x coordinate: ${pubKeyX}`)
    return res.status(200).json({ publicKey: pubKeyX, username: rows[0].username });

  } catch (err) {
    console.error(err)
    res.status(500).send()
  }
});

/* POST request auth for username */
router.post('/requestAuth', async (req, res, next) => {
  try {

    // Return the credId for specified user.
    const { rows } = await db.query(
      'SELECT "credId" FROM "Users" where username = $1',
      [ req.body.username ]
    )
    // If DNE, return error
    if (rows.length === 0) {
      return res.status(404).send()
    }

    let authnOptions = await f2l.assertionOptions()
    authnOptions.allowCredentials = [{
      id: rows[0].credId,
      type: 'public-key',
      transports: ["usb", "nfc", "ble", "internal"]
    }]
    authnOptions.challenge = base64url(authnOptions.challenge)

    console.log(authnOptions)
    
    // Store challenge, unique username
    const timeout = 5*60000
    const now = new Date()
    const expiration = new Date(now.getTime() + timeout) // 5 minutes from now
    await db.query(
      'INSERT INTO "Challenges"(username, challenge, expiration) VALUES ($1, $2, $3)',
      [ req.body.username, authnOptions.challenge, expiration ]
    )
    
    // Return credId
    return res.status(200).send(authnOptions)

  } catch (err) {
    console.error(err)
    res.status(500).send()
  }
})

router.post('/postAssertion', async (req, res, next) => {
  try {
    let clientAssertionResponse = JSON.parse(req.body.assertion)
    let clientData = JSON.parse(base64url.decode(clientAssertionResponse.response.clientDataJSON))
    
    // Look up challenge
    const { challengeRows } = await db.query(
      'SELECT * FROM "Challenges" WHERE challenge = $1',
      [ clientData.challenge ]
    )
    // If expired or DNE, return error message
    if (challengeRows.length === 0) {
      return res.status(404).send()
    }

    const now = new Date()
    const expiry = new Date(challengeRows[0].expiration)
    if (now.getTime() > expiry.getTime()) {
      return res.status(404).send()
    }

    // Return the credId for specified user.
    const { userRows } = await db.query(
      'SELECT * FROM "Users" where username = $1',
      [ req.body.username ]
    )

    // Validate assertion
    let assertionExpectations = {
      allowCredentials: [{
        id: userRows[0].credId,
        type: 'public-key',
        transports: ["usb", "nfc", "ble", "internal"]
      }],
      challenge: challengeRows[0].challenge,
      origin: `https://${process.env.RPID}`,
      publicKey: userRows[0].pubKeyPem,
      prevCounter: userRows[0].counter
    }
    let authnResult = await f2l.assertionResult(clientAssertionResponse, assertionExpectations)

    // Delete challenge
    await db.query(
      'DELETE * from "Challenges" WHERE challenge = $1',
      [ clientData.challenge ]
    )

    // Update counter
    await db.query(
      // Update user.counter = new counter where user.username=req.body.username
    )

    // Return pubkey
    return res.status(200).json({ publicKey: userRows[0].pubKeyBytes, username: userRows[0].username })

  } catch (err) {
    console.error()
  }
})

router.post('/void', (req, res, next) => {
  console.log(`Req body` + JSON.stringify(req.body, null, 2))
  console.log(`Req params` + JSON.stringify(req.params, null, 2))
  res.status(200).send()
})

module.exports = router;
