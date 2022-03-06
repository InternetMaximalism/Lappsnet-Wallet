/* contractCall.js - handles contract calls other than ERC20 */

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
}

/* Get list of methods for contract at address and show them */
async function getContractMethods (address) {
    try {
        // Get list of methods

        // Show pulldown 
    } catch (err) {
        console.error(err)
    }
}

$('.contractCallBtn').on('click', () => {
    let args = {}
    hideContractCallModal()
    confirmContractCall(args)
})

/* Show modal to confirm method and args, estimated fee */
function confirmContractCall (args) {
    $('#confirmContractCallModal').show()
}

/* Sign and submit. Display result, if any */
async function submitContractCall() {
    
}

function cancelContractCall () {
    
}