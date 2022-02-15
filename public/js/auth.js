$('#loginPrompt').hide()
$('#loginConfirmation').hide()
$('#deviceSelection').hide()
$('#dobForm').hide()

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

$('#signDob').on('click', async function() {
    // Validate DOB
    if (/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test($('#dobInput').val())) {
        // Sign with fingerprint to get keypair
        try {
            const masterSig = await navigator.credentials.create({
                publicKey: {
                    rp: {
                        id: 'localhost',
                        name: 'IntMedium Identity'
                    },
                    user: {
                        id: buffer.Buffer.from('IntMediumUser'),
                        name: 'user@intmedium.xyz',
                        displayName: 'dummyUser'
                    },
                    pubKeyCredParams: [
                        {
                            type: 'public-key',
                            alg: -7
                        },
                        {
                            type: 'public-key',
                            alg: -257
                        }
                    ],
                    challenge: buffer.Buffer.from('Master Key Generation'.toString('base64'))
                }
            })
            console.log(masterSig)
        } catch (err) {
            console.error(err)
        }
    } else {
        // TODO: Return error
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

function displayLoginPrompt() {
    $('#loginPrompt').show()
}

function displayLoginConfirmation() {
    $('#userAddr').text(userAddress)
    $('#loginConfirmation').show()
}