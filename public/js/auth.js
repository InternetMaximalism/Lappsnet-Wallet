$('#loginPrompt').hide()
$('#loginConf').hide()
$('#deviceSelection').hide()
$('#accountRegistrationForm').hide()
$('#switchAccountForm').hide()
$('#recoverAccountForm').hide()
$('#registerAccountSpinner').hide()
$('#privKeyPrompt').hide()
$('#privKeyGenCase').hide()
$('#privKeyTxCase').hide()

/* This code block causes issues on mobile!
if (!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    alert('Your browser does not support biometric authentication.')
}
*/

if (!(navigator.credentials && navigator.credentials.preventSilentAccess)) {
    alert('Your browser does not support credential management API')
}

/* Initial state: Check for intMediumAddress, intMediumUsername, intMediumCredId
 * in window.localStorage and show correct prompt/confirmation.
 */

let userAddress = window.localStorage.getItem('intMediumAddress')
let userName = window.localStorage.getItem('intMediumUsername')
let userCredId = window.localStorage.getItem('intMediumCredId')
if (!userCredId) {
    $('#loginPrompt').show()
} else {
    $('#userName').text(userName)
    $('#loginConf').show()
}

/* Subflow: User chooses to create a new account.
 * Show username registration form.
 * Clicking create leads to private key gen form & keygen.
 */
$('#createNewAccount').on('click', function() {
    $('#loginPrompt').hide()
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
        const { attestation, optionsObject }
            = await makeAttestation(username, challenge, timeout)
        // Submit result to server, store credId, username if successful
        const registration
            = await submitAttestationToServer(attestation, optionsObject)
        // show private key generation / signing prompt
        $('#accountRegistrationForm').hide()
        $('#privKeyPrompt').show()
        // If not signing transaction
        $('#privKeyGenCase').show()
        // If signing transaction
        // $('#privKeyTxCase').show()

        // callback (if any)

    } catch (err) {
        console.error(err)
        alert(err)
    }
})

$('#privKeyButton').on('click', function(tx = null) {
        // Generate pk & address from (userName, credId) and store userAddress
        generateNewPk({
            username: window.localStorage.getItem('IntMediumUsername'),
            credId: window.localStorage.getItem('IntMediumCredId')
        })
})

/* Subflow displayLoginConfirmation-1: User signs in with current account.
 * If signing TX, continue to sign TX UI.
 * Otherwise, callback.
 */
$('#continueWithAccount').on('click', function() {
    alert('Sign in with this account')
})

/* Subflow displayLoginPrompt-2: User chooses sign into different account.
 * Subflow for displayLoginConfirmation-2 as well.
 * Show username selection input.
 * Signing in leads to TX signing or callback.
 */
$('#chooseDifferentAccount').on('click', function() {
    $('#loginPrompt').hide()
    $('#loginConfirmation').hide()
    $('#switchAccountForm').show()
})

$('#newUsernameInput').on('change', function() {
    // Show spinner
    $('#registerAccountSpinner').show()
    checkUsernameAvailability($('#newUsernameInput').val())
})