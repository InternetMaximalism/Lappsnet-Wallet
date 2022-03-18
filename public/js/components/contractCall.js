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