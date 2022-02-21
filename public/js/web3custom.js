let web3js;

function initWeb3 () {
  console.log('Loading web3js')
  web3js = new Web3('https://rpc.intmedium.xyz')
}

window.addEventListener('load', initWeb3)