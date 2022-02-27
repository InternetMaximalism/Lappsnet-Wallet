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
$('#createTxModal').hide()
$('#createTxTokenContractForm').hide()
$('#createTxFromAddressForm').hide()
$('#createTxToAddressForm').hide()
$('#createTxValueForm').hide()
$('#createTxDataForm').hide()
$('#createTxGasLimitForm').hide()
$('#successBanner').hide()
$('#errorBanner').hide()

if (!(navigator.credentials && navigator.credentials.preventSilentAccess)) {
    alert('Your browser does not support credential management API')
}

/* URL query parameters: Used to determine task.
 * "connect" -> Connect, get address, and callback.
 * "signTx" -> Connect, sign transaction, and callback.
 * "createTx" -> Connect, create tx, sign tx, and callback.
 */
function escapeHTML (string) {
    return string.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&#x27;')
                 .replace(/`/g, '&#x60')
}
const params = new URLSearchParams(window.location.search)
console.log(params.get("connect"))
console.log(params.get("signTx"))
console.log(params.get("createTx"))

/* Show different text based on query param.
 * Connect is default & highest priority.
 * Make transaction is lowest priority.
 */
$('.actionType').text('Connect')
if (params.get("createTx") === "true") {
    $('.actionType').text('Create Transaction')
}
if (params.get("signTx") === "true") {
    $('.actionType').text('Sign Transaction')
}
if (params.get("connect") === "true") {
    $('.actionType').text('Connect Wallet')
}

/* Initial state: Check for intMediumPrivateKey, intMediumAddress, intMediumUsername,
 * intMediumCredId in window.localStorage and show correct prompt/confirmation.
 */

let userPk = window.localStorage.getItem('IntMediumPrivateKey')
let userAddress = window.localStorage.getItem('IntMediumAddress')
let userName = window.localStorage.getItem('IntMediumUsername')
// let userCredId = window.localStorage.getItem('IntMediumCredId')
if (userName) {
    $('#userName-1').text(userName)
    $('#userName-2').text(userName)
}
if (userPk && userAddress) {
    console.log('pk and address detected')
    $('#address-1').text(userAddress)
    $('#connectLoginDetected').show()
} else {
    window.localStorage.clear()
    $('#connectLoginNotDetected').show()
}

/* Cases to cover:
 * User is logged in -> (A) Create new account,
 *                      (B) Recover acccount,
 *                      (C) Continue with current account
 * User is signed out-> (A) Create new account,
 *                      (B) Recover account,
 */

/* (A) User creates a new account.
 * Show username registration form.
 * Handled by newAccounts.js
 */
$('.createNewAccount').on('click', function() {
    // If currently logged in, log out first
    if (window.localStorage.getItem('IntMediumPrivateKey')) {
        return logOutConf()
    }
    // If not logged in, get rid of localStorage and proceed
    window.localStorage.clear()
    $('#connectLoginDetected').hide()
    $('#connectLoginNotDetected').hide()
    $('#accountRegistrationForm').show()
})

$('#privKeyButton').on('click', function(tx = null) {
        // Generate pk & address from (userName, credId) and store userAddress
        getPk({
            username: window.localStorage.getItem('IntMediumUsername'),
            credId: window.localStorage.getItem('IntMediumCredId')
        })
})

/* (B) Recover account from backup
 * Back up is private key
 * Also used to log into other account
 * To be implemented
 */
$('.recoverAccount').on('click', function() {
    recoverModal()
})

$('.chooseDifferentAccount').on('click', function() {
    logOutConf()
})

function logOutConf () {
    // Show modal
    $('#logoutModal').show()
    $('.logOutBtn').attr('disabled', true)
    $('.backUpKey').show()
}

$('.addressDisplay').on('click', function() {
    // On clicking an address, copy it from localStorage to clipboard
    navigator.clipboard.writeText(window.localStorage.getItem('IntMediumAddress'))
    alert(`Copied address ${window.localStorage.getItem('IntMediumAddress')} to clipboard!`)
})

$('.privkeyDisplay').on('click', function() {
    // On clicking a privkey, copy it to clipboard
    navigator.clipboard.writeText($('#backupKeyText').val())
    alert('Copied private key to clipboard - remember to save it!')
})

// If log out confirmed, clear localStorage & show fresh login prompt
$('.logOutBtn').on('click', function() {
    localStorage.clear()
    $('#connectLoginDetected').hide()
    $('#logoutModal').hide()
    $('#connectLoginNotDetected').show()
})

$('.cancelBackup').on('click', function() {
    $('#logoutModal').hide()
    $('#backUpKeyText').hide()
})

// If recover selected, show backup modal
$('.backUpKey').on('click', function() {
    // Show key in modal
    $('#backUpKeyText').show()
    $('#backUpKeyText').text(window.localStorage.getItem('IntMediumPrivateKey'))
    // Hide button
    $('.backUpKey').hide()
    // Enable log out button
    $('.logOutBtn').attr('disabled', false)
})

function recoverModal () {
    // Show modal
    $('#recoverModal').show()
}

$('.recoverBtn').on('click', function() {
    // Check key is hex, 64 bytes or '0x' prefix + 64 bytes
    console.log('Checking key')
    let keyInput = $('#recoveryKeyInput').val().trim()
    if (
          ( keyInput.slice(0,2) === '0x' &&
            keyInput.length === 66) &&
            /[0-9A-Fa-f]{6}/g.test(keyInput.slice(2,66)
          )
        || 
          ( keyInput.slice(0,2) !== '0x' && 
            keyInput.length === 64 &&
            /[0-9A-Fa-f]{6}/g.test(keyInput))
        ) {

    } else {
        console.error('Key format is wrong')
        return alert('Key format invalid: must be 32 bytes hex, with or without 0x prefix')
    }
    
    // Get address
    let split = keyInput.split('0x')
    let { address } = web3js.eth.accounts.privateKeyToAccount('0x'.concat(split[split.length-1]))
    // Store private key and address
    window.localStorage.setItem('IntMediumPrivateKey', '0x'.concat(split[split.length-1]))
    window.localStorage.setItem('IntMediumAddress', address)
    // Hide modal, show account
    $('#recoverModal').hide()
    $('#connectLoginNotDetected').hide()
    $('#connectLoginDetected').show()
    // Callback
    alert('callback')
})

$('.cancelRecovery').on('click', function() {
    $('#recoverModal').hide()
})

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
    // If query is to signTx, decode tx to string and show TX to sign
    if (params.get('signTx') === 'true') {
        let ab = base64.toArrayBuffer(escapeHTML(params.get("txData")), true)
        let decoded = new TextDecoder().decode(ab)
        let data = JSON.stringify(decoded, null, 2)
        $('#signTxInput').val(data)
        $('#signTxModal').show()
        return
    }
    // If query is to createTx, show txBuilder
    if (params.get('createTx') === 'true') {
        $('#createTxModal').show()
        return
    }
    // If no query, tell user no action was specified
    alert('No callback orders were given. Specify connect, signTx, or createTx in the query with relevant arguments')
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

$('.signTxBtn').on('click', function() {
    $('#errorBanner').hide()
    // Sign the transaction with private key
    let ab = base64.toArrayBuffer(escapeHTML(params.get("txData")), true)
    let decoded = new TextDecoder().decode(ab)
    const callbackUrl = decodeURIComponent(params.get('callbackUrl'))
    web3js.eth.accounts.signTransaction(
        JSON.parse(decoded),
        window.localStorage.getItem('IntMediumPrivateKey'),
        (err, result) => {
            if (err) {
                $('#errorText').text(err)
                $('#errorBanner').show()
                return console.error(err)
            }
            web3js.eth.sendSignedTransaction(result.rawTransaction)
            sendTransaction(callbackUrl, result)
            $('#signTxModal').hide()
            alert('Transaction sent, application notified')
            window.close()
        })
})

$('#createTxType').change(function() {
    let option = $('option:selected').val()
    if (option === "1") {
        $('#createTxTokenContractForm').hide()
        $('#createTxFromAddressForm').hide()
        $('#createTxToAddressForm').show()
        $('#createTxValueForm').show()
        $('#createTxDataForm').hide()
        $('#createTxGasLimitForm').show()
        $('#createTxGasLimit').val('2000000')
    }
    if (option === "2") {
        $('#createTxTokenContractForm').show()
        $('#createTxFromAddressForm').show()
        $('#createTxToAddressForm').hide()
        $('#createTxValueForm').show()
        $('#createTxDataForm').show()
        $('#createTxGasLimitForm').show()
    }
    if (option === "3") {
        $('#createTxTokenContractForm').show()
        $('#createTxFromAddressForm').show()
        $('#createTxToAddressForm').show()
        $('#createTxValueForm').show()
        $('#createTxDataForm').show()
        $('#createTxGasLimitForm').show()
    }
})

$('.createTxBtn').on('click', function() {
    $('#errorBanner').hide()
    // Create the transaction based on txType
    let option = $('option:selected').val()
    if (!["1", "2", "3"].includes(option)) {
        // txTpe not selected
        return console.error('Select valid transaction type')
    }
    let tx = {}
    if (option === "1") {
        tx.to = $('#createTxToAddress').val()
        tx.value = web3js.utils.toWei($('#createTxValue').val())
        tx.gas = $('#createTxGasLimit').val()
    }
    if (option === "2") {
        return console.log('ERC20 transactions not yet implemented')
    }
    if (option === "3") {
        return console.log('Contract invocations not yet implemented')
    }

    // Sign the transaction
    web3js.eth.accounts.signTransaction(
        tx,
        window.localStorage.getItem('IntMediumPrivateKey'),
        (err, result) => {
            if (err) return console.error(err)
            // Broadcast the transaction
            web3js.eth.sendSignedTransaction(result.rawTransaction,
                (err, result) => {
                    if (err) {
                        $('#errorText').text(err)
                        $('#errorBanner').show()
                        return console.error(err)
                    }
                    $('#successBanner').show()
                })
            // Callback with transaction data IF callback is defined
            const callbackUrl = decodeURIComponent(params.get('callbackUrl'))
            if (params.get('callbackUrl') !== null) {
                console.log('Invoking callback')
                sendTransaction(callbackUrl, result)
            }
        })
    $('#createTxModal').hide()
})

$('.cancelSignMessage').on('click', function() {
    $('#signMessageModal').hide()
})
$('.cancelSignTx').on('click', function() {
    $('#signTxModal').hide()
})
$('.cancelCreateTx').on('click', function() {
    $('#createTxModal').hide()
})

$('.signOut').on('click', function() {
    logOutConf()
})