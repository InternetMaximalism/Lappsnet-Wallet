async function submitRedemptionReq(signature, invoiceUrl, transactionHash) {
  try {
    return new Promise((resolve, reject) => {
      var input = { signature, invoiceUrl, transactionHash }
      $.ajax({
        method: 'POST',
        url: 'https://api.lappsnet.io/graphql',
        contentType: 'application/json',
        data: JSON.stringify({
          query: `mutation($input: ClaimReturnSatInput!) {
            claimReturnSat(input: $input)
          }`,
          variables: { input }
        }),
        success: function(res) {
          console.log(res)
          resolve()
          if (res.errors?.length > 0) {
            res.errors.forEach(e => {
              console.error(e.message)
            })
            reject(res.errors[0].message)
          } else {
            alert('Redemption processed! Check your LN wallet.')
            resolve('Success! Check your LN wallet.')
          }
        },
        error: function(err) { 
          console.log(`Server responded with error`)
          console.error(err)
          reject(err)
        }
      })
    })
  } catch (err) {
    console.error(err)
  }
}