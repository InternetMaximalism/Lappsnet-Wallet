let web3js;

function initWeb3 () {
  console.log('Loading web3js')
  web3js = new Web3('https://rpc.intmedium.xyz')
  // After web3js initialized, get user ESAT balance
  web3js.eth.getBalance(
      userAddress,
      "latest",
      function(err, res)  {
          if (err) return console.error(err)
          $('#esatBalance').text(web3js.utils.fromWei(res))
      })
}

window.addEventListener('load', initWeb3)