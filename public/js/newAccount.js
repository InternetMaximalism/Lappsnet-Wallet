$('#registerAccount').on('click', createNewAccount)

async function createNewAccount () {
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
    const shortenedKey = buffer.Buffer.from(base64.toArrayBuffer(publicKey, true).slice(0,32))
    let { address } = web3js.eth.accounts.privateKeyToAccount('0x'.concat(shortenedKey.toString('hex')))
    localStorage.setItem('IntMediumPrivateKey', '0x'.concat(shortenedKey.toString('hex')))
    localStorage.setItem('IntMediumAddress', address)
    localStorage.setItem('IntMediumUsername', username)
    localStorage.setItem('IntMediumCredId', credId)
    $('#addressText').text(localStorage.getItem('IntMediumAddress'))
    $('#address').show()

    // If not signing transaction
    if (params.get('connect')) {
      // Sign the message with private key
      const signature = web3js.eth.accounts.sign($('#signMessageInput').val(), window.localStorage.getItem('IntMediumPrivateKey'))
      // Send the message to callback URL for auth
      const callbackUrl = decodeURIComponent(params.get('callbackUrl'))
      sendAddress(callbackUrl, signature)
        return alert('callback done')
    }
    // If signing transaction
    if (params.get('signTx')) {
      alert('show signtx confirmation')
      return $('#signTxForm').show()
    }
    // If creating transaction
    if (params.get('createTx')) {
      return alert('show createTx form')
    }

  } catch (err) {
    console.error(err)
    alert(err)
  }
}