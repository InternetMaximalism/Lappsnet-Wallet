$('#loginPrompt').hide()
$('#loginConf').hide()
$('#deviceSelection').hide()
$('#accountRegistrationForm').hide()
$('#switchAccountForm').hide()
$('#recoverAccountForm').hide()

/* This code block causes issues on mobile!
if (!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    alert('Your browser does not support biometric authentication.')
}
*/

if (!(navigator.credentials && navigator.credentials.preventSilentAccess)) {
    alert('Your browser does not support credential management API')
}

/* Initial state: Check for intMediumAddress, intMediumUsername, intMediumCredId
 * in localStorage and show relevant prompt/confirmation.
 */

let userAddress = localStorage.getItem('intMediumAddress')
let userName = localStorage.getItem('intMediumUsername')
let userCredId = localStorage.getItem('intMediumCredId')
if (!userCredId) {
    displayLoginPrompt()
} else {
    displayLoginConf()
}

/* Subflow: User chooses to create a new account.
 *
 */
$('#createNewAccount').on('click', function() {
    $('#loginPrompt').hide()
    $('#accountRegistrationForm').show()
})

$('#registerAccount').on('click', async function() {
    try {
        // Request auth to server
        const { username, challenge, timeout }
            = await submitRegistrationRequest()
        // Sign attestationRequest
        const { attestation, optionsObject }
            = await makeAttestation(username, challenge, timeout)
        // Submit result to server
        const { credId, userName }
            = await submitAttestationToServer(attestation, optionsObject)
        // Store credId, userName

        // Generate pk & address from (userName, credId)

        // Store userAddress

        // callback (if any)

    } catch (err) {
        console.error(err)
        alert(err)
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
    $('#switchAccountForm').show()
})

function displayLoginPrompt () {
    $('#loginPrompt').show()
}

function displayLoginConf () {
    $('#userName').text(userName)
    $('#loginConf').show()
}

function checkUsernameAvailability () {
    // Query server for username availability on each input
    $.post('/api/checkUsername', {
        username: $('newUsernameInput').val(),
        function (res) {
            if (res.status === 200) {
                // Show username as available

            } else if (res.status === 500) {
                // Show server error
                console.log(`Server responded with ${res.status}`)
                return alert(`Server error`)
            } else {
                // Show username as unavailable
                console.log(`Server responded with ${res.status}`)
                return alert(`Username unavailable`)
            }
        }
    })
}

async function submitRegistrationRequest () {
    try {
        $.post('/api/registerUsername', {
            username: $('newUsernameInput').val(),
            function (res) {
                if (res.status === 200) {
                    // Return JSON data
                    return jQuery.parseJSON(res)
                } else {
                    // Show server error
                    console.log(`Server responded with ${res.status}`)
                    return alert(`Server error`)
                }
            }
        })
    } catch (err) {
        console.error(err)
        alert(err)
    }
}

async function submitAttestationToServer (attestation, optionsObject) {
    try {
        $.post('/api/postAttestation', {
            attestation,
            optionsObject
        },
        function (res) {
            if (res.status === 200) {
                // Success, store username, credId in localStorage
                localStorage.setItem('IntMaxUsername', username)
                localStorage.setItem('IntMaxCredId', )
            } else if (res.status === 404) {
                // Expired or invalid challenge

            } else {
                // Show server error
                console.log(`Server responded with ${res.status}`)
                return alert(`Server error`)
            }
        })
    } catch (err) {
        console.error(err)
        alert(err)
    }
}