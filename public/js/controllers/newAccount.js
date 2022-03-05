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
    // Request auth to server
    const { username, challenge, timeout }
        = await submitRegistrationRequest($('#newUsernameInput').val())
    // Sign attestationRequest
    const { credId, publicKey }
        = await makeAttestation(username, challenge, timeout)
    // Submit credId for storage on server. localStore credId, username if successful
    // We actually do not send the public key to server, as we want to use as private key
    const registration
        = await submitAttestationToServer(username, challenge, credId)
    // show private key generation / signing prompt
    $('#accountRegistrationForm').hide()
    const shortenedKey = buffer.Buffer.from(base64.toArrayBuffer(publicKey, true).slice(0,32))
    let { address } = web3js.eth.accounts.privateKeyToAccount('0x'.concat(shortenedKey.toString('hex')))
    window.localStorage.setItem('IntMediumPrivateKey', '0x'.concat(shortenedKey.toString('hex')))
    window.localStorage.setItem('IntMediumAddress', address)
    window.localStorage.setItem('IntMediumUsername', username)
    userPk = window.localStorage.getItem('IntMediumPrivateKey')
    userAddress = window.localStorage.getItem('IntMediumAddress')
    userName =  window.localStorage.getItem('IntMediumUsername')
    $('.addressDisplay').text(localStorage.getItem('IntMediumAddress'))
    $('.usernameDisplay').text(localStorage.getItem('IntMediumUsername'))
    $('#connectLoginDetected').show()
    getBalance(userAddress)

    // If not signing transaction
    if (params.get('connect')) {
      // TODO: don't blindly sign; fill and show form
      // Sign the message with private key
      const signature = web3js.eth.accounts.sign($('#signMessageInput').val(), window.localStorage.getItem('IntMediumPrivateKey'))
      // Send the message to callback URL for auth
      const callbackUrl = decodeURIComponent(params.get('callbackUrl'))
      sendAddress(callbackUrl, signature)
        return alert('callback done')
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