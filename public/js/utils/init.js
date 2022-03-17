/* init.js Initializes components on the page and checks for browser support
 * If user is logged in, handles query string to show proper form
 * If user is not logged in, shows options to register or recover account
 */
initComponents()
function initComponents () {
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
    $('#successBanner').hide()
    $('#errorBanner').hide()
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

    loadWalletUI()
}

if (!(navigator.credentials && navigator.credentials.preventSilentAccess)) {
    alert('Your browser does not support credential management API')
}

// Change text & display correct contents based on login status
let userPk = window.localStorage.getItem('encryptedKey')
let rawPk = null
let userAddress = window.localStorage.getItem('addr')
let userName = window.localStorage.getItem('user')
let tokenList = []
async function loadWalletUI () {
    try {
        if (!(window.localStorage.getItem('encryptedKey')
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
            $('#continueWithAccountConfirmation').show()
            tokenList = await getTokenBalances(window.localStorage.getItem('addr'))
        }
    } catch (err) {
        console.error(err)
    }
}

/* URL query parameters: Used to determine task.
 * "connect" -> Connect, get address, and callback.
 * "signTx" -> Connect, sign transaction, and callback.
 * "createTx" -> Connect, create tx, sign tx, and callback.
 */
const params = new URLSearchParams(window.location.search)

/* Show different text based on query param.
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

function hideWalletOptions () {
    $('.createTxTopBtn').hide()
    $('.contractCallTopBtn').hide()
    $('.continueWithAccount').hide()
}

function successMessage (message) {
    $('#successBanner').show()
    $('#successMessage').text(escapeHTML(message))
}