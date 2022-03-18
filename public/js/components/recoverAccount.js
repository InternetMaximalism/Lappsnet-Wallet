/* recoverAccount.js - recover account from privkey */
$('.recoverAccount').on('click', function() {
  recoverModal()
})

function recoverModal () {
  // Show modal
  $('#recoverModal').show()
}

$('.chooseDifferentAccount').on('click', function() {
  logOutConf()
})

function logOutConf () {
  // Show modal
  $('#logoutModal').show()
  $('.backUpKey').show()
}

// If log out confirmed, clear localStorage & show fresh login prompt
$('.logOutBtn').on('click', function() {
  window.localStorage.removeItem('user')
  window.localStorage.removeItem('addr')
  window.localStorage.removeItem('pk')
  $('#connectLoginDetected').hide()
  $('#logoutModal').hide()
  $('#continueWithAccountConfirmation').hide()
  $('#connectLoginNotDetected').show()
})

$('.cancelLogout').on('click', function() {
  $('#logoutModal').hide()
})

// If recover selected, show backup modal
$('.backUpKey').on('click', function() {
  $('#logoutModal').hide()
  showBackupModal()
})

/*
$('.recoverBtn').on('click', function() {
  accountRecoveryHandler()
})
*/

$('#recoveryFormBody').submit(function(event) {
  event.preventDefault()
  accountRecoveryHandler()
})

async function accountRecoveryHandler () {
  try {
    // Decrypt key with pass phrase
    let recoverPk = await recoverPk($('#encryptedBackup').val(), $('#yourPw').val())
    // Get address
    let { address } = await web3js.eth.accounts.privateKeyToAccount(recoverPk)
    window.localStorage.setItem('pk', recoverPk)
    window.localStorage.setItem('addr', address)
    recoverPk = null
    
    // Hide modal, show account
    $('#recoverModal').hide()
    $('#connectLoginNotDetected').hide()
    loadWalletUI()
  } catch (err) {
    console.error(err)
  }
}

$('.cancelRecovery').on('click', function() {
  $('#recoverModal').hide()
})