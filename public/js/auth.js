$('#loginPrompt').hide()
$('#loginConfirmation').hide()
$('#deviceSelection').hide()
$('#dobForm').hide()

/* This code block causes issues on mobile!
if (!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    alert('Your browser does not support biometric authentication.')
}
*/

if (!(navigator.credentials && navigator.credentials.preventSilentAccess)) {
    alert('Your browser does not support credential management API')
}

/* Initial state: Check for intMediumAddress in localStorage
 * and show relevant prompt/confirmation.
 */

let userAddress = localStorage.getItem('intMediumAddress')
if (!userAddress) {
    displayLoginPrompt()
} else {
    displayLoginConfirmation()
}

/* Subflow displayLoginPrompt-1: User chooses create new account.
 *
 */
$('#createNewAccount').on('click', function() {
    $('#loginPrompt').hide()
    $('#dobForm').show()
})

$('#signDobNew').on('click', async function() {
    // Validate DOB
    if (validateDob($('#dobInput').val())) {
        // Sign with fingerprint to get keypair
        try {
            await getNewKey()
            //sessionStorage.setItem('MasterPK', masterSig.)
        } catch (err) {
            console.error(err)
        }
    } else {
        // TODO: Return error
        alert('Date of birth invalid!')
    }
})

$('#signDobExisting').on('click', async function() {
    // Validate DOB
    if (validateDob($('#dobInput').val())) {
        // Sign with fingerprint to get keypair
        try {
            await getSig()
            //sessionStorage.setItem('MasterPK', masterSig.)
        } catch (err) {
            console.error(err)
        }
    } else {
        // TODO: Return error
        alert('Date of birth invalid!')
    }
})

/* Subflow displayLoginConfirmation-1: User signs in with current account.
 *
 */
$('#continueWithAccount').on('click', function() {
    alert('Sign in with this account')
})

/* Subflow displayLoginPrompt-2: User chooses sign into different account.
 * Subflow for displayLoginConfirmation-2 as well.
 */
$('#chooseDifferentAccount').on('click', function() {
    $('#loginPrompt').hide()
    $('#loginConfirmation').hide()
    $('#deviceSelection').show()
})

function displayLoginPrompt () {
    $('#loginPrompt').show()
}

function displayLoginConfirmation () {
    $('#userAddr').text(userAddress)
    $('#loginConfirmation').show()
}

function validateDob (input) {
    return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(input)
}