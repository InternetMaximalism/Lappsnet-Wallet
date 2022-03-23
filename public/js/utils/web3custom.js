let web3js;

function initWeb3 (callback) {
  console.log('Loading web3js')
  web3js = new Web3('https://rpc.lappsnet.io')
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
        let tokenList = (await $.get('https://explorer.lappsnet.io/api?module=account&action=tokenlist&address='.concat(address))).result
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
        let tokenList = (await $.get('https://explorer.lappsnet.io/api?module=account&action=tokenlist&address='.concat(window.localStorage.getItem('addr')))).result
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