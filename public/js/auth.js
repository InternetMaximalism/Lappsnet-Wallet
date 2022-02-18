$('#loginPrompt').hide()
$('#loginConf').hide()
$('#deviceSelection').hide()
$('#accountRegistrationForm').hide()
$('#switchAccountForm').hide()
$('#recoverAccountForm').hide()
$('#registerAccountSpinner').hide()

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

function displayLoginPrompt () {
    $('#loginPrompt').show()
}

function displayLoginConf () {
    $('#userName').text(userName)
    $('#loginConf').show()
}

/* Subflow: User chooses to create a new account.
 *
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
        // Generate pk & address from (userName, credId) and store userAddress
        generatePk(registration)
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

$('#newUsernameInput').on('change', function() {
    // Show spinner
    $('#registerAccountSpinner').show()
    checkUsernameAvailability($('#newUsernameInput').val())
})

function checkUsernameAvailability (username) {
    // Query server for username availability on each input
    $.post('/api/checkUsername', {
        username: username
    },
    function (res) {
        console.log(res)
        if (res.available === true) {
            // Show username as available
            $('#registerAccount').removeClass('btn-disabled btn-danger').addClass('btn-success')
            $('#registerAccountSpinner').hide()
        }
        return
    })
    .fail(function (res) {
        // Show username as unavailable
        $('#registerAccount').removeClass('btn-disabled btn-success').addClass('btn-danger')
        $('#registerAccountSpinner').hide()
        console.log(`Username unavailable`)
        return
    })
}

async function submitRegistrationRequest (username) {
    try {
        if (!$('#registerAccount').attr('class').includes('btn-success')) {
            // If not btn-success, don't waste time querying
            return
        }
        return new Promise((resolve, reject) => {
            $.post('/api/registerUsername', {
                username
            },
            function (res) {
                if (res.username === username) {
                    // Return JSON data
                    console.log(res)
                    resolve(res)
                } else {
                    // Show server error
                    console.log(`Server responded with ${res.status}`)
                    reject()
                }
            })
        })
    } catch (err) {
        console.error(err)
        alert(err)
    }
}

async function submitAttestationToServer (attestation, optionsObject) {
    try {
        return new Promise((resolve, reject) => {
            console.log(attestation)
            $.post('/api/postAttestation', {
                attestationObject: base64.fromArrayBuffer(attestation.response.attestationObject, true),
                clientDataJSON: base64.fromArrayBuffer(attestation.response.clientDataJSON)
            },
            function (res) {
                if (res.username && res.credId) {
                    // Success, store username, credId in localStorage
                    localStorage.setItem('IntMaxUsername', res.username)
                    localStorage.setItem('IntMaxCredId', res.credId)
                    resolve(res)
                } else {
                    // Show server error
                    console.log(`Server responded invalid data`)
                    reject()
                }
            })
            .fail(function (res) {
                console.error(`Server returned error`)
                reject()
            })
        })
    } catch (err) {
        console.error(err)
        alert(err)
    }
}