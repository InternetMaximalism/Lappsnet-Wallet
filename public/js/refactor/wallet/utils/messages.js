/* Display and clear banners with messages */
function successMessageBanner (message = "") {
  $('#successBanner').show()
  $('#successMessage').text(escapeHTML(message))
}

function clearSuccessBanner () {
  $('#successBanner').hide()
  $('#successMessage').text("")
}

function warningMessageBanner (message = "") {
  $('#warningBanner').show()
  $('#warningMessage').text(escapeHTML(message))
}

function clearWarningBanner () {
  $('#warningBanner').hide()
  $('#warningMessage').text("")
}

function errorMessageBanner (message = "") {
  $('#errorBanner').show()
  $('#errorMessage').text(escapeHTML(message))
}

function clearErrorBanner () {
  $('#errorBanner').hide()
  $('#errorMessage').text("")
}