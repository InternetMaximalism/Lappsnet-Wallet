/* networking.js - handles requests to backend server */

function checkUsernameAvailability (username) {
  // Query server for username availability on each input
  $.post('/api/checkUsername', {
      username: username
  },
  function (res) {
      if (res.available === true) {
          // Show username as available
          $('#registerAccount').removeClass('btn-disabled btn-danger').addClass('btn-success')
          $('#registerAccountSpinner').hide()
      }
      return
  })
  .fail(function (res) {
      // Show username as unavailable
      $('#registerAccount').removeClass('btn-disabled btn-success').addClass('btn-danger')
      $('#registerAccountSpinner').hide()
      console.log(`Username unavailable`)
      return
  })
}

async function submitRegistrationRequest (username) {
  try {
      if (!$('#registerAccount').attr('class').includes('btn-success')) {
          // If not btn-success, don't waste time querying
          return
      }
      return new Promise((resolve, reject) => {
          $.post('/api/registerUsername', {
              username
          },
          function (res) {
              let returnObject = res
              if (res.rp) {
                  // Return JSON data
                  returnObject.challenge = base64.toArrayBuffer(res.challenge, true)
                  returnObject.user.id = base64.toArrayBuffer(res.user.id, true)
                  resolve(returnObject)
              } else {
                  // Show server error
                  console.log(`Server responded with invalid attestationOptions`)
                  reject()
              }
          })
      })
  } catch (err) {
      console.error(err)
      alert(err)
  }
}

async function submitAttestationToServer (attestation) {
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

async function submitAuthenticationRequest (username) {
    try {
        return new Promise((resolve, reject) => {
            $.post('/api/requestAuth', {
                username
            },
            function (res) {
                let authnOptions = res
                if (res.allowCredentials) {
                    for (i=0; i<authnOptions.allowCredentials.length; i++) {
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

async function submitAssertionToServer (assertion) {
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
            console.log(JSON.stringify(assData))
            $.post('/api/postAssertion', {
                assertion: JSON.stringify(assData)
            }, function (res) {
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
        })
        .fail(function (res) {
            console.error(`Server returned error`)
            reject()
        })

    } catch (err) {
        
    }
}

async function sendAddress (url, signature) {
  try {
    return new Promise((resolve, reject) => {
      $.post(url, {
        signature: signature,
        publicAddress: window.localStorage.getItem('IntMediumAddress')
      })
      .then((result) => {
          console.log('Callback sent to URL')
      })
    })
  } catch (err) {
    console.error(err)
  }
}

async function sendTransaction (url, transaction) {
    try {
        return new Promise((resolve, reject) => {
            $.post(url, {
                signedTx: transaction
            })
            .then((result) => {
                console.log('Signed TX sent to URL')
            })
        })
    } catch (err) {
        console.error(err)
    }
}
