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