/* Create (username, credId) pair: 
   Takes username, challenge (base64) and creates an attestation. */
async function makeAttestation (username, challenge, timeout) {
  try {
    const optionsObject = {
      publicKey: {
        rp: {
          id: window.location.hostname,
          name: 'IntMedium Identity'
        },
        user: {
          id: buffer.Buffer.from(username),
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 }
        ],
        challenge: base64.toArrayBuffer(challenge, true),
        timeout: timeout
      }
    }
    const attestation = await navigator.credentials.create(optionsObject)

    return { attestation: attestation, optionsObject }

  } catch (err) {
    console.error(err)
    alert(err)
  }
}

/* Generates a NEW private key from (username, credId) pair.
   Returns an error if the same private key was created before.
   Use RSA only for deterministic and unique signature */
async function generateNewPk ({ username, credId }) {
  try {
    navigator.credentials.create({
        publicKey: {
            rp: {
                id: window.location.hostname,
                name: 'IntMedium Identity'
            },
            user: {
                id: buffer.Buffer.from(username),
                name: username,
                displayName: username
            },
            pubKeyCredParams: [
                { type: 'public-key', alg: -257 }
            ],
            // Don't create a new keypair for an existing (account, credId) pair!
            allowCredentials: [
                { type: 'public-key', id: base64.toArrayBuffer(credId, true) }
            ],
            // Challenge reuse is okay because we don't use this in a way that can get replay attacked
            // window.localStorage is more of a problem, but this is for testnet
            challenge: base64.toArrayBuffer(credId, true)
        }
    })
    .then(masterSig => {
      console.log(masterSig)
      console.log(`Created PK: ${decodeFidoResponse(masterSig.response.attestationObject)}`)
      return storePk(masterSig.response.attestationObject)
    })
    .catch(err => {
      console.error(err)
    })
  } catch (err) {
    console.log('Account may already exist, try signing in instead')
    console.error(err)
    alert(err)
  }
}

/* Gets private key from username and credId */
async function getPk ({ username, credId }) {
  try {
    navigator.credentials.get({
        publicKey: {
            rp: {
                id: window.location.hostname,
                name: 'IntMedium Identity'
            },
            user: {
                id: buffer.Buffer.from(username),
                name: username,
                displayName: username
            },
            pubKeyCredParams: [
                { type: 'public-key', alg: -257 }
            ],
            // Challenge reuse is okay because we don't use this in a way that can get replay attacked
            // localStorage is more of a problem, but this is for testnet
            challenge: base64.toArrayBuffer(credId, true)
        }
    })
    .then(masterSig => {
      console.log(masterSig)
      console.log(`Created PK: ${decodeFidoResponse(masterSig.response.signature)}`)
      crypto.subtle.digest('SHA-256', masterSig.response.signature).then(hash => {
        console.log(`Hash: ${hash.toString('hex')}`) // To be used as private key?
        return window.localStorage.setItem('IntMediumPk', hash.toString('hex'))
      })
    })
    .catch(err => {
      console.error(err)
    })
  } catch (err) {
    console.error(err)
    alert(err)
  }
}

async function getSig () {
  try {
    const getSig = await navigator.credentials.get({
      publicKey: {
          rpId: window.location.hostname,
          // Challenge reuse is okay because we don't use this in a way that can get replay attacked
          // window.localStorage is more of a problem, but this is for testnet
          challenge: buffer.Buffer.from('Master Key Generation'.toString('base64')),
          allowCredentials: [{
            id: window.localStorage.getItem('IntMediumCredentialId'),
            type: 'public-key',
            transpoarts: ['usb', 'ble', 'nfc', 'internal']
          }]
      }
    })
    console.log(JSON.stringify(getSig.response.assertionObject, null, 2))
    crypto.subtle.digest('SHA-256', getSig).then(hash => {
      console.log(`Hash: ${hash.toString('hex')}`) // To be used as private key?
    })
  } catch (err) {
    console.error(err)
    alert(err)
  }
}

function storePk (fidoCBOR) {
  const decoded = decodeFidoResponse(fidoCBOR)
  console.log(`Key loaded: ${decoded.publicKey}`)
  return window.localStorage.setItem('IntMediumPk', decoded.publicKey)
}

function decodeFidoResponse (fidoCBOR) {
  const firstAttesetation = cbor.decodeFirst(fidoCBOR, { bigInt: true, preferWeb: true }).then(o => {
    // cf. https://www.w3.org/TR/webauthn/images/fido-attestation-structures.svg
    const authDataArray =  Object.values(o.authData)
    // const rpIdHash = authDataArray.slice(0,32) // First 32 bytes = rpIdHash
    const flags = authDataArray[32] // 33rd byte = flags (ED, AT, 0, 0, 0, UV, 0, UP). AT+UV+UP=69
    // const counter = authDataArray.slice(33,37) // Bytes 34-37 = counter
    // const aaguid = authDataArray.slice(37,53) // Bytes 38-53 = AAGUID manufacturer-set id (can be all 0s)
    const l = authDataArray[53]*255+authDataArray[54] // 54,55th byte = length L
    const credId = authDataArray.slice(55,56+l) // 56th-56+lth byte = credentialID
    let publicKey

    /* COSE_Key follows format:
     * 1, 2 (kty: EC2 key type)
     * 3, -7 (alg: ES256)
     * -1: 1 (crv: P-256)
     * -2: x (x-coordinate 32 bytes)
     * -3: y (y-coordinate 32 bytes)
     * 
     * i.e. (in hex)
     * 01 02 03 26 20 01 21 58 20 <key> 22 58 20 <key>
     * a.k.a. (in decimal)
     * 1 2 3 38 32 1 33 88 32 <key> 34 88 32 <key>
     * 
     * cf. https://www.w3.org/TR/webauthn/#sctn-encoded-credPubKey-examples
     */
    
    let edByteSet = (flags >= 128)
    if (edByteSet) {
        // remainder is COSE_Key (variable length) + Extensions (CBOR map)
        // must parse
        alert('Webauthn Extension Data not yet implemented')
    } else {
        // remainder is COSE_Key
        let remainder = authDataArray.slice(56+l)
        publicKey = {
            "1": remainder[1],
            "3": remainder[3],
            "-1": remainder[5],
            "-2": remainder.slice(9,41),
            "-3": remainder.slice(44,76)
        }
        console.log(`Public key object: ${JSON.stringify(publicKey)}`)
        console.log(`Credential ID: ${credId.toString('hex')}`)
        return {
          credId, publicKey
        }
    }
})
}