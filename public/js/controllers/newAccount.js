/* newAccount.js - handles new account creation */
$('.createNewAccount').on('click', function() {
  // If currently logged in, log out first
  if (window.localStorage.getItem('IntMediumPrivateKey')) {
      // logout.logOutConf
      return logOutConf()
  }
  // If not logged in, get rid of localStorage and proceed
  window.localStorage.clear()
  $('#connectLoginDetected').hide()
  $('#connectLoginNotDetected').hide()
  $('#accountRegistrationForm').show()
})

$('#newUsernameInput').on('change', function() {
// Show spinner
$('#registerAccountSpinner').show()
// networking.checkUsernameAvailability
checkUsernameAvailability($('#newUsernameInput').val())
})

$('#registerAccount').on('click', createNewAccount)

async function createNewAccount () {
  if ($('#registerAccount').attr('class').includes('btn-disabled')) {
    return
  }
  try {
    // Create private key (remember to null web3PkObj when done)
    let web3PkObj = web3js.eth.accounts.create()
    rawPk = web3PkObj.privateKey
    // Request auth to server
    const attestationOptions
        = await submitRegistrationRequest($('#newUsernameInput').val())
    // Sign attestation
    const { encryptionPublicKey, registeredUsername }
        = await makeAttestation(attestationOptions)
    console.log(`Got encryption public key ${encryptionPublicKey}`)

    // Encrypt key with encryptionPublicKey
    let encryptedKey = await encryptPk(rawPk, encryptionPublicKey)
    console.log(`EncryptedKey = ${encryptedKey}`)

    // Store base64 encoded encryptedKey and username in localStorage
    window.localStorage.setItem('encryptedKey', encryptedKey)
    window.localStorage.setItem('user', registeredUsername)

    // Ask user to back up key, encrypted by a password
    // Also clears rawPk from memory
    showBackupModal()

    // Add address to localStorage
    window.localStorage.setItem('addr', web3PkObj.address)
    web3PkObj = null

    userPk = window.localStorage.getItem('encryptedKey')
    userAddress = window.localStorage.getItem('addr')
    userName =  window.localStorage.getItem('user')
    $('.addressDisplay').text(userAddress)
    $('.usernameDisplay').text(userName)
    $('#accountRegistrationForm').hide()
    $('#connectLoginDetected').show()
    getBalance(userAddress)

    // If not signing transaction
    if (params.get('connect')) {
      // Show signmessage modal
      if (!params.get('nonce')) {
        alert('Nonce not provided in query string')
        return
      }
      $('#signMessageInput').val(escapeHTML(params.get("nonce")))
      $('#signMessageModal').show()
    }
    // If signing transaction
    if (params.get('signTx')) {
      // Fill TX info and show form
      return $('#signTxForm').show()
    }
    // If creating transaction
    if (params.get('createTx')) {
      return
    }

  } catch (err) {
    console.error(err)
    alert(err)
  }
}