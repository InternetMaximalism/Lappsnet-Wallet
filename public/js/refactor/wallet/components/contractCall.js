/* contractCall.js - handles contract calls other than ERC20 */

/* Open contract call modal */
$('.contractCallTopBtn').on('click', function() {
  // If contractAddress is in params, plug it in
  if (params.get('contractAddress')) {
      getContractMethods(escapeHTML(params.get('contractAddress')))
      return showContractCallModal({ contractAddress: escapeHTML(params.get('contractAddress'))})
  }
  return showContractCallModal()
} )

function showContractCallModal (args = {}) {
  $('#contractCallModal').show()
  if (args !== {}) {
      // Set default values
      $('#contractAddress').val(args.contractAddress)
      return
  }
}

/* Cancel contract call and hide modal */
$('.cancelContractCall').on('click', function() {
  hideContractCallModal()
})

function hideContractCallModal () {
  $('#contractCallModal').hide()
  $('#methodSelector').hide()
}

/* After entering contract address, click to load a list of methods */
$('#loadContract').on('click', function() {
  getContractMethods(escapeHTML($('#contractAddress').val()))
})

/* Get list of methods for contract at address and add them to contract call modal */
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

/* Return ABI for given verified contract. Contract MUST be verified on explorer */
async function getAbi (contractAddress) {
    try {
        let abi = (await $.get('https://explorer.lappsnet.io/api?module=contract&action=getabi&address='.concat(contractAddress))).result
        if (abi === null) {
            return null
        }
        // Otherwise, return abi as object
        return abi
    } catch (err) {
        console.error(err)
    }
}

/* When a method is selected, show the corresponding inputs */
$('#methodSelector').change(function() {
  console.log(`Getting inputs for ${$('#methodSelector').find(":selected").val()}`)
  getMethodInputs(
      escapeHTML($('#contractAddress').val()),
      escapeHTML($('#methodSelector').find(":selected").val())
  )
})

/* Get the list of inputs for given method, and add to modal */
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

/* Continue to confirmation & gas estimate for entered contract, method & inputs */
$('.contractCallBtn').on('click', () => {
  // Get selected method
  let method = $('#methodSelector').find(":selected").val()
  // Get inputs (parameters)
  let inputs = []
  $('#inputList input').each(function() {
      /* There is an issue where single quotes are added to the string */
      inputs.push({ [$(this).attr('class')] : $(this).val().replaceAll("'", "") })
  })
  let args = {
      method, inputs
  }
  hideContractCallModal()
  // Show contract call and estimated gas cost to user for confirmation
  confirmContractCall(args)
})

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
      errorMessageBanner(err)
  }
}

/* Confirm gas estimate & make contract call */
$('.confirmCallBtn').on('click', function() {
  let args = $('.confirmContractCallContents').text()
  hideContractConfirmationModal()
  submitContractCall(args)
})

/* Cancel contract call & close modal */
$('.cancelConfirmCall').on('click', function() {
  hideContractConfirmationModal()
})

function hideContractConfirmationModal () {
  $('#confirmContractCallModal').hide()
}

/* Sign and submit contract call. Display result, if any */
async function submitContractCall(args) {
  try {
      args = JSON.parse(args)
      let inputs = args.inputs.map(i => {
          return Object.values(i)[0]
      })
      // Get contract, method name, args
      let abi = JSON.parse(await getAbi($('#contractAddress').val()))
      let contract = new web3js.eth.Contract(abi, $('#contractAddress').val())

      // Check stateMutability of method
      let stateMutability = abi.filter(i => {
          return i.name === args.method
      })[0].stateMutability
  
      // Call or send smart contract method according to stateMutability
      let prepared = await contract.methods[args.method].apply(null, inputs)
      if (stateMutability === 'view' || stateMutability === 'pure') {
          let result = await prepared.call()
          successMessageBanner(result)
          return
      } else {
          let result = await prepared.send()
          successMessageBanner(result)
          return
      }

  } catch (err) {
      console.error(err)
      errorMessageBanner(err)
  }
}
