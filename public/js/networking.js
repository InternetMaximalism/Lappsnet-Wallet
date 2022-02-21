
function checkUsernameAvailability (username) {
  // Query server for username availability on each input
  $.post('/api/checkUsername', {
      username: username
  },
  function (res) {
      console.log(res)
      if (res.available === true) {
          // Show username as available
          $('#registerAccount').removeClass('btn-disabled btn-danger').addClass('btn-success')
          $('#registerAccountSpinner').hide()
      }
      return
  })
  .fail(function (res) {
      // Show username as unavailable
      $('#registerAccount').removeClass('btn-disabled btn-success').addClass('btn-danger')
      $('#registerAccountSpinner').hide()
      console.log(`Username unavailable`)
      return
  })
}

async function submitRegistrationRequest (username) {
  try {
      if (!$('#registerAccount').attr('class').includes('btn-success')) {
          // If not btn-success, don't waste time querying
          return
      }
      return new Promise((resolve, reject) => {
          $.post('/api/registerUsername', {
              username
          },
          function (res) {
              if (res.username === username) {
                  // Return JSON data
                  console.log(res)
                  resolve(res)
              } else {
                  // Show server error
                  console.log(`Server responded with ${res.status}`)
                  reject()
              }
          })
      })
  } catch (err) {
      console.error(err)
      alert(err)
  }
}

async function submitAttestationToServer (username, challenge, credId) {
  try {
      return new Promise((resolve, reject) => {
          console.log(`Submitting challenge ${challenge}, username ${username}, credId ${credId}`)
          $.post('/api/postAttestation', {
              challenge, 
              username, 
              credId
          },
          function (res) {
              console.log(`${res.username} ${res.credId}`)
              if (res.username && res.credId) {
                  // Success, store username, credId in window.localStorage
                  console.log('Storing username and credId to window.localStorage...')
                  window.localStorage.setItem('IntMediumUsername', res.username)
                  window.localStorage.setItem('IntMediumCredId', res.credId)
                  resolve(res)
              } else {
                  // Show server error
                  console.log(`Server responded invalid data`)
                  reject()
              }
          })
          .fail(function (res) {
              console.error(`Server returned error`)
              reject()
          })
      })
  } catch (err) {
      console.error(err)
      alert(err)
  }
}