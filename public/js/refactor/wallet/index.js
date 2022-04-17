/* Check for browser support of credentials API */
if (!(navigator.credentials && navigator.credentials.preventSilentAccess)) {
  alert('Your browser does not support credential management API')
}

// If private key exists unencrypted, show appropriate warning
if (window.localStorage.getItem('pk')) {
  showInsecureWarning()
}
function showInsecureWarning () {
  let eKeyExists = !!window.localStorage.getItem('encryptedKey')
  if (eKeyExists) {
    warningMessageBanner(
      "You are in backup mode; your private key is insecure. " +
      "We recommend you sign out when you are done. " +
      "Your account is still saved on your browser, so you should " +
      "be able to log in with the correct username."
      )
    return
  } else {
    warningMessageBanner(
      "You are in backup mode; your private key is insecure. " +
      "We recommend you sign out when you are done. " +
      "Your account is no longer saved in your browser, so we " +
      "also recommend you transfer your assets to a new one."
    )
    return
  }
}

/* URL query parameters: Used to determine task.
* "connect" -> Connect, get address, and callback.
* "signTx" -> Connect, sign transaction, and callback.
* "createTx" -> Connect, create tx, sign tx, and callback.
*/
const params = new URLSearchParams(window.location.search)

/* Create web3 provider global. initWeb3 will be called on init() */
let web3js;

function initWeb3 (callback) {
  console.log('Loading web3js')
  web3js = new Web3('https://rpc.lappsnet.io')
  callback(web3js)
}

/* On window load, create web3 provider and initialize DOM */
window.addEventListener('load', e => {
  initWeb3((w3) => {
      initComponents()
  })
})
function initComponents () {
  // Hide irrelevant elements
  $('#connectLoginDetected').hide()
  $('#connectLoginNotDetected').hide()
  $('#deviceSelection').hide()
  $('#accountRegistrationForm').hide()
  $('#switchAccountForm').hide()
  $('#recoverAccountForm').hide()
  $('#registerAccountSpinner').hide()
  $('#privKeyPrompt').hide()
  $('#privKeyGenCase').hide()
  $('#privKeyTxCase').hide()
  $('#logoutModal').hide()
  $('#recoverModal').hide()
  $('#signMessageModal').hide()
  $('#signTxModal').hide()
  $('#signTxSpinner').hide()
  $('#createTxModal').hide()
  $('#createTxSpinner').hide()
  $('#createTxTokenContractForm').hide()
  $('#createTxFromAddressForm').hide()
  $('#createTxToAddressForm').hide()
  $('#createTxValueForm').hide()
  $('#createTxDataForm').hide()
  $('#createTxGasLimitForm').hide()
  $('#signTxSpinner').hide()
  clearSuccessBanner()
  clearWarningBanner()
  clearErrorBanner()
  $('#tokenBalances').hide()
  $('#contractCallModal').hide()
  $('#contractCallSpinner').hide()
  $('#confirmCallSpinner').hide()
  $('#continueWithAccountConfirmation').hide()
  $("#methodSelector").hide()
  $('#backupModal').hide()
  $('#backupFormBody').attr('action', window.location.href)

  // Login is unavailable if encryptedKey is not found locally
  if (!window.localStorage.getItem('encryptedKey')) {
    $('#login').attr('hidden', 'true')
  }

  loadWalletUI(true)
}

// Change text & display correct contents based on login status
async function loadWalletUI (firstLoad = false) {
  try {
    // Both encryptedKey and address should exist, or pk should exist, else log in
      if (!window.localStorage.getItem('pk') &&
          !(window.localStorage.getItem('encryptedKey')
            && window.localStorage.getItem('addr'))) {
          // Not logged in, show login prompt
          window.localStorage.removeItem('addr')
          window.localStorage.removeItem('user')
          $('#connectLoginNotDetected').show()
          return
      } else {
          // Logged in, show continuation prompt
          $('.usernameDisplay').text(window.localStorage.getItem('user'))
          $('.addressDisplay').text(window.localStorage.getItem('addr'))
          getBalance(web3js, window.localStorage.getItem('addr'))
          if (firstLoad) {
            $('#continueWithAccountConfirmation').show()
            return
          } else {
            $('#connectLoginDetected').show()
          }
      }
  } catch (err) {
      console.error(err)
  }
}

/* User who was already logged in is shown confirmation to continue with current account */

/* Change 'continue' button text based on query param.
* Create transaction is default.
*/
$('.actionType').text('Continue')
if (params.get("createTx") === "true") {
  $('.actionType').text('Create Transaction')
} else if (params.get("signTx") === "true") {
  $('.actionType').text('Sign Transaction')
} else if (params.get("connect") === "true") {
  $('.actionType').text('Connect Wallet')
} else if (params.get("contractCall") === "true") {
  $('.actionType').text('Call Contract')
} else {

}

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