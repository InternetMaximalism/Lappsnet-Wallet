/* User chooses to sign into an existing account */

$('#logIn').on('click', function () {
  // Show login form
  $('#connectLoginNotDetected').hide()
  $('#switchAccountForm').show()
})

$('#logIntoAccount').on('click', async function () {
  try {
    // Authenticate with server
    let assertionOptions = await submitAuthenticationRequest($('#altUsernameInput').val())
    let assResult = await makeAssertion(assertionOptions)
    // Authentication will return pubkey if successful
    // Recover addr and null privatekey
    let pk = await decryptPk(window.localStorage.getItem('encryptedKey'), assResult.assPubkey)
    let { address } = web3js.eth.accounts.privateKeyToAccount(pk)
    window.localStorage.setItem('addr', address)
    window.localStorage.setItem('user', assResult.assUsername)
    pk = null

    // Show wallet UI
    $('#switchAccountForm').hide()
    loadWalletUI()

  } catch (err) {
    console.error(err)
  }

})