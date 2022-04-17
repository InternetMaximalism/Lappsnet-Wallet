/* signTx.js - signs transaction passed as query parameter */

/* When the signTx modal is open, the user sees the transaction to sign.
 * The cancel and sign buttons have actions as follows:
 */
$('.cancelSignTx').on('click', function () {
  $('#signTxModal').hide()
})

$('.signTxBtn').on('click', function () {
  // Prevent double click
  $('#signTxSpinner').show()
  $('#signTxBtn').attr('disabled', true)
  clearErrorBanner()
  // Sign TX
  signTxBtn()
})

/* Sign TX flow */
async function signTxBtn() {
  try {
    // Sign the transaction with private key
    let ab = base64.toArrayBuffer(escapeHTML(params.get("txData")), true)
    let decoded = new TextDecoder().decode(ab)
    let pk = await authAndDecryptPk()
    let { rawTransaction } = await web3js.eth.accounts.signTransaction(
      JSON.parse(decoded),
      pk)
    // Clear private key from memory
    pk = null
    // Submit transaction
    let sendResult = await web3js.eth.sendSignedTransaction(rawTransaction)

    // Update balance in UI
    web3js.eth.getBalance(
      window.localStorage.getItem('addr'),
      "pending",
      function (err, res) {
        if (err) return console.error(err)
        $('#esatBalance').text(web3js.utils.fromWei(res))
      })

    // Callback
    const callbackUrl = decodeURIComponent(params.get('callbackUrl'))
    if (callbackUrl !== 'null') {
      sendTransaction(callbackUrl, sendResult.transactionHash)
    }
    // Reset signTx modal and hide
    $('#signTxSpinner').hide()
    $('#signTxBtn').attr('disabled', false)
    $('#signTxModal').hide()
  } catch (err) {
    // Reset signTx modal and hide
    $('#signTxSpinner').hide()
    $('#signTxBtn').attr('disabled', false)
    $('#signTxModal').hide()
    // Show error banner
    errorMessageBanner(err)
    return console.error(err)
  }
}
