/* createTx.js - create and sign transaction */
// Display the fields relevant to chosen option

$('.createTxTopBtn').on('click', function() {
    $('#createTxModal').show()
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

      $('#createTxSpinner').hide()
      $('#createTxBtn').attr('disabled', false)
      $('#createTxModal').hide()

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
      let transaction = contract.methods.transfer(to, web3js.utils.toWei(value))

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
      $('#createTxModal').hide()
      $('#createTxSpinner').hide()
      $('#createTxBtn').attr('disabled', false)
      return
  } catch (err) {
      console.error(err)
      $('#errorText').text(err)
      $('#errorBanner').show()
      $('#createTxModal').hide()
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
      $('#createTxTokenContract').attr('disabled', 'true')

  } catch (err) {
      console.error(err)
  }
})