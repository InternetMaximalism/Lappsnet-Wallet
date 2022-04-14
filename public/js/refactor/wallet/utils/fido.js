/* Fido functions
 * Requires base64.min.js for Base64URL <-> ArrayBuffer conversions
 */

/* Recover pk by authing with server & decrypting local encrypted key.
 * If local unencrypted key exists, just return that.
 */
async function authAndDecryptPk() {
  try {
    // If in backup mode, no need to auth with server
    if (window.localStorage.getItem('pk')) {
      return window.localStorage.getItem('pk')
    }
    // Authenticate with server
    let assertionOptions = await submitAuthenticationRequest(window.localStorage.getItem('user'))
    let assResult = await makeAssertion(assertionOptions)
    // Authentication will return pubkey if successful
    // Recover addr and null privatekey
    let pk = await decryptPk(window.localStorage.getItem('encryptedKey'), assResult.assPubkey)
    return pk
  } catch (err) {
    console.error(err)
  }
}

/* Decrypt encrypted key using encryption key.
 * Base64 String encrypted pk, Base64 String encryption key (FIDO assertion pubkey)
 * => Hex String privkey
 */
async function decryptPk(encryptedKey, encryptionKey) {
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
async function encryptPk(pk, encryptionKey) {
  try {
    let utf8key = CryptoJS.enc.Utf8.parse(pk)
    let encryptedKey = CryptoJS.AES.encrypt(utf8key, encryptionKey)
    return encryptedKey.toString()
  } catch (err) {
    console.error(err)
  }
}

/* Registration flow: see also components/newAccount.js */
/* Create (username, credId) pair: 
   Takes username, challenge (base64) and creates an attestation.
   The credential public key is used as IntMedium account private key. */
async function makeAttestation(attestationOptions) {
  try {
    const attestation = await navigator.credentials.create({ publicKey: attestationOptions })
    const { publicKey, username } = await submitAttestationToServer(attestation)
    return { encryptionPublicKey: publicKey, registeredUsername: username }

  } catch (err) {
    console.error(err)
  }
}

/* Submit attestation, incl. pubkey, to server for registration */
async function submitAttestationToServer(attestation) {
  try {
    return new Promise((resolve, reject) => {
      console.log(`Submitting attestation...`)
      let attestationObject = new Uint8Array(attestation.response.attestationObject);
      let clientDataJSON = new Uint8Array(attestation.response.clientDataJSON);
      let rawId = new Uint8Array(attestation.rawId);
      let attData = {
        id: attestation.id,
        rawId: base64.fromArrayBuffer(rawId),
        response: {
          attestationObject: base64.fromArrayBuffer(attestationObject, true),
          clientDataJSON: base64.fromArrayBuffer(clientDataJSON, true)
        }
      }
      $.post('/api/postAttestation', {
        attestation: JSON.stringify(attData)
      },
        function (res) {
          if (res.publicKey) {
            console.log(`Credential public key returned: ${res.publicKey}`)
            resolve({ publicKey: res.publicKey, username: res.username })
          } else {
            // Show server error
            console.log(`Server responded invalid data`)
            reject()
          }
        },
        "json")
        .fail(function (res) {
          console.error(`Server returned error`)
          reject()
        })
    })
  } catch (err) {
    console.error(err)
    alert(err)
  }
}

/* Authentication flow: see also components/login.js */
/* Ask server to auth as username */
async function submitAuthenticationRequest(username) {
  try {
    return new Promise((resolve, reject) => {
      $.post('/api/requestAuth', {
        username
      },
        function (res) {
          let authnOptions = res
          if (res.allowCredentials) {
            for (i = 0; i < authnOptions.allowCredentials.length; i++) {
              authnOptions.allowCredentials[i].id = base64.toArrayBuffer(res.allowCredentials[i].id, true)
            }
            authnOptions.challenge = base64.toArrayBuffer(res.challenge, true)
            console.log(authnOptions)
            // Return JSON data
            resolve(authnOptions)
          } else {
            // Show server error
            console.log(`Server responded with invalid assertionOptions`)
            reject()
          }
        })
    })
  } catch (err) {
    console.error(err)
    alert(err)
  }
}

/* Create assertion with keypair */
async function makeAssertion(assertionOptions) {
  try {
    const assertion = await navigator.credentials.get({ publicKey: assertionOptions })
    const { assPubkey, assUsername } = await submitAssertionToServer(assertion)
    return ({ assPubkey, assUsername })
  } catch (err) {
    console.error(err)
  }
}

/* Submit assertion to authenticate, receive public key (used to encrypt/decrypt private key) */
async function submitAssertionToServer(assertion) {
  try {
    return new Promise((resolve, reject) => {
      console.log('Submitting assertion...')
      let rawId = new Uint8Array(assertion.rawId)
      let authenticatorData = new Uint8Array(assertion.response.authenticatorData);
      let clientDataJSON = new Uint8Array(assertion.response.clientDataJSON);
      let signature = new Uint8Array(assertion.response.signature)
      let assData = {
        id: assertion.id,
        rawId: base64.fromArrayBuffer(rawId),
        response: {
          authenticatorData: base64.fromArrayBuffer(authenticatorData, true),
          clientDataJSON: base64.fromArrayBuffer(clientDataJSON, true),
          signature: base64.fromArrayBuffer(signature)
        }
      }
      $.post('/api/postAssertion', {
        assertion: JSON.stringify(assData)
      }, function (res) {
        if (res.publicKey) {
          let assPubkey = res.publicKey
          let assUsername = res.username
          resolve({ assPubkey, assUsername })
        } else {
          // Show server error
          console.log(`Server responded invalid data`)
          reject()
        }
      },
        "json")
        .fail(function (res) {
          console.error(`Server returned error`)
          reject()
        })
    })
  } catch (err) {
    console.error(err)
  }
}