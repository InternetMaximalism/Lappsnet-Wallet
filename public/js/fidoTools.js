/* Takes username, challenge (base64) and creates an attestation */
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
        challenge: buffer.Buffer.from(challenge),
        timeout: timeout
      }
    }
    const attestation = await navigator.credentials.create(optionsObject)

    return { attestation, optionsObject }

  } catch (err) {
    console.error(err)
    alert(err)
  }
}

async function getNewKey () {
  try {
    const masterSig = await navigator.credentials.create({
        publicKey: {
            rp: {
                id: window.location.hostname,
                name: 'IntMedium Identity'
            },
            user: {
                id: buffer.Buffer.from('IntMediumUser'),
                name: 'user@intmedium.xyz',
                displayName: 'dummyUser'
            },
            pubKeyCredParams: [
                { type: 'public-key', alg: -7 },
                { type: 'public-key', alg: -257 }
            ],
            // Challenge reuse is okay because we don't use this in a way that can get replay attacked
            // localStorage is more of a problem, but this is for testnet
            challenge: buffer.Buffer.from('Master Key Generation'.toString('base64'))
        }
    })
    storeCredentialId(masterSig.response.attestationObject)
    crypto.subtle.digest('SHA-256', masterSig).then(hash => {
      console.log(`Hash: ${hash.toString('hex')}`) // To be used as private key?
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
          // localStorage is more of a problem, but this is for testnet
          challenge: buffer.Buffer.from('Master Key Generation'.toString('base64')),
          allowCredentials: [{
            id: localStorage.getItem('IntMaxCredentialId'),
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

function storeCredentialId (fidoCBOR) {
  const decoded = decodeFidoResponse(fidoCBOR)
  localStorage.setItem('IntMaxCredentialID', decoded.credId)
  return 
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