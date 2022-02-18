var express = require('express');
var router = express.Router();

var crypto = require('crypto')
const base64url = require('base64url')
const cbor = require('cbor')

var db = require('../db/index.js');

require('dotenv').config()

/* POST check for username availability */
router.post('/checkUsername', async (req, res, next) => {
  try {

    const { rows } = await db.query(
      'SELECT * FROM "Users" WHERE username = $1',
      [ req.body.username ]
    )
    console.log(rows)
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
    // Store a random challenge, unique username
    const timeout = 5*60000
    const challenge = base64url(crypto.randomBytes(64))
    const now = new Date()
    const expiration = new Date(now.getTime() + timeout) // 5 minutes from now
    await db.query(
      'INSERT INTO "Challenges"(username, challenge, expiration) VALUES ($1, $2, $3)',
      [ req.body.username, challenge, expiration ]
    )

    // Return the random challenge, unique username
    return res.status(200).json({ username: req.body.username, challenge, timeout });

  } catch (err) {
    console.error(err)
    return res.status(500).send()
  }
});

/* POST attestationObject (credId registration) */
router.post('/postAttestation', async (req, res, next) => {
  try {
    const decodedClientDataJSON = JSON.parse(base64url.decode(req.body.clientDataJSON))

    // Validate clientDataJSON
    if (decodedClientDataJSON.type !== 'webauthn.create') throw Error('Something wrong with clientDataJSON')
    if (decodedClientDataJSON.origin !== process.env.AUTH_FQDN) {
      console.error(`Expected FQDN ${process.env.AUTH_FQDN} in clientDataJSON, got ${decodedClientDataJSON.origin}`)
      throw Error('FQDN in clientDataJSON does not match auth server')
    }

    // Look up challenge
    const { rows } = await db.query(
      'SELECT * FROM "Challenges" WHERE challenge = $1',
      [ decodedClientDataJSON.challenge ]
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

    // Parse and validate attestation
    const decodedAttestationObj = await cbor.decodeFirst(
            base64url.toBuffer(req.body.attestationObject),
            { bigInt: true, preferWeb: true }
    )
    const { authData } = decodedAttestationObj
    // Check if rpIdHash matches sha256(rpId)
    if (Buffer.from(authData.slice(0, 32)).toString('hex') !== crypto.createHash('sha256').update(process.env.RPID).digest('hex')) {
      throw Error(`rpId does not match! Expected ${authData.slice(0, 32)}, got ${crypto.createHash('sha256').update(process.env.RPID)}}`)
    }
    // const flags = authData[32]
    // const signCount = (authData[33] << 24) | (authData[34] << 16) | (authData[35] << 8) | authData[36]
    // const aaguid = authData.slice(37, 53)
    const credentialIdLength = (authData[53] << 8) + authData[54]
    const credentialId = authData.slice(55, 55 + credentialIdLength)
    const credentialPublicKey = authData.slice(55 + credentialIdLength)

    // register user and credId
    await db.query(
      'INSERT INTO "Users"(username, "credId", "pubKeyBytes") VALUES ($1, $2, $3)',
      [ rows[0].username, base64url(Buffer.from(credentialId)), base64url(Buffer.from(credentialPublicKey)) ]
    )
    return res.status(200).json({ username: req.body.username, credId: base64url(Buffer.from(credentialId)) });

  } catch (err) {
    console.error(err)
  }
});

/* User then generates master privkey using same device,
 * signing this credId. User also backs up this credId.
 */

/* If user's browser forgets credId used to create privkey,
 * they can always attempt to recover it through this server.
 * Worst case, they can manually recover from backup.
 */

/* POST request dummy challenge: used to get credId */
router.post('/requestCredId', async (req, res, next) => {
  try {

    // Return the credId for specified user.
    const { rows } = await db.query(
      'SELECT "credId" FROM "Users" where username = $2',
      [ req.body.username ]
    )
    // If DNE, return error
    if (rows.length === 0) {
      return res.status(404).send()
    }
    
    // Return credId
    return res.status(200).send(result.rows[0].credId)

  } catch (err) {
    console.error(err)
    res.status(500).send()
  }
})

module.exports = router;
