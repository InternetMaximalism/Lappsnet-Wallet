/* newAccount.js - handles new account creation */

/* Craete new account button - shows logout confirmation if logged in,
 * else clears localStorage and shows registration form
 */
$('.createNewAccount').on('click', function () {
  if (window.localStorage.getItem('encryptedKey')) {
    return logOutConf()
  }
  window.localStorage.clear()
  $('#connectLoginDetected').hide()
  $('#connectLoginNotDetected').hide()
  $('#accountRegistrationForm').show()
})

// When username is input, check for availability
$('#newUsernameInput').on('change', function () {
  $('#registerAccountSpinner').show()
  checkUsernameAvailability($('#newUsernameInput').val())
})

// On register, start registration flow
$('#registerAccount').on('click', createNewAccount)

async function createNewAccount() {
  if ($('#registerAccount').attr('class').includes('btn-disabled')) {
    return
  }
  try {
    // Create new private key (remember to null web3PkObj when done)
    let web3PkObj = web3js.eth.accounts.create()
    // Request auth to server
    const attestationOptions
      = await submitRegistrationRequest($('#newUsernameInput').val())
    // Sign attestation and submit, receive public key (encryption key)
    const { encryptionPublicKey, registeredUsername }
      = await makeAttestation(attestationOptions)

    // Encrypt key with encryptionPublicKey
    let encryptedKey = await encryptPk(web3PkObj.privateKey, encryptionPublicKey)

    // Store base64 encoded encryptedKey and username, address in localStorage
    window.localStorage.setItem('encryptedKey', encryptedKey)
    window.localStorage.setItem('user', registeredUsername)
    window.localStorage.setItem('addr', web3PkObj.address)

    // Ask user to back up key, encrypted by a password
    // rawPk is a global defined in backUpAccount.js, used only for backup
    // It is also nulled in backUpAccount.js
    rawPk = web3PkObj.privateKey
    showBackupModal()

    // Null object containing privkey
    web3PkObj = null

    // Show Wallet UI with address & user values
    $('.addressDisplay').text(window.localStorage.getItem('addr'))
    $('.usernameDisplay').text(window.localStorage.getItem('user'))
    $('#accountRegistrationForm').hide()
    $('#connectLoginDetected').show()
    getBalance(window.localStorage.getItem('addr'))

    // Check params. If 'connect', show signmessage modal
    if (params.get('connect')) {
      if (!params.get('nonce')) {
        alert('Nonce not provided in query string')
        return
      }
      $('#signMessageInput').val(escapeHTML(params.get("nonce")))
      $('#signMessageModal').show()
    }
    // If signing transaction, show TX to sign
    if (params.get('signTx')) {
      return $('#signTxForm').show()
    }
    // If creating transaction, show wallet UI
    if (params.get('createTx')) {
      // TODO: show create TX form
      return
    }
    // If calling contract, show wallet UI
    // TODO: show contract call form

  } catch (err) {
    console.error(err)
    alert(err)
  }
}

// Query server for availability when username is entered
function checkUsernameAvailability(username) {
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

/* Choose a username and request registration */
async function submitRegistrationRequest(username) {
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