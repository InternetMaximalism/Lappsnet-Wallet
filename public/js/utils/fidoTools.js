/* fidoTools.js - functions that call the WebAuthn API */

/* Create (username, credId) pair: 
   Takes username, challenge (base64) and creates an attestation.
   The credential public key is used as IntMedium account private key. */
   async function makeAttestation (attestationOptions) {
    try {
      const attestation = await navigator.credentials.create({ publicKey: attestationOptions })
      const { publicKey, username } = await submitAttestationToServer(attestation)
      return { encryptionPublicKey: publicKey, registeredUsername: username }
  
    } catch (err) {
      console.error(err)
    }
  }

  async function makeAssertion (assertionOptions) {
    try {
      const assertion = await navigator.credentials.get({ publicKey: assertionOptions })
      
      let { assPubkey, assUsername } = await submitAssertionToServer(assertion)
      return { assPubkey, assUsername }
    } catch (err) {
      console.error(err)
    }
  }

  async function getAuthDataFromAttestation (attestation) {
    try {
      return new Promise((resolve, reject) => {
        cbor.decodeFirst(attestation.response.attestationObject, { bigInt: true, preferWeb: true}, o => {
          resolve(Object.values(o))
        })
      })
    } catch (err) {
      console.error(err)
    }
  }
  
  /* decodes FIDO attestation object and returns credId, publicKey */
  async function decodeFidoResponse (fidoCBOR) {
    try {
      return new Promise((resolve, reject) => {
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
              console.log(`Public key: ${base64.fromArrayBuffer(remainder.slice(9, 41), true)}`)
              console.log(`Credential ID: ${base64.fromArrayBuffer(credId, true)}`)
              resolve({
                credId: base64.fromArrayBuffer(credId, true), publicKey: base64.fromArrayBuffer(remainder.slice(9, 41), true)
              })
          }
        })
      })
    } catch (err) {
      console.error(err)
      reject()
    }
  }

  /* Base64 String encrypted pk, Base64 String encryption key
   * => Hex String pk
   */
  async function recoverPk (encryptedKey, encryptionKey) {
    try {
      // CryptoJS can handle base64 ciphers for us
      let decrypt = CryptoJS.AES.decrypt(encryptedKey, encryptionKey)
      return decrypt.toString(CryptoJS.enc.Utf8)
    } catch (err) {
      console.error(err)
    }
  }

  /* Hex String pk to encrypt, Base64 String encryption key
   * => Base64 String encrypted pk
   */
  async function encryptPk (pk, encryptionKey) {
    try {
      let utf8key = CryptoJS.enc.Utf8.parse(pk)
      let encryptedKey = CryptoJS.AES.encrypt(utf8key, encryptionKey)
      return encryptedKey.toString()
    } catch (err) {
      console.error(err)
    }
  }