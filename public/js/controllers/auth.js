/* auth.js - handles connect wallet request */

/* Initial state: Check for intMediumPrivateKey, intMediumAddress, intMediumUsername,
 * intMediumCredId in window.localStorage and show correct prompt/confirmation.
 */

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

$('.continueWithAccount').on('click', function() {
  // If query is to connect, show nonce to sign
  if (params.get('connect') === 'true') {
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
      $('#createTxModal').show()
      return
  }
  // If no query, default to createTx
  $('#createTxModal').show()
  return
})

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