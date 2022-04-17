/* createTx.js - create and sign transaction */
// Display the fields relevant to chosen option

$('.createTxTopBtn').on('click', function () {
  $('#createTxModal').show()
  $('input[name=selectTxType][value="1"]').prop('checked', true)
  switchCreateTxFormType("1")
})

$('.cancelCreateTx').on('click', function () {
  $('#createTxModal').hide()
})

// Selecting radio button corresponding to TX type changes form fields
$('input[name="selectTxType"]').change(function () {
  let option = $('input[name="selectTxType"]:checked').val()
  switchCreateTxFormType(option)
})

/* Choose "1" for native TX, "2" for ERC20 token TX.
 * switchCreateTxFormType changes form fields based on tx type.
 */
function switchCreateTxFormType(option) {
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

/* Create TX flow */
$('.createTxBtn').on('click', async function () {
  try {
    $('#createTxSpinner').show()
    $('#createTxBtn').attr('disabled', true)
    clearErrorBanner()
    // Create the transaction based on txType selected (radio button)
    let option = $('input[name="selectTxType"]:checked').val()

    // if txType not selected or invalid, throw error
    if (!["1", "2"].includes(option)) {
      $('#createTxModal').hide()
      $('#createTxSpinner').hide()
      $('#createTxBtn').attr('disabled', false)
      throw Error('Select valid transaction type')
    }

    if (option === "1") {
      return createNativeTx(
        $('#createTxToAddress').val(),
        web3js.utils.toWei($('#createTxValue').val()),
        $('#createTxGasLimit').val()
      )
    }

    if (option === "2") {
      // Get ABI from block explorer (verified contracts only)
      let abi = await getAbi($('#createTxTokenContract').val())
      return createTokenTx(
        $('#createTxToAddress').val(),
        web3js.utils.toWei($('#createTxValue').val()),
        abi)
    }

  } catch (err) {
    errorMessageBanner(err)
    $('#createTxSpinner').hide()
    $('#createTxBtn').attr('disabled', false)
    $('#createTxModal').hide()
    console.error(err)
  }
})

/* Create ESAT transaction */
async function createNativeTx(to, value, gas) {
  try {
    let tx = {
      to, value, gas
    }
    // Sign the transaction
    let pk = await authAndDecryptPk()
    const signedTx = await web3js.eth.accounts.signTransaction(
      tx,
      pk
    )
    pk = null
    // Broadcast the transaction
    const receipt = await web3js.eth.sendSignedTransaction(signedTx.rawTransaction)

    successMessageBanner()

    // Update balance in UI
    const newBalance = await web3js.eth.getBalance(
      window.localStorage.getItem('addr'),
      "pending"
    )
    $('#esatBalance').text(web3js.utils.fromWei(newBalance))

    // Callback with transaction data IF callback is defined
    const callbackUrl = decodeURIComponent(params.get('callbackUrl'))
    if (callbackUrl !== 'null') {
      sendTransaction(callbackUrl, result)
      alert('Callback sent to application!')
    }

    // Reset createTx form and hide modal
    clearCreateTxInputs()
    $('#createTxSpinner').hide()
    $('#createTxBtn').attr('disabled', false)
    $('#createTxModal').hide()

    loadWalletUI()
    return

  } catch (err) {
    console.error(err)
    errorMessageBanner(err)
    // Reset createTx form and hide modal
    $('#createTxSpinner').hide()
    $('#createTxModal').hide()
    $('#createTxBtn').attr('disabled', false)
  }
}

/* Create ERC20 token transaction */
async function createTokenTx(to, value, abi = null) {
  try {
    abi = JSON.parse(abi)
    // If ABI not provided, use this default ABI (typical ERC20)
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
    // Create 'transfer' contract call
    let contract = new web3js.eth.Contract(abi, $('#createTxTokenContract').val())
    let transaction = contract.methods.transfer(to, value)

    // Estimate gas cost
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
    // Decrypt privkey, then sign & broadcast TX. Null pk after use.
    let pk = await authAndDecryptPk()
    let signedTx = await web3js.eth.accounts.signTransaction(options, pk)
    pk = null
    let receipt = await web3js.eth.sendSignedTransaction(signedTx.rawTransaction)
    successMessageBanner()

    // Update ESAT balance in UI
    let newBalance = await web3js.eth.getBalance(window.localStorage.getItem('addr'), "pending")
    $('#esatBalance').text(web3js.utils.fromWei(newBalance))
    // Update token balances and update UI
    await getTokenBalances(window.localStorage.getItem('addr'))

    // Callback with transaction data IF callback is defined
    const callbackUrl = decodeURIComponent(params.get('callbackUrl'))
    if (params.get('callbackUrl') !== 'null') {
      console.log('Invoking callback')
      sendTransaction(callbackUrl, receipt)
    }
    // Reset createTx form and close modal
    clearCreateTxInputs()
    $('#createTxModal').hide()
    $('#createTxSpinner').hide()
    $('#createTxBtn').attr('disabled', false)
    loadWalletUI()
    return
  } catch (err) {
    console.error(err)
    errorMessageBanner(err)
    // Reset createTx form and close modal
    $('#createTxModal').hide()
    $('#createTxSpinner').hide()
    $('#createTxBtn').attr('disabled', false)
  }
}

// Clicking on token in list of tokens opens createTx form for that token
$('#collapseTokenList').on('click', '.tokenListItem', async function () {
  try {
    switchCreateTxFormType("2")

    // Autofill token contract address
    let tokenData = await queryTokenList(this.id)
    $('#createTxTokenContract').val(tokenData.contractAddress)
    $('#createTxTokenContract').attr('disabled', true)

    // Check radio button for token TX
    $('input[name=selectTxType][value="2"]').prop('checked', true)

  } catch (err) {
    console.error(err)
  }
})

// Clicking on ESAT balance shows create TX form for ESATs
$('#esats').on('click', function () {
  $('#createTxModal').show()
  // Check radio button for native TX
  $('input[name=selectTxType][value="1"]').prop('checked', true)
  switchCreateTxFormType("1")
})

function clearCreateTxInputs() {
  $('#createTxToAddress').val("")
  $('#createTxValue').val("")
  $('#createTxTokenContract').val("")
  $('#createTxTokenContract').attr('disabled', false)
  $('#createTxGasLimit').val('2000000')
}