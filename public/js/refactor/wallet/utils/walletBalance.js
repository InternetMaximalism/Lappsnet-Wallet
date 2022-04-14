/* Get balance of ESAT token */
async function getBalance(web3js, address = window.localStorage.getItem('addr')) {
    try {
        if (!address) {
            throw Error('Address not found; user must sign in')
        }
        web3js.eth.getBalance(
            address,
            "latest",
            function (err, res) {
                if (err) return console.error(err)
                // Display balance, address, username (if available)
                $('#esatBalance').text(web3js.utils.fromWei(res))
                $('.usernameDisplay').text(window.localStorage.getItem('user'))
                $('.addressDisplay').text(address)
            })
    } catch (err) {
        console.error(err)
    }
}

/* Add list of tokens and balances to UI */
async function getTokenBalances(address = window.localStorage.getItem('addr')) {
    try {
        let tokenList = await getTokenList(address)
        if (!tokenList) {
            return null
        }
        // Add tokens to UI
        $('#tokenCount').text(tokenList.length)
        let balancesDiv = $('#collapseTokenList')
        balancesDiv.empty()
        let ul = $('<ul>').appendTo(balancesDiv)
        tokenList.forEach(i => {
            let li = $('<li>')
                .text(`${escapeHTML(i.name)} (${escapeHTML(web3js.utils.fromWei(i.balance))} ${escapeHTML(i.symbol)})`)
                .attr('class', `tokenListItem m-1 p-1 border rounded-pill`)
                .attr('id', `${escapeHTML(i.symbol)}`)
                .appendTo(ul)
        })
        $('#tokenBalances').show()
        return tokenList
    } catch (err) {
        console.error(err)
    }
}

/* Get list of tokens owned by address */
async function getTokenList() {
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

/* Look for token by symbol */
async function queryTokenList(symbol) {
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