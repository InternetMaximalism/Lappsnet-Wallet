/* Build is just a fancy way to say "copied and pasted" */

/* escapeHTML.js - helper function to escape special characters */
function escapeHTML (string) {
  return string.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#x27;')
               .replace(/`/g, '&#x60')
}

/* web3Custom.js */
let web3js;

function initWeb3 (callback) {
  console.log('Loading web3js')
  web3js = new Web3('https://rpc.intmedium.xyz')
  callback(web3js)
}

/* Get balance of SAT token and other tokens */
async function getBalance (address) {
    try {
        web3js.eth.getBalance(
            window.localStorage.getItem('addr'),
            "latest",
            function(err, res)  {
                if (err) return console.error(err)
                $('#esatBalance').text(web3js.utils.fromWei(res))
            })
        getTokenBalances(address)
    } catch (err) {
        console.error(err)
    }
}

/* Get balances of tokens */
async function getTokenBalances (address) {
    try {
        let tokenList = (await $.get('https://explorer.intmedium.xyz/api?module=account&action=tokenlist&address='.concat(address))).result
        if (tokenList.length === 0) {
            return null
        }
        // Otherwise, add balances to balances list & token send selection
        $('#tokenCount').text(tokenList.length)
        let balancesDiv = $('#collapseTokenList')
        balancesDiv.empty()
        let ul = $('<ul>').appendTo(balancesDiv)
        tokenList.forEach(i => {
            let li = $('<li>')
                      .text(`${escapeHTML(i.name)} (${escapeHTML(web3js.utils.fromWei(i.balance))} ${escapeHTML(i.symbol)})`)
                      .attr('class', `tokenListItem m-1`)
                      .attr('id', `${escapeHTML(i.symbol)}`)
                      .appendTo(ul)
        })
        $('#tokenBalances').show()
        return tokenList
    } catch (err) {
        console.error(err)
    }
}

async function getTokenList () {
    try {
        let tokenList = (await $.get('https://explorer.intmedium.xyz/api?module=account&action=tokenlist&address='.concat(window.localStorage.getItem('addr')))).result
        if (tokenList.length === 0) {
            return null
        }
        return tokenList
    } catch (err) {
        console.error(err)
    }
}

async function queryTokenList (symbol) {
    try {
        tokenList = await getTokenList()
        console.log(tokenList)
        return (tokenList.filter(i => {
            return i.symbol === symbol
        }))[0]
    } catch (err) {
        console.error(err)
    }
}

/* Return ABI for given verified contract */
async function getAbi (contractAddress) {
    try {
        let abi = (await $.get('https://explorer.intmedium.xyz/api?module=contract&action=getabi&address='.concat(contractAddress))).result
        if (abi === null) {
            return null
        }
        // Otherwise, return abi as object
        return abi
    } catch (err) {
        console.error(err)
    }
}

/* networking.js - handles requests to backend server */

function checkUsernameAvailability (username) {
  // Query server for username availability on each input
  $.post('/api/checkUsername', {
      username: username
  },
  function (res) {
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
              let returnObject = res
              if (res.rp) {
                  // Return JSON data
                  returnObject.challenge = base64.toArrayBuffer(res.challenge, true)
                  returnObject.user.id = base64.toArrayBuffer(res.user.id, true)
                  resolve(returnObject)
              } else {
                  // Show server error
                  console.log(`Server responded with invalid attestationOptions`)
                  reject()
              }
          })
      })
  } catch (err) {
      console.error(err)
      alert(err)
  }
}

async function submitAttestationToServer (attestation) {
  try {
      return new Promise((resolve, reject) => {
          console.log(`Submitting attestation...`)
          let attestationObject = new Uint8Array(attestation.response.attestationObject);
          let clientDataJSON = new Uint8Array(attestation.response.clientDataJSON);
          let rawId = new Uint8Array(attestation.rawId);
          let attData = {
            id: attestation.id,
            rawId: base64.fromArrayBuffer(rawId),
            response: {
              attestationObject: base64.fromArrayBuffer(attestationObject, true),
              clientDataJSON: base64.fromArrayBuffer(clientDataJSON, true)
            }
          }
          $.post('/api/postAttestation', {
              attestation: JSON.stringify(attData)
          },
          function (res) {
              if (res.publicKey) {
                  console.log(`Credential public key returned: ${res.publicKey}`)
                  resolve({ publicKey: res.publicKey, username: res.username })
              } else {
                  // Show server error
                  console.log(`Server responded invalid data`)
                  reject()
              }
          },
          "json")
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

async function submitAuthenticationRequest (username) {
    try {
        return new Promise((resolve, reject) => {
            $.post('/api/requestAuth', {
                username
            },
            function (res) {
                let authnOptions = res
                if (res.allowCredentials) {
                    for (i=0; i<authnOptions.allowCredentials.length; i++) {
                        authnOptions.allowCredentials[i].id = base64.toArrayBuffer(res.allowCredentials[i].id, true)
                    }
                    authnOptions.challenge = base64.toArrayBuffer(res.challenge, true)
                    console.log(authnOptions)
                    // Return JSON data
                    resolve(authnOptions)
                } else {
                    // Show server error
                    console.log(`Server responded with invalid assertionOptions`)
                    reject()
                }
            })
        })
    } catch (err) {
        console.error(err)
        alert(err)
    }
}

async function submitAssertionToServer (assertion) {
    try {
        return new Promise((resolve, reject) => {
            console.log('Submitting assertion...')
            let rawId = new Uint8Array(assertion.rawId)
            let authenticatorData = new Uint8Array(assertion.response.authenticatorData);
            let clientDataJSON = new Uint8Array(assertion.response.clientDataJSON);
            let signature = new Uint8Array(assertion.response.signature)
            let assData = {
              id: assertion.id,
              rawId: base64.fromArrayBuffer(rawId),
              response: {
                authenticatorData: base64.fromArrayBuffer(authenticatorData, true),
                clientDataJSON: base64.fromArrayBuffer(clientDataJSON, true),
                signature: base64.fromArrayBuffer(signature)
              }
            }
            $.post('/api/postAssertion', {
                assertion: JSON.stringify(assData)
            }, function (res) {
                if (res.publicKey) {
                    let assPubkey = res.publicKey
                    let assUsername = res.username
                    resolve({ assPubkey, assUsername })
                } else {
                    // Show server error
                    console.log(`Server responded invalid data`)
                    reject()
                }
            },
            "json")
            .fail(function (res) {
                console.error(`Server returned error`)
                reject()
            })
          })
      } catch (err) {
          console.error(err)
      }
}

async function sendAddress (url, signature) {
  try {
    return new Promise((resolve, reject) => {
      $.post(url, {
        signature: signature,
        publicAddress: window.localStorage.getItem('addr')
      })
      .then((result) => {
          console.log('Callback sent to URL')
      })
    })
  } catch (err) {
    console.error(err)
  }
}

async function sendTransaction (url, transaction) {
    try {
        return new Promise((resolve, reject) => {
            $.post(url, {
                signedTx: transaction
            })
            .then((result) => {
                console.log('Signed TX sent to URL')
            })
        })
    } catch (err) {
        console.error(err)
    }
}

/* fidoTools.js - functions that call the WebAuthn API */

/* Create (username, credId) pair: 
   Takes username, challenge (base64) and creates an attestation.
   The credential public key is used as IntMedium account private key. */
   async function makeAttestation (attestationOptions) {
    try {
      const attestation = await navigator.credentials.create({ publicKey: attestationOptions })
      const { publicKey, username } = await submitAttestationToServer(attestation)
      return { encryptionPublicKey: publicKey, registeredUsername: username }
  
    } catch (err) {
      console.error(err)
    }
  }

  async function makeAssertion (assertionOptions) {
    try {
      const assertion = await navigator.credentials.get({ publicKey: assertionOptions })
      const { assPubkey, assUsername } = await submitAssertionToServer(assertion)
      return({ assPubkey, assUsername })
    } catch (err) {
      console.error(err)
    }
  }

  async function getAuthDataFromAttestation (attestation) {
    try {
      return new Promise((resolve, reject) => {
        cbor.decodeFirst(attestation.response.attestationObject, { bigInt: true, preferWeb: true}, o => {
          resolve(Object.values(o))
        })
      })
    } catch (err) {
      console.error(err)
    }
  }
  
  /* decodes FIDO attestation object and returns credId, publicKey */
  async function decodeFidoResponse (fidoCBOR) {
    try {
      return new Promise((resolve, reject) => {
        const firstAttesetation = cbor.decodeFirst(fidoCBOR, { bigInt: true, preferWeb: true }).then(o => {
          // cf. https://www.w3.org/TR/webauthn/images/fido-attestation-structures.svg
          const authDataArray =  Object.values(o.authData)
          // const rpIdHash = authDataArray.slice(0,32) // First 32 bytes = rpIdHash
          const flags = authDataArray[32] // 33rd byte = flags (ED, AT, 0, 0, 0, UV, 0, UP). AT+UV+UP=69
          // const counter = authDataArray.slice(33,37) // Bytes 34-37 = counter
          // const aaguid = authDataArray.slice(37,53) // Bytes 38-53 = AAGUID manufacturer-set id (can be all 0s)
          const l = authDataArray[53]*255+authDataArray[54] // 54,55th byte = length L
          const credId = authDataArray.slice(55,56+l) // 56th-56+lth byte = credentialID
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
                  "-3": remainder.slice(44,76)
              }
              console.log(`Public key: ${base64.fromArrayBuffer(remainder.slice(9, 41), true)}`)
              console.log(`Credential ID: ${base64.fromArrayBuffer(credId, true)}`)
              resolve({
                credId: base64.fromArrayBuffer(credId, true), publicKey: base64.fromArrayBuffer(remainder.slice(9, 41), true)
              })
          }
        })
      })
    } catch (err) {
      console.error(err)
      reject()
    }
  }

  /* Base64 String encrypted pk, Base64 String encryption key
   * => Hex String pk
   */
  async function recoverPk (encryptedKey, encryptionKey) {
    try {
      // CryptoJS can handle base64 ciphers for us
      let decrypt = CryptoJS.AES.decrypt(encryptedKey, encryptionKey)
      return decrypt.toString(CryptoJS.enc.Utf8)
    } catch (err) {
      console.error(err)
    }
  }

  async function authAndRecoverPk () {
    try {
      // If in backup mode, no need to auth with server
      if (window.localStorage.getItem('pk')) {
        return window.localStorage.getItem('pk')
      }
      // Authenticate with server
      let assertionOptions = await submitAuthenticationRequest(window.localStorage.getItem('user'))
      let assResult = await makeAssertion(assertionOptions)
      // Authentication will return pubkey if successful
      // Recover addr and null privatekey
      let pk = await recoverPk(window.localStorage.getItem('encryptedKey'), assResult.assPubkey)
      return pk
    } catch (err) {
      console.error(err)
    }
  }

  /* Hex String pk to encrypt, Base64 String encryption key
   * => Base64 String encrypted pk
   */
  async function encryptPk (pk, encryptionKey) {
    try {
      let utf8key = CryptoJS.enc.Utf8.parse(pk)
      let encryptedKey = CryptoJS.AES.encrypt(utf8key, encryptionKey)
      return encryptedKey.toString()
    } catch (err) {
      console.error(err)
    }
  }

  /* copyAddress.js - Copy address upon click */
$('.addressDisplay').on('click', function() {
  // On clicking an address, copy it from localStorage to clipboard
  if (!navigator.clipboard) {
    // Don't try anthing
    // TODO: Is it worth implementing the deprecated execCommand('copy') method?
  } else {
    navigator.clipboard.writeText(window.localStorage.getItem('addr'))
      .then(() => {
        alert(`Copied address ${window.localStorage.getItem('addr')} to clipboard!`)
      })
      .catch(() => {
        alert(`Something went wrong! Please manually copy and paste.`)
      })
  }
})

/* init.js Initializes components on the page and checks for browser support
 * If user is logged in, handles query string to show proper form
 * If user is not logged in, shows options to register or recover account
 */

window.addEventListener('load', e => {
  initWeb3((w3) => {
      initComponents()
  })
})
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
  $('#warningBanner').hide()
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

if (window.localStorage.getItem('pk')) {
  showInsecureWarning()
}
function showInsecureWarning () {
  let eKeyExists = !!window.localStorage.getItem('encryptedKey')
  $('#warningBanner').show()
  if (eKeyExists) {
      $('#warningMessage').text(
          "You are in backup mode; your private key is insecure. " +
          "We recommend you sign out when you are done. " +
          "Your account is still saved on your browser, so you should " +
          "be able to log in with the correct username."
      )
      return
  } else {
      $('#warningMessage').text(
          "You are in backup mode; your private key is insecure. " +
          "We recommend you sign out when you are done. " +
          "Your account is no longer saved in your browser, so we " +
          "also recommend you transfer your assets to a new one."
      )
  }
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
          getBalance(window.localStorage.getItem('addr'))
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

/* newAccount.js - handles new account creation */
$('.createNewAccount').on('click', function() {
  // If currently logged in, log out first
  if (window.localStorage.getItem('encryptedKey')) {
      // logout.logOutConf
      return logOutConf()
  }
  // If not logged in, get rid of localStorage and proceed
  window.localStorage.clear()
  $('#connectLoginDetected').hide()
  $('#connectLoginNotDetected').hide()
  $('#accountRegistrationForm').show()
})

$('#newUsernameInput').on('change', function() {
// Show spinner
$('#registerAccountSpinner').show()
// networking.checkUsernameAvailability
checkUsernameAvailability($('#newUsernameInput').val())
})

$('#registerAccount').on('click', createNewAccount)

async function createNewAccount () {
  if ($('#registerAccount').attr('class').includes('btn-disabled')) {
    return
  }
  try {
    // Create private key (remember to null web3PkObj when done)
    let web3PkObj = web3js.eth.accounts.create()
    rawPk = web3PkObj.privateKey
    // Request auth to server
    const attestationOptions
        = await submitRegistrationRequest($('#newUsernameInput').val())
    // Sign attestation
    const { encryptionPublicKey, registeredUsername }
        = await makeAttestation(attestationOptions)
    console.log(`Got encryption public key ${encryptionPublicKey}`)

    // Encrypt key with encryptionPublicKey
    let encryptedKey = await encryptPk(rawPk, encryptionPublicKey)
    console.log(`EncryptedKey = ${encryptedKey}`)

    // Store base64 encoded encryptedKey and username in localStorage
    window.localStorage.setItem('encryptedKey', encryptedKey)
    window.localStorage.setItem('user', registeredUsername)

    // Ask user to back up key, encrypted by a password
    // Also clears rawPk from memory
    showBackupModal()

    // Add address to localStorage
    window.localStorage.setItem('addr', web3PkObj.address)
    web3PkObj = null

    userPk = window.localStorage.getItem('encryptedKey')
    userAddress = window.localStorage.getItem('addr')
    userName =  window.localStorage.getItem('user')
    $('.addressDisplay').text(userAddress)
    $('.usernameDisplay').text(userName)
    $('#accountRegistrationForm').hide()
    $('#connectLoginDetected').show()
    getBalance(userAddress)

    // If not signing transaction
    if (params.get('connect')) {
      // Show signmessage modal
      if (!params.get('nonce')) {
        alert('Nonce not provided in query string')
        return
      }
      $('#signMessageInput').val(escapeHTML(params.get("nonce")))
      $('#signMessageModal').show()
    }
    // If signing transaction
    if (params.get('signTx')) {
      // Fill TX info and show form
      return $('#signTxForm').show()
    }
    // If creating transaction
    if (params.get('createTx')) {
      return
    }

  } catch (err) {
    console.error(err)
    alert(err)
  }
}

/* recoverAccount.js - recover account from privkey */
$('.recoverAccount').on('click', function() {
  recoverModal()
})

function recoverModal () {
  // Show modal
  $('#recoverModal').show()
}

$('.chooseDifferentAccount').on('click', function() {
  logOutConf()
})

function logOutConf () {
  // Show modal
  $('#logoutModal').show()
  $('.backUpKey').show()
}

// If log out confirmed, clear localStorage & show fresh login prompt
$('.logOutBtn').on('click', function() {
  window.localStorage.removeItem('user')
  window.localStorage.removeItem('addr')
  window.localStorage.removeItem('pk')
  $('#connectLoginDetected').hide()
  $('#logoutModal').hide()
  $('#continueWithAccountConfirmation').hide()
  $('#connectLoginNotDetected').show()
})

$('.cancelLogout').on('click', function() {
  $('#logoutModal').hide()
})

// If recover selected, show backup modal
$('.backUpKey').on('click', function() {
  $('#logoutModal').hide()
  showBackupModal()
})

/*
$('.recoverBtn').on('click', function() {
  accountRecoveryHandler()
})
*/

$('#recoveryFormBody').submit(function(event) {
  event.preventDefault()
  accountRecoveryHandler()
})

async function accountRecoveryHandler () {
  try {
    // Decrypt key with pass phrase
    let recoveredPk = await recoverPk($('#encryptedBackup').val(), $('#yourPw').val())
    // Get address
    let { privateKey, address } = await web3js.eth.accounts.privateKeyToAccount(recoveredPk)
    window.localStorage.setItem('pk', privateKey)
    window.localStorage.setItem('addr', address)
    recoveredPk = null
    privateKey = null
    
    // Hide modal, show account
    $('#recoverModal').hide()
    $('#connectLoginNotDetected').hide()
    $('#warningBanner').hide()
    loadWalletUI()
    showInsecureWarning()
  } catch (err) {
    console.error(err)
  }
}

$('.cancelRecovery').on('click', function() {
  $('#recoverModal').hide()
})

/* signTx.js - signs transaction passed as query parameter */

$('.cancelSignTx').on('click', function() {
  $('#signTxModal').hide()
})

$('.signTxBtn').on('click', function() {
  $('#signTxSpinner').show()
  $('#signTxBtn').attr('disabled', true)
  $('#errorBanner').hide()
  signTxBtn()
})

async function signTxBtn () {
    try {
        // Sign the transaction with private key
        let ab = base64.toArrayBuffer(escapeHTML(params.get("txData")), true)
        let decoded = new TextDecoder().decode(ab)
        const callbackUrl = decodeURIComponent(params.get('callbackUrl'))
        let pk = await authAndRecoverPk()
        web3js.eth.accounts.signTransaction(
            JSON.parse(decoded),
            pk,
            (err, result) => {
                pk = null
                if (err) {
                    $('#errorText').text(err)
                    $('#errorBanner').show()
                    $('#signTxSpinner').hide()
                    $('#signTxBtn').attr('disabled', false)
                    $('#signTxModal').hide()
                    return console.error(err)
                }
                web3js.eth.sendSignedTransaction(result.rawTransaction,
                    (err, result) => {
                        if (err) {
                            $('#errorText').text(err)
                            $('#errorBanner').show()
                            $('#signTxSpinner').hide()
                            $('#signTxBtn').attr('disabled', false)
                            $('#signTxModal').hide()
                            return console.error(err)
                        }
                        // Update balance in UI
                        web3js.eth.getBalance(
                          userAddress,
                          "pending",
                          function(err, res)  {
                              if (err) return console.error(err)
                              $('#esatBalance').text(web3js.utils.fromWei(res))
                          })
                    })
                sendTransaction(callbackUrl, result)
                $('#signTxSpinner').hide()
                $('#signTxBtn').attr('disabled', false)
                $('#signTxModal').hide()
            })

    } catch (err) {
        console.error(err)
    }
}

/* createTx.js - create and sign transaction */
// Display the fields relevant to chosen option

$('.createTxTopBtn').on('click', function() {
  $('#createTxModal').show()
  $('input[name=selectTxType][value="1"]').prop('checked', true)
  switchCreateTxFormType("1")
})

$('.cancelCreateTx').on('click', function() {
$('#createTxModal').hide()
})

$('input[name="selectTxType"]').change(function() {
  let option = $('input[name="selectTxType"]:checked').val()
  switchCreateTxFormType(option)
})

function switchCreateTxFormType (option) {
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
      $('#createTxFromAddressForm').hide()
      $('#createTxToAddressForm').show()
      $('#createTxValueForm').show()
      $('#createTxDataForm').hide()
      $('#createTxGasLimitForm').hide()
      $('#createTxTokenContract').val("")
      $('#createTxTokenContract').attr('disabled', false)
  }
}

$('.createTxBtn').on('click', async function() {
try {
    $('#createTxSpinner').show()
    $('#createTxBtn').attr('disabled', true)
    $('#errorBanner').hide()
    // Create the transaction based on txType
    let option = $('input[name="selectTxType"]:checked').val()
    if (!["1", "2"].includes(option)) {
        // txType not selected
        $('#createTxModal').hide()
        $('#createTxSpinner').hide()
        $('#createTxBtn').attr('disabled', false)
        throw Error('Select valid transaction type')
    }
    let tx = {}

    if (option === "1") {
        return createNativeTx(
            $('#createTxToAddress').val(),
            web3js.utils.toWei($('#createTxValue').val()),
            $('#createTxGasLimit').val()
        )
    }

    if (option === "2") {
        let abi = await getAbi($('#createTxTokenContract').val())
        return createTokenTx(
            $('#createTxToAddress').val(),
            web3js.utils.toWei($('#createTxValue').val()),
            abi)
    }

} catch (err) {
    $('#errorText').text(err)
    $('#errorBanner').show()
    $('#createTxSpinner').hide()
    $('#createTxBtn').attr('disabled', false)
    $('#createTxModal').hide()
    console.error(err)
}
})

async function createNativeTx (to, value, gas) {
try {
    let tx = {
        to, value, gas
    }
    // Sign the transaction
    let pk = await authAndRecoverPk()
    const signedTx = await web3js.eth.accounts.signTransaction(
        tx,
        pk
    )
    pk = null
    // Broadcast the transaction
    const receipt = await web3js.eth.sendSignedTransaction(signedTx.rawTransaction)

    $('#successBanner').show()
                    
    // Update balance in UI
    const newBalance = await web3js.eth.getBalance(
        userAddress,
        "pending"
    )
    $('#esatBalance').text(web3js.utils.fromWei(newBalance))
    
    // Callback with transaction data IF callback is defined
    const callbackUrl = decodeURIComponent(params.get('callbackUrl'))
    if (params.get('callbackUrl') !== null) {
        console.log('Invoking callback')
        sendTransaction(callbackUrl, result)
    }

    clearCreateTxInputs()

    $('#createTxSpinner').hide()
    $('#createTxBtn').attr('disabled', false)
    $('#createTxModal').hide()

    loadWalletUI()
    return

} catch (err) {
    console.error(err)
    $('#createTxSpinner').hide()
    $('#errorText').text(err)
    $('#errorBanner').show()
    $('#createTxModal').hide()
    $('#createTxBtn').attr('disabled', false)
}
}

async function createTokenTx (to, value, abi = null) {
try {
    abi = JSON.parse(abi)
    let defaultAbi = [{
        "type": "function",
        "name": "transfer",
        "constant": false,
        "inputs": [
            { "name": "_to", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "outputs": [
            { "name": "", "type": "bool" }
        ]
    }]
    if (abi === null) {
      abi = defaultAbi
    }
    let contract = new web3js.eth.Contract(abi, $('#createTxTokenContract').val())
    let transaction = contract.methods.transfer(to, value)

    let gastimate = await transaction.estimateGas({ gas: "5000000", from: localStorage.getItem('addr') })
    if (gastimate === 5000000) {
        throw new Error('Contract would run out of gas! Infinite loop?')
    }

    let options = {
        from: window.localStorage.getItem('addr'),
        to: contract._address,
        data: transaction.encodeABI(),
        gas: web3js.utils.toBN(gastimate)
    }
    let pk = await authAndRecoverPk()
    let signedTx = await web3js.eth.accounts.signTransaction(options, pk)
    pk = null
    let receipt = await web3js.eth.sendSignedTransaction(signedTx.rawTransaction)
    $('#successBanner').show()
    
    // Update ESAT balance in UI
    let newBalance = await web3js.eth.getBalance(userAddress, "pending")
    $('#esatBalance').text(web3js.utils.fromWei(newBalance))
    // Update token balances and reflect in UI
    tokenList = await getTokenBalances(userAddress)

    // Callback with transaction data IF callback is defined
    const callbackUrl = decodeURIComponent(params.get('callbackUrl'))
    if (params.get('callbackUrl') !== null) {
        console.log('Invoking callback')
        sendTransaction(callbackUrl, receipt)
    }
    clearCreateTxInputs()
    $('#createTxModal').hide()
    $('#createTxSpinner').hide()
    $('#createTxBtn').attr('disabled', false)
    loadWalletUI()
    return
} catch (err) {
    console.error(err)
    $('#errorText').text(err)
    $('#errorBanner').show()
    $('#createTxModal').hide()
    $('#createTxSpinner').hide()
    $('#createTxBtn').attr('disabled', false)
}
}

$('#collapseTokenList').on('click', '.tokenListItem', async function() {
try {
    $('#createTxModal').show()
    $('#createTxType').val("2")

    $('#createTxTokenContractForm').show()
    $('#createTxFromAddressForm').hide()
    $('#createTxToAddressForm').show()
    $('#createTxValueForm').show()
    $('#createTxDataForm').hide()
    $('#createTxGasLimitForm').hide()

    let tokenData = await queryTokenList(this.id)
    $('#createTxTokenContract').val(tokenData.contractAddress)
    $('#createTxTokenContract').attr('disabled', true)

    $('input[name=selectTxType][value="2"]').prop('checked', true)

} catch (err) {
    console.error(err)
}
})

function clearCreateTxInputs () {
  $('#createTxToAddress').val("")
  $('#createTxValue').val("")
  $('#createTxTokenContract').val("")
  $('#createTxTokenContract').attr('disabled', false)
  $('#createTxGasLimit').val('2000000')
}

/* contractCall.js - handles contract calls other than ERC20 */

$('.contractCallTopBtn').on('click', function() {
  // If contractAddress is in params, plug it in
  if (params.get('contractAddress')) {
      getContractMethods(escapeHTML(params.get('contractAddress')))
      return showContractCallModal({ contractAddress: escapeHTML(params.get('contractAddress'))})
  }
  return showContractCallModal()
} )

$('.cancelContractCall').on('click', function() {
  hideContractCallModal()
})

$('.contractCallBtn').on('click', () => {
  let method = $('#methodSelector').find(":selected").val()
  let inputs = []
  $('#inputList input').each(function() {
      /* There is an issue where single quotes are added to the string */
      inputs.push({ [$(this).attr('class')] : $(this).val().replaceAll("'", "") })
  })
  let args = {
      method, inputs
  }
  hideContractCallModal()
  confirmContractCall(args)
})

$('.confirmCallBtn').on('click', function() {
  let args = $('.confirmContractCallContents').text()
  hideContractConfirmationModal()
  submitContractCall(args)
})

$('.cancelConfirmCall').on('click', function() {
  hideContractConfirmationModal()
})

function showContractCallModal (args = {}) {
  $('#contractCallModal').show()
  if (args !== {}) {
      // Set default values
      $('#contractAddress').val(args.contractAddress)
      return
  }
}

function hideContractCallModal () {
  $('#contractCallModal').hide()
  $('#methodSelector').hide()
}

function hideContractConfirmationModal () {
  $('#confirmContractCallModal').hide()
}

$('#loadContract').on('click', function() {
  getContractMethods(escapeHTML($('#contractAddress').val()))
})

/* Get list of methods for contract at address and show them */
async function getContractMethods (address) {
  try {
      $('#methodSelector').show()
      let methodSelector = $('#methodSelector')
      methodSelector.empty()
      $('<option>').text('Select...').appendTo(methodSelector)

      // Get list of methods
      let abi = JSON.parse(await getAbi(address))
      abi.forEach(i => {
          if (i.type === "event" || i.type === "function") {
              // Add method to selector
              $('<option>').attr('class', 'methodOption')
                           .val(i.name)
                           .text(i.name)
                           .appendTo(methodSelector)
          }
      })
  } catch (err) {
      console.error(err)
  }
}

$('#methodSelector').change(function() {
  console.log(`Getting methods for ${$('#methodSelector').find(":selected").val()}`)
  getMethodInputs(
      escapeHTML($('#contractAddress').val()),
      escapeHTML($('#methodSelector').find(":selected").val())
  )
})

/* Get the list of inputs for given method */
async function getMethodInputs (address, methodName) {
  try {
      let inputListDiv = $('#inputList')
      inputListDiv.empty()

      // Get list of inputs for method
      let abi = JSON.parse(await getAbi(address))
      let method = abi.filter(i => {
          return i.name === methodName
      })[0].inputs
      method.forEach(input => {
          let row = $('<div>').attr('class', 'row m-1').appendTo(inputListDiv)
          $('<div>').attr('class', 'col-sm-4 p-0')
                    .text(`${escapeHTML(input.name)}: ${escapeHTML(input.type)}`)
                    .appendTo(row)
          let col = $('<div>').attr('class', 'col-sm-8 p-0').appendTo(row)
          $('<input>').attr('class', escapeHTML(input.name).concat(' form-control w-100')).appendTo(col)
      })
  } catch (err) {
      console.error(err)
  }

}

/* Show modal to confirm method and args, estimated fee */
async function confirmContractCall (args) {
  try {
      // Get contract, method name, args
      let abi = JSON.parse(await getAbi($('#contractAddress').val()))
      let contract = new web3js.eth.Contract(abi, $('#contractAddress').val())

      /* Estimate fee */
      /* Since read-only functions return nonzero estimates, filter those out */
      let stateMutability = abi.filter(i => {
          return i.name === args.method
      })[0].stateMutability
      let estimatedGas = 0
      /* If function is not read-only, return nonzero gas estimate */
      if (!(stateMutability === "view" || stateMutability === "pure")) {
          let inputs = args.inputs.map(i => {
              return Object.values(i)[0]
          })
          // Spread array of args to individual parameters using .apply()
          estimatedGas = await contract.methods[args.method].apply(null, inputs).estimateGas()
      }
      $('.confirmContractCallContents').text(JSON.stringify(args, null, 2))
      $('#estimatedCallGas').text(estimatedGas)
      $('#confirmContractCallModal').show()

  } catch (err) {
      console.error(err)
  }
}

/* Sign and submit. Display result, if any */
async function submitContractCall(args) {
  try {
      args = JSON.parse(args)
      let inputs = args.inputs.map(i => {
          return Object.values(i)[0]
      })
      // Get contract, method name, args
      let abi = JSON.parse(await getAbi($('#contractAddress').val()))
      let contract = new web3js.eth.Contract(abi, $('#contractAddress').val())

      let stateMutability = abi.filter(i => {
          return i.name === args.method
      })[0].stateMutability
  
      // Call smart contract accordingly
      // let prepared = await contract.methods[args.method](args.inputs)
      let prepared = await contract.methods[args.method].apply(null, inputs)
      if (stateMutability === 'view' || stateMutability === 'pure') {
          console.log('Calling method')
          let result = await prepared.call()
          successMessage(result)
          return
      } else {
          console.log('Sending method')
          let result = await prepared.send()
          successMessage(result)
          return
      }

  } catch (err) {
      console.error(err)
  }
}

/* backup.js - handle backup encrypted key modal on account creation */
$('.backUpAccount').on('click', function() {
  backUpAccountClickHandler()
})

async function backUpAccountClickHandler() {
  try {
    rawPk = await authAndRecoverPk()
    showBackupModal()
  } catch (err) {
    console.error(err)
  }
}

function showBackupModal () {
  $('#backupForm').hide()
  $('#backupModal').show()
}

$('#backupPw').change(function () {
  if ($('#backupPw').val() === null || $('#backupPw').val() === "") {
    return console.error('Empty encryption password not allowed')
  }
  if (rawPk === null) {
    return console.error('rawPk is null')
  }
  enterEncPk()
})

async function enterEncPk () {
  let e = await encryptPk(rawPk, $('#backupPw').val())
  rawPk = null
  $('#encrypted').val(e)
  $('#backupForm').show()
}

$('#saveEncrypted').on('click', function () {
  // Clear private key from memory
  rawPk = null
})

/* auth.js - handles user actions regarding sign in, sign up, recovery etc. */

/* When user chooses to continue with current account,
 * hide confirmation, show wallet UI, and
 * open relevant form
 */
$('.confirmAccount').on('click', function() {
  /* Hide confirmation form */
  $('#continueWithAccountConfirmation').hide()
  /* Show wallet UI in background */
  $('#connectLoginDetected').show()

  // If query is to connect, show nonce to sign
  if (params.get('connect') === 'true') {
    if (!params.get('nonce')) {
      alert('Nonce not provided in query string')
      return
    }
    $('#signMessageInput').val(escapeHTML(params.get("nonce")))
    $('#signMessageModal').show()
    return
  }
  // If query is to signTx, decode tx to string and show
  if (params.get('signTx') === 'true') {
    let ab = base64.toArrayBuffer(escapeHTML(params.get("txData")), true)
    let decoded = new TextDecoder().decode(ab).replace(/\//g, '\\/') // XSS mitigation
    let data = JSON.stringify(decoded, null, 2)
    $('#signTxInput').text(JSON.parse(data))
    $('#signTxModal').show()
    return
  }
  // If query is to createTx, show txBuilder
  if (params.get('createTx') === 'true') {
    // First, check for parameters to fill
    $('#satTxRadio').attr('checked', 'true')
    switchCreateTxFormType("1")
    if (params.get('contractAddress')) {
      $('#createTxTokenContract').val(escapeHTML(params.get('contractAddress')))
      $('#tokenTxRadio').attr('checked', 'true')
      switchCreateTxFormType("2")
    }
    if (params.get('amount')) {
      $('#createTxValue').val(escapeHTML(params.get('amount')))
    }
    if (params.get('to')) {
      $('#createTxToAddress').val(escapeHTML(params.get('to')))
    }
    $('#createTxModal').show()
    return
  }
  // If query is to call contract, show contract call form
  if (params.get('contractCall') === 'true') {
    // If contractAddress is in params, plug it in
    if (params.get('contractAddress')) {
        getContractMethods(escapeHTML(params.get('contractAddress')))
        return showContractCallModal({ contractAddress: escapeHTML(params.get('contractAddress'))})
    }
    return showContractCallModal()
  }
  // If no query, just show wallet UI
  return
})

/* Cases to cover:
 * User is logged in -> (A) Create new account,
 *                      (B) Recover acccount,
 *                      (C) Continue with current account
 * User is signed out-> (A) Create new account,
 *                      (B) Recover account,
 */

/* (A) User creates a new account.
 * Show username registration form.
 * Handled by controllers/newAccounts.js
 */

/* (B) Recover account from backup
 * Back up is private key
 * Also used to log into other account
 * Handled by controllers/recoverAccount.js
 */

/* (C) User signs in with current account.
 * If signing TX, continue to sign TX UI.
 * Otherwise, callback.
 */

$('.signMessageBtn').on('click', function() {
  signMessageBtn()
})

async function signMessageBtn () {
  try {
    // Sign the message with private key
    let pk = await authAndRecoverPk()
    const signature = web3js.eth.accounts.sign($('#signMessageInput').val(), pk)
    pk = null
    // Send the message to callback URL for auth
    const callbackUrl = decodeURIComponent(params.get('callbackUrl'))
    sendAddress(callbackUrl, signature)
    $('#signMessageModal').hide()
    alert('Address has been sent to application')
    window.close()
  } catch (err) {
    console.error(err)
  }
}

$('.cancelSignMessage').on('click', function() {
  $('#signMessageModal').hide()
})

$('.signOut').on('click', function() {
  logOutConf()
})

$('#logIn').on('click', function () {
  // Show login form
  $('#connectLoginNotDetected').hide()
  $('#switchAccountForm').show()
})

$('#logIntoAccount').on('click', async function() {
  try {
    // Authenticate with server
    let assertionOptions = await submitAuthenticationRequest($('#altUsernameInput').val())
    let assResult = await makeAssertion(assertionOptions)
    // Authentication will return pubkey if successful
    // Recover addr and null privatekey
    let pk = await recoverPk(window.localStorage.getItem('encryptedKey'), assResult.assPubkey)
    let { address } = web3js.eth.accounts.privateKeyToAccount(pk)
    window.localStorage.setItem('addr', address)
    window.localStorage.setItem('user', assResult.assUsername)
    pk = null
    
    // Show wallet UI
    $('#switchAccountForm').hide()
    loadWalletUI()

  } catch (err) {
    console.error(err)
  }

})