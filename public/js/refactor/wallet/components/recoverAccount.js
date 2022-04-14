/* recoverAccount.js - recover account from privkey */

/* Open recover account modal */
$('.recoverAccount').on('click', function () {
  $('#recoverModal').show()
})

/* Cancel recovery, close modal */
$('.cancelRecovery').on('click', function () {
  $('#recoverModal').hide()
})

/* When recovery form is submitted, do not submit anything
 * Instead, start account recovery flow
 */
$('#recoveryFormBody').submit(function (event) {
  // Prevent form from submitting anything. Necessary to stay on page.
  event.preventDefault()
  accountRecoveryHandler()
})

/* Recover account from encrypted backup and passphrase */
async function accountRecoveryHandler() {
  try {
    // Decrypt recovery key with pass phrase
    let recoveredPk = await decryptPk($('#encryptedBackup').val(), $('#yourPw').val())
    // Get address
    let { privateKey, address } = await web3js.eth.accounts.privateKeyToAccount(recoveredPk)
    window.localStorage.setItem('pk', privateKey)
    window.localStorage.setItem('addr', address)
    // Null private key in memory. Note that pk is stored unencrypted in localStorage regardless!
    recoveredPk = null
    privateKey = null

    // Hide modal, reload wallet UI with account
    $('#recoverModal').hide()
    $('#connectLoginNotDetected').hide()
    clearWarningBanner()
    loadWalletUI()
    // Make sure insecure warning is displayed
    showInsecureWarning()
  } catch (err) {
    console.error(err)
  }
}