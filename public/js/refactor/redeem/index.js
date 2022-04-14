/* Create web3 provider global. initWeb3 will be called on init() */
let web3js;

function initWeb3(callback) {
  console.log('Loading web3js')
  web3js = new Web3('https://rpc.lappsnet.io')
  callback(web3js)
}

////// getBalance() is in './utils/esatBalance'

/* On page load, initialize web3 provider, then initialize DOM */
window.addEventListener('load', e => {
  initWeb3((w3) => {
    initComponents()
  })
})
function initComponents() {
  // Hide irrelevant elements.
  $('#successBanner').hide()
  $('#warningBanner').hide()
  $('#errorBanner').hide()
  $('#redeemModal').hide()
  $('#redeemSpinner').hide()

  // Redemption is unavailable if encrypted or unencrypted key is not found in browser
  if (!window.localStorage.getItem('encryptedKey') && !window.localStorage.getItem('pk')) {
    // Redirect to wallet for login
    window.location.href = '/auth'
  }

  // Get ESAT balance to display
  getBalance(web3js)
}

// Click redeem button to show modal
$('.redeemEsatsButton').on('click', function () {
  $('#redeemModal').show()
})

// Click cancel button to hide modal
$('.cancelRedemption').on('click', function () {
  $('#redeemModal').hide()
  $('#redeemSpinner').hide()
})

////// parseInvoice() is in './utils/parseInvoice'

// When invoice is entered, validate invoice & display ESAT amount to send
$('#redeemInvoice').change(async function() {
  try {
    let esatAmt = await parseInvoice($('#redeemInvoice').val().trim())
    $('#sendEsatAmt').val(esatAmt)
  } catch (err) {
    $('#sendEsatAmt').val(err)
    console.error(err)
  }
})

////// authAndDecryptPk() is in './utils/fido'

////// submitRedemptionReq() is in './utils/requestSats'

// Click redeem button in modal to initiate redemption sequence
$('#redeemBtn').on('click', async function () {
  try {
    // Prevent double click
    $('#redeemSpinner').show()
    $('#redeemBtn').attr('disabled', true)

    // Simple check for invoiceUrl validity. Only checks `lnbc...` format and amount < ESAT balance.
    // Full validation occurs on server after submit.
    let invoiceUrl = $('#redeemInvoice').val().trim()
    let esatAmt = await parseInvoice(invoiceUrl)

    // Step zero: get pk (fido auth or localStorage.getItem('pk'))
    let pk = await authAndDecryptPk()
    
    // If no address stored locally, get address from pk
    if (window.localStorage.getItem('addr') === null) {
      let { address } = await web3js.eth.accounts.privateKeyToAccount(pk)
      window.localStorage.setItem('addr', address)
    }
   
    // Step one: sign invoice
    await web3js.eth.accounts.wallet.add(pk)
    const signature = await web3js.eth.sign(invoiceUrl, window.localStorage.getItem('addr'))
    await web3js.eth.accounts.wallet.remove(window.localStorage.getItem('addr'))

    // Step two: send ESATs to redemption address 0x8e35ec29bA08C2aEDD20f9d20b450f189d69687F
    let value = await web3js.utils.toWei((esatAmt).toString())
    const { rawTransaction } = await web3js.eth.accounts.signTransaction(
      { to: "0x8e35ec29bA08C2aEDD20f9d20b450f189d69687F", value: value, gas: "21000" },
      pk
    )
    const { transactionHash } = await web3js.eth.sendSignedTransaction(rawTransaction)

    // Step three: call Lappsnet API with { signature, invoiceUrl, transactionHash }
    await submitRedemptionReq(signature, invoiceUrl, transactionHash)

    // Finally, clear privkey and show result
    pk = null
    $('#redeemSpinner').hide()
    $('#redeemBtn').attr('disabled', false)
    $('#redeemModal').hide()
    $('#successBanner').show()
    $('#successText').text('Redemption is being processed; check your LN wallet.')

  } catch (err) {
    // Reset & hide redeem modal
    $('#redeemSpinner').hide()
    $('#redeemBtn').attr('disabled', false)
    $('#redeemModal').hide()
    console.error(err)
    // Show error banner
    $('#errorText').text(err)
    $('#errorBanner').show()
  }
})