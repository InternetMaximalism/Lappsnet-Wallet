/* init.js Initializes components on the page and checks for browser support */

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

if (!(navigator.credentials && navigator.credentials.preventSilentAccess)) {
    alert('Your browser does not support credential management API')
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
$('.actionType').text('Connect')
if (params.get("createTx") === "true" ||
    (params.get("signTx") !== "true" && params.get("connect") !== "true")) {
    $('.actionType').text('Create Transaction')
}
if (params.get("signTx") === "true") {
    $('.actionType').text('Sign Transaction')
}
if (params.get("connect") === "true") {
    $('.actionType').text('Connect Wallet')
}

let userPk = window.localStorage.getItem('IntMediumPrivateKey')
let userAddress = window.localStorage.getItem('IntMediumAddress')
let userName = window.localStorage.getItem('IntMediumUsername')
// let userCredId = window.localStorage.getItem('IntMediumCredId')

// Change text & display correct contents based on login status
let tokenList = []
readArgs()

async function readArgs() {
    try {
        if (userName) {
            $('#userName-1').text(userName)
            $('#userName-2').text(userName)
        }
        if (userPk && userAddress) {
            $('#address-1').text(userAddress)
            $('#connectLoginDetected').show()
            tokenList = await getTokenBalances(userAddress)
        } else {
            window.localStorage.clear()
            $('#connectLoginNotDetected').show()
        }
    } catch (err) {
        console.error(err)
    }
}