let web3js;

function initWeb3 () {
  console.log('Loading web3js')
  web3js = new Web3('https://rpc.intmedium.xyz')
  // After web3js initialized, get user ESAT balance
  if (userAddress) {
      getBalance(userAddress)
  }
}

window.addEventListener('load', initWeb3)

async function getBalance (address) {
    try {
        web3js.eth.getBalance(
            userAddress,
            "latest",
            function(err, res)  {
                if (err) return console.error(err)
                $('#esatBalance').text(web3js.utils.fromWei(res))
            })
    } catch (err) {
        console.error(err)
    }
}

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
                      .text(`${escapeHTML(i.name)} (${escapeHTML(i.symbol)} - ${escapeHTML(web3js.utils.fromWei(i.balance))})`)
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

function queryTokenList (tokenList, symbol) {
    console.log(tokenList)
    return (tokenList.filter(i => {
        return i.symbol === symbol
    }))[0]
}

/* Return ABI for given verified contract */
async function getAbi (contractAddress) {
    try {
        let abi = (await $.get('https://explorer.intmedium.xyz/api?module=contract&action=getabi&address='.concat(contractAddress))).result
        if (abi === null) {
            return null
        }
        console.log(`ABI returned: ${abi}`)
        // Otherwise, return abi as object
        return abi
    } catch (err) {
        console.error(err)
    }
}