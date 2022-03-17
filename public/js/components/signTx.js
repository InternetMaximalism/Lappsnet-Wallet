/* signTx.js - signs transaction passed as query parameter */

$('.cancelSignTx').on('click', function() {
  $('#signTxModal').hide()
})

$('.signTxBtn').on('click', function() {
  $('#signTxSpinner').show()
  $('#signTxBtn').attr('disabled', true)
  $('#errorBanner').hide()
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
          window.close()
      })
})