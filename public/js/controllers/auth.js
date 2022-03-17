/* auth.js - handles user actions regarding sign in, sign up, recovery etc. */

/* When user chooses to continue with current account,
 * hide confirmation, show wallet UI, and
 * open relevant form
 */
$('.confirmAccount').on('click', function() {
  /* Hide confirmation form */
  $('#continueWithAccountConfirmation').hide()
  /* Show wallet UI in background */
  $('#connectLoginDetected').show()

  // If query is to connect, show nonce to sign
  if (params.get('connect') === 'true') {
    if (!params.get('nonce')) {
      alert('Nonce not provided in query string')
      return
    }
    $('#signMessageInput').val(escapeHTML(params.get("nonce")))
    $('#signMessageModal').show()
    return
  }
  // If query is to signTx, decode tx to string and show
  if (params.get('signTx') === 'true') {
    let ab = base64.toArrayBuffer(escapeHTML(params.get("txData")), true)
    let decoded = new TextDecoder().decode(ab).replace(/\//g, '\\/') // XSS mitigation
    let data = JSON.stringify(decoded, null, 2)
    $('#signTxInput').text(JSON.parse(data))
    $('#signTxModal').show()
    return
  }
  // If query is to createTx, show txBuilder
  if (params.get('createTx') === 'true') {
    // First, check for parameters to fill
    $('#satTxRadio').attr('checked', 'true')
    switchCreateTxFormType("1")
    if (params.get('contractAddress')) {
      $('#createTxTokenContract').val(escapeHTML(params.get('contractAddress')))
      $('#tokenTxRadio').attr('checked', 'true')
      switchCreateTxFormType("2")
    }
    if (params.get('amount')) {
      $('#createTxValue').val(escapeHTML(params.get('amount')))
    }
    if (params.get('to')) {
      $('#createTxToAddress').val(escapeHTML(params.get('to')))
    }
    $('#createTxModal').show()
    return
  }
  // If query is to call contract, show contract call form
  if (params.get('contractCall') === 'true') {
    // If contractAddress is in params, plug it in
    if (params.get('contractAddress')) {
        getContractMethods(escapeHTML(params.get('contractAddress')))
        return showContractCallModal({ contractAddress: escapeHTML(params.get('contractAddress'))})
    }
    return showContractCallModal()
  }
  // If no query, just show wallet UI
  return
})

/* Cases to cover:
 * User is logged in -> (A) Create new account,
 *                      (B) Recover acccount,
 *                      (C) Continue with current account
 * User is signed out-> (A) Create new account,
 *                      (B) Recover account,
 */

/* (A) User creates a new account.
 * Show username registration form.
 * Handled by controllers/newAccounts.js
 */

/* (B) Recover account from backup
 * Back up is private key
 * Also used to log into other account
 * Handled by controllers/recoverAccount.js
 */

/* (C) User signs in with current account.
 * If signing TX, continue to sign TX UI.
 * Otherwise, callback.
 */

$('.signMessageBtn').on('click', function() {
  // Sign the message with private key
  const signature = web3js.eth.accounts.sign($('#signMessageInput').val(), window.localStorage.getItem('IntMediumPrivateKey'))
  // Send the message to callback URL for auth
  const callbackUrl = decodeURIComponent(params.get('callbackUrl'))
  sendAddress(callbackUrl, signature)
  $('#signMessageModal').hide()
  alert('Address has been sent to application')
  window.close()
})

$('.cancelSignMessage').on('click', function() {
  $('#signMessageModal').hide()
})

$('.signOut').on('click', function() {
  logOutConf()
})

$('#logIn').on('click', function () {
  // Show login form
  $('#connectLoginNotDetected').hide()
  $('#switchAccountForm').show()
})

$('#logIntoAccount').on('click', async function() {
  try {
    // Authenticate with server
    let assertionOptions = await submitAuthenticationRequest($('#altUsernameInput').val())
    let { publicKey, username } = await makeAssertion(assertionOptions)
    // Authentication will return pubkey if successful
    // Recover addr and null privatekey
    let pk = recoverPk(window.localStorage.getItem('encryptedKey'), publicKey)
    let { address } = web3js.eth.accounts.privateKeyToAccount(pk)
    window.localStorage.setItem('addr', address)
    window.localStorage.setItem('user', username)
    pk = null
    
    // Show wallet UI
    $('#switchAccountForm').hide()
    loadWalletUI()

  } catch (err) {
    console.error(err)
  }

})