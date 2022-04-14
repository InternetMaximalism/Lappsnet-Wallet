/* Parse invoiceUrl for simple mistakes. If valid, returns proper ESAT amount to send.
 * Otherwise, throws error.
 * Only checks that invoices starts with 'lnbc', amount is denominated properly, and that user has sufficient balance.
 */
async function parseInvoice (invoiceUrl) {
  try {
    // If invoice does not start with lnbc, it's clearly not a mainnet LN invoice
    if (invoiceUrl.slice(0,4) !== 'lnbc') throw Error('Not a valid invoice')

    // If invoice is too large compared to user balance, throw error.
    let amountPart = invoiceUrl.slice(4,12).match(/^[0-9]{1,6}([munp]){1}/)[0]
    let invoiceNumber = parseInt(amountPart.slice(0, -1))
    let invoiceUnit = amountPart.slice(-1)
    let invoiceAmtSats
    switch (invoiceUnit) {
      case 'm':
        invoiceAmtSats = invoiceNumber * 100000
        break;
      case 'u':
        invoiceAmtSats = invoiceNumber * 100
        break;
      case 'n':
        invoiceAmtSats = invoiceNumber * 0.1
        break;
      case 'p':
        invoiceAmtSats = invoiceNumber * 0.0001
        break;
    }
    // Check user balance
    let balance = await web3js.eth.getBalance(window.localStorage.getItem('addr'))
    if ((await web3js.utils.fromWei(balance)) < invoiceAmtSats * 1.02) {
      throw Error('Insufficient funds to pay this invoice. You must have 2% more ESATs than the invoice satoshi amount, and be able to pay the Lappsnet transaction fee.')
    }
    return invoiceAmtSats * 1.02
  } catch (err) {
    throw err
  }
}