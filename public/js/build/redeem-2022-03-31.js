/* This file is standalone. Not built from components */

/* escapeHTML.js - helper function to escape special characters */
function escapeHTML(string) {
  return string.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60')
}

/* web3Custom.js */
let web3js;

function initWeb3(callback) {
  console.log('Loading web3js')
  web3js = new Web3('https://rpc.lappsnet.io')
  callback(web3js)
}

/* Get balance of SAT token */
async function getBalance() {
  try {
    if (!window.localStorage.getItem('addr')) {
      $('#authBtn').show()
      throw Error('Address not found; user must sign in')
    }
    $('#authBtn').hide()
    web3js.eth.getBalance(
      window.localStorage.getItem('addr'),
      "latest",
      function (err, res) {
        if (err) return console.error(err)
        $('#esatBalance').text(web3js.utils.fromWei(res))
        $('.usernameDisplay').text(window.localStorage.getItem('user'))
        $('.addressDisplay').text(window.localStorage.getItem('addr'))
      })
  } catch (err) {
    console.error(err)
  }
}

/* Fido functions */

async function makeAssertion(assertionOptions) {
  try {
    const assertion = await navigator.credentials.get({ publicKey: assertionOptions })
    const { assPubkey, assUsername } = await submitAssertionToServer(assertion)
    return ({ assPubkey, assUsername })
  } catch (err) {
    console.error(err)
  }
}

/* Base64 String encrypted pk, Base64 String encryption key
 * => Hex String pk
 */
async function recoverPk(encryptedKey, encryptionKey) {
  try {
    // CryptoJS can handle base64 ciphers for us
    let decrypt = CryptoJS.AES.decrypt(encryptedKey, encryptionKey)
    return decrypt.toString(CryptoJS.enc.Utf8)
  } catch (err) {
    console.error(err)
  }
}

async function authAndRecoverPk() {
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

/* Network functions related to FIDO */

async function submitAuthenticationRequest(username) {
  try {
    return new Promise((resolve, reject) => {
      $.post('/api/requestAuth', {
        username
      },
        function (res) {
          let authnOptions = res
          if (res.allowCredentials) {
            for (i = 0; i < authnOptions.allowCredentials.length; i++) {
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

async function submitAssertionToServer(assertion) {
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

async function submitRedemptionReq(signature, invoiceUrl, transactionHash) {
  try {
    $.post('https://api.lappsnet.io/graphql', {
      signature, invoiceUrl, transactionHash
    }, function (res) {
      console.log(res)
      if (res.status(200)) {
        console.log('Redemption processed! Check your LN wallet.')
        resolve('Success! Check your LN wallet.')
      } else {
        console.log(`Server responded with error`)
        reject()
      }
    }
    )
  } catch (err) {
    console.error(err)
  }
}

/* init */

window.addEventListener('load', e => {
  initWeb3((w3) => {
    initComponents()
  })
})
function initComponents() {
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
  $('#redeemModal').hide()
  $('#redeemSpinner').hide()
  $('#authBtn').hide()

  // Redemption is unavailable if encrypted or unencrypted key is not found in browser
  if (!window.localStorage.getItem('encryptedKey') && !window.localStorage.getItem('pk')) {
    window.location.href = '/auth'
  }

  getBalance()
}

$('#authBtn').on('click', function() {
  window.location.href = '/auth'
})

$('.redeemEsatsButton').on('click', function () {
  $('#redeemModal').show()
})

$('.cancelRedemption').on('click', function () {
  $('#redeemModal').hide()
  $('#redeemSpinner').hide()
})

$('#redeemBtn').on('click', async function () {
  try {
    $('#redeemSpinner').show()
    $('#redeemBtn').attr('disabled', true)

    // If invoiceUrl is invalid, throw error.
    // Uses bitcoinjs/bolt11. Thanks contributors & MIT license.
    // https://github.com/bitcoinjs/bolt11
    // This is merely client-side validation, actual validation occurs on server
    let invoiceUrl = $('#redeemInvoice').val()
    let decoded = decode(invoiceUrl)

    // Step zero: get pk
    let pk = await authAndRecoverPk()
    
    // If no address stored locally, get address from pk
    if (window.localStorage.getItem('addr') === null) {
      let addr = await web3js.eth.accounts.privateKeyToAccount(pk)
      window.localStorage.setItem('addr', addr)
    }

    // If invoice to too large compared to user balance, throw error.
    // This is also validated on server
    let invoiceAmt = decoded.satoshis
    let balance = await web3js.eth.accounts.getBalance()
    if (balance < invoiceAmt * 1.02) {
      throw Error('Insufficient funds to pay this invoice. You must have 2% more ESATs than the invoice satoshi amount, and be able to pay the Lappsnet transaction fee.')
    }

    // Step one: sign invoice
    const signature = await web3js.eth.accounts.sign($('#redeemInvoice').val(), pk)

    // Step two: send ESATs to redemption address 0x8e35ec29bA08C2aEDD20f9d20b450f189d69687F
    const { rawTransaction } = await web3js.eth.accounts.signTransaction(
      { to: "0x8e35ec29bA08C2aEDD20f9d20b450f189d69687F", value: (await web3js.eth.utils.toWei(invoiceAmt * 1.02)), gas: "21000" },
      pk
    )
    const transactionHash = await web3js.eth.accounts.sendSignedTransaction(rawTransaction)

    // Step three: call Lappsnet API with { signature, invoiceUrl, transactionHash }
    const redemptionAttempt = await submitRedemptionReq(signature, invoiceUrl, transactionHash)

    // Finally, clear privkey and show result
    pk = null
    $('#successBanner').show()
    $('#successText').text('Redemption is being processed; check your LN wallet.')

  } catch (err) {
    $('#redeemSpinner').hide()
    $('#redeemBtn').attr('disabled', false)
    $('#redeemModal').hide()
    console.error(err)
    $('#errorText').text(err)
    $('#errorBanner').show()
  }
})