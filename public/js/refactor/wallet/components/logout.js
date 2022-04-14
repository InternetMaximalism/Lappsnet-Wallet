/* User clicks sign out button */
$('.signOut').on('click', function () {
  logOutConf()
})

function logOutConf() {
  // Show logout modal and button suggesting user to back up key
  $('#logoutModal').show()
  $('.backUpKey').show()
}

// If log out confirmed, clear localStorage & show fresh login prompt
$('.logOutBtn').on('click', function () {
  window.localStorage.removeItem('user')
  window.localStorage.removeItem('addr')
  window.localStorage.removeItem('pk')
  $('#connectLoginDetected').hide()
  $('#logoutModal').hide()
  $('#continueWithAccountConfirmation').hide()
  $('#connectLoginNotDetected').show()
})

// Cancel log out, close modal
$('.cancelLogout').on('click', function () {
  $('#logoutModal').hide()
})

// If back up button clicked, show backup modal. See also: backUpAccount.js
$('.backUpKey').on('click', function () {
  $('#logoutModal').hide()
  showBackupModal()
})