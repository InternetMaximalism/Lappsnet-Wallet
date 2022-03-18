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

$('.recoverBtn').on('click', function() {
  // Check key is hex, 64 bytes or '0x' prefix + 64 bytes
  console.log('Checking key')
  let keyInput = $('#recoveryKeyInput').val().trim()
  if (
        ( keyInput.slice(0,2) === '0x' &&
          keyInput.length === 66) &&
          /[0-9A-Fa-f]{6}/g.test(keyInput.slice(2,66)
        )
      || 
        ( keyInput.slice(0,2) !== '0x' && 
          keyInput.length === 64 &&
          /[0-9A-Fa-f]{6}/g.test(keyInput))
      ) {

  } else {
      console.error('Key format is wrong')
      return alert('Key format invalid: must be 32 bytes hex, with or without 0x prefix')
  }
  
  // Get address
  let split = keyInput.split('0x')
  let { address } = web3js.eth.accounts.privateKeyToAccount('0x'.concat(split[split.length-1]))
  // Store private key and address
  window.localStorage.setItem('IntMediumPrivateKey', '0x'.concat(split[split.length-1]))
  window.localStorage.setItem('addr', address)
  // Hide modal, show account
  $('#recoverModal').hide()
  $('#connectLoginNotDetected').hide()
  loadWalletUI()
})

$('.cancelRecovery').on('click', function() {
  $('#recoverModal').hide()
})