/* Fido functions
 * Requires base64.min.js for Base64URL <-> ArrayBuffer conversions
 */

/* Recover pk by authing with server & decrypting local encrypted key.
 * If local unencrypted key exists, just return that.
 */
async function authAndDecryptPk() {
  try {
    // If in backup mode (local unencrypted key exists), no need to auth with server
    if (window.localStorage.getItem('pk')) {
      return window.localStorage.getItem('pk')
    }
    // Authenticate with server
    let assertionOptions = await submitAuthenticationRequest(window.localStorage.getItem('user'))
    let assertionResult = await makeAssertion(assertionOptions)
    // Authentication will return pubkey if successful
    // Decrypt and return private key
    let pk = await decryptPk(window.localStorage.getItem('encryptedKey'), assertionResult.pubkey)
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

/* Send auth request to server, returns assertionOptions */
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

/* Use browser credentials API to make assertion & submit to server.
 * Returns public key, username
 */
async function makeAssertion(assertionOptions) {
  try {
    const assertion = await navigator.credentials.get({ publicKey: assertionOptions })
    const { pubkey, username } = await submitAssertionToServer(assertion)
    return ({ pubkey, username })
  } catch (err) {
    console.error(err)
  }
}

/* Submit signed assertion to server for authentication, returns { pubkey, username } */
async function submitAssertionToServer(assertion) {
  try {
    return new Promise((resolve, reject) => {
      console.log('Submitting assertion...')
      let rawId = new Uint8Array(assertion.rawId)
      let authenticatorData = new Uint8Array(assertion.response.authenticatorData);
      let clientDataJSON = new Uint8Array(assertion.response.clientDataJSON);
      let signature = new Uint8Array(assertion.response.signature)
      let assertionData = {
        id: assertion.id,
        rawId: base64.fromArrayBuffer(rawId),
        response: {
          authenticatorData: base64.fromArrayBuffer(authenticatorData, true),
          clientDataJSON: base64.fromArrayBuffer(clientDataJSON, true),
          signature: base64.fromArrayBuffer(signature)
        }
      }
      $.post('/api/postAssertion', {
        assertion: JSON.stringify(assertionData)
      }, function (res) {
        if (res.publicKey) {
          let pubkey = res.publicKey
          let username = res.username
          resolve({ pubkey, username })
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