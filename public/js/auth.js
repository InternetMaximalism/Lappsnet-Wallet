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
$('#address').hide()

if (!(navigator.credentials && navigator.credentials.preventSilentAccess)) {
    alert('Your browser does not support credential management API')
}

/* Initial state: Check for intMediumAddress, intMediumUsername, intMediumCredId
 * in window.localStorage and show correct prompt/confirmation.
 */
const params = new URLSearchParams(window.location.search)
console.log(params.get("connect"))
console.log(params.get("signTx"))

let userAddress = window.localStorage.getItem('IntMediumAddress')
let userName = window.localStorage.getItem('IntMediumUsername')
let userCredId = window.localStorage.getItem('IntMediumCredId')
if (userName, userCredId) {
    $('#userName-1').text(userName)
    $('#userName-2').text(userName)
    $('#connectLoginDetected').show()
} else {
    $('#connectLoginNotDetected').show()
}

/* Subflow: CONNECT User creates a new account.
 * Show username registration form.
 * Clicking create leads to private keygen and credId backup.
 */
$('#createNewAccount').on('click', function() {
    $('#connectLoginDetected').hide()
    $('#connectLoginNotDetected').hide()
    $('#accountRegistrationForm').show()
})

$('#registerAccount').on('click', async function() {
    if ($('#registerAccount').attr('class').includes('btn-disabled')) {
        return
    }
    try {
        // Request auth to server
        const { username, challenge, timeout }
            = await submitRegistrationRequest($('#newUsernameInput').val())
        // Sign attestationRequest
        const { credId, publicKey }
            = await makeAttestation(username, challenge, timeout)
        // Submit credId for storage on server. localStore credId, username if successful
        // We actually do not send the public key to server, as we want to use as private key
        const registration
            = await submitAttestationToServer(username, challenge, credId)
        // show private key generation / signing prompt
        $('#accountRegistrationForm').hide()
        const shortenedKey =buffer.Buffer.from(base64.toArrayBuffer(publicKey, true).slice(0,32))
        let { address } = web3js.eth.accounts.privateKeyToAccount('0x'.concat(shortenedKey.toString('hex')))
        localStorage.setItem('IntMediumAddress', address)
        $('#addressText').text(localStorage.getItem('IntMediumAddress'))
        $('#address').show()

        // If not signing transaction
        if (params.get('connect') && !params.get('signTx')) {
            return alert('callback triggered')
        }
        // If signing transaction
        if (params.get('signTx')) {
            return $('#signTxForm').show()
        }

    } catch (err) {
        console.error(err)
        alert(err)
    }
})

$('#privKeyButton').on('click', function(tx = null) {
        // Generate pk & address from (userName, credId) and store userAddress
        getPk({
            username: window.localStorage.getItem('IntMediumUsername'),
            credId: window.localStorage.getItem('IntMediumCredId')
        })
})

/* Subflow displayLoginConfirmation-1: User signs in with current account.
 * If signing TX, continue to sign TX UI.
 * Otherwise, callback.
 */
$('#continueWithAccount').on('click', function() {
    // Generate pk & address from (userName, credId) and store userAddress
    getPk({
        username: window.localStorage.getItem('IntMediumUsername'),
        credId: window.localStorage.getItem('IntMediumCredId')
    })
})

$('#chooseDifferentAccount-1').on('click', function() {
    localStorage.clear()
    $('#connectLoginDetected').hide()
    $('#connectLoginNotDetected').show()
})

/* Subflow displayLoginPrompt-2: User chooses sign into different account.
 * Subflow for displayLoginConfirmation-2 as well.
 * Show username selection input.
 * Signing in leads to TX signing or callback.
 */

$('#chooseDifferentAccount-2').on('click', function() {
    localStorage.clear()
    $('#connectLoginDetected').hide()
    $('#connectLoginNotDetected').show()
})

$('#newUsernameInput').on('change', function() {
    // Show spinner
    $('#registerAccountSpinner').show()
    checkUsernameAvailability($('#newUsernameInput').val())
})