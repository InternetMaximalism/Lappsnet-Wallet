/* callback.js - these functions are called when a callback URL is specified in query parameter */

/* sendAddress - called as callback for 'connect' */
async function sendAddress(url, signature) {
  try {
    if (params.get("callbackMethod") === "GET") {
      // if callbackMethod=GET, open callback URL with params
      window.location.href = `${url}?address=${window.localStorage.getItem('addr')}&signature=${signature}`
      return
    } else {
      // default: POST request
      return new Promise((resolve, reject) => {
        $.post(url, {
          signature: signature,
          publicAddress: window.localStorage.getItem('addr')
        })
          .then((result) => {
            console.log('Callback sent to URL')
          })
      })
    }
  } catch (err) {
    console.error(err)
  }
}

/* sendTransaction - called as callback for 'signTx' and 'createTx' */
async function sendTransaction(url, transaction) {
  try {
    if (params.get("callbackMethod") === "GET") {
      // if callbackMethod=GET, open callback URL with params
      window.location.href = `${url}?txhash=${transaction}`
      return
    } else {
      // default: POST request
      return new Promise((resolve, reject) => {
        $.post(url, {
          signedTx: transaction
        })
          .then((result) => {
            console.log('Signed TX sent to URL')
          })
    })
    }
  } catch (err) {
    console.error(err)
  }
}