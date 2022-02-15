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
            const firstAttesetation = cbor.decodeFirst(masterSig.response.attestationObject, { bigInt: true, preferWeb: true }).then(o => {
                // cf. https://www.w3.org/TR/webauthn/images/fido-attestation-structures.svg
                const authDataArray =  Object.values(o.authData)
                // const rpIdHash = authDataArray.slice(0,32) // First 32 bytes = rpIdHash
                const flags = authDataArray[32] // 33rd byte = flags (ED, AT, 0, 0, 0, UV, 0, UP). AT+UV+UP=69
                // const counter = authDataArray.slice(33,37) // Bytes 34-37 = counter
                // const aaguid = authDataArray.slice(37,53) // Bytes 38-53 = AAGUID manufacturer-set id (can be all 0s)
                const l = authDataArray[53]*255+authDataArray[54] // 54,55th byte = length L
                // const credId = authDataArray.slice(55,56+l) // 56th-56+lth byte = credentialID
                let publicKey

                /* COSE_Key follows format:
                 * 1, 2 (kty: EC2 key type)
                 * 3, -7 (alg: ES256)
                 * -1: 1 (crv: P-256)
                 * -2: x (x-coordinate 32 bytes)
                 * -3: y (y-coordinate 32 bytes)
                 * 
                 * i.e. (in hex)
                 * 01 02 03 26 20 01 21 58 20 <key> 22 58 20 <key>
                 * a.k.a. (in decimal)
                 * 1 2 3 38 32 1 33 88 32 <key> 34 88 32 <key>
                 * 
                 * cf. https://www.w3.org/TR/webauthn/#sctn-encoded-credPubKey-examples
                 */
                
                let edByteSet = (flags >= 128)
                if (edByteSet) {
                    // remainder is COSE_Key (variable length) + Extensions (CBOR map)
                    // must parse
                    alert('Webauthn Extension Data not yet implemented')
                } else {
                    // remainder is COSE_Key
                    let remainder = authDataArray.slice(56+l)
                    publicKey = {
                        "1": remainder[1],
                        "3": remainder[3],
                        "-1": remainder[5],
                        "-2": remainder.slice(9,41),
                        "-3": remainder.slice(43,75)
                    }
                    console.log(JSON.stringify(publicKey))
                }
            })
            //sessionStorage.setItem('MasterPK', masterSig.)
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