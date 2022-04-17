
/* Query param 'connect' 'nonce' causes the user to see a nonce/message to sign in a modal. */

/* Click button to sign message */
$('.signMessageBtn').on('click', function () {
  signMessageBtn()
})

/* Click to cancel signing */
$('.cancelSignMessage').on('click', function () {
  $('#signMessageModal').hide()
})

async function signMessageBtn() {
  try {
    // Sign the message with private key
    let pk = await authAndDecryptPk()
    const signature = await web3js.eth.accounts.sign($('#signMessageInput').val(), pk)
    pk = null
    // Send the message to callback URL for auth. callbackUrl is REQUIRED
    const callbackUrl = decodeURIComponent(params.get('callbackUrl'))
    if (callbackUrl === 'null') throw Error('callbackUrl MUST be defined')
    sendAddress(callbackUrl, signature)
    // Close modal, alert user, close window (*only if opened by JS)
    $('#signMessageModal').hide()
    alert('Address has been sent to application')
    window.close()
  } catch (err) {
    console.error(err)
  }
}