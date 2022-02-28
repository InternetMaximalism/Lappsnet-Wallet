/* copyAddress.js - Copy address upon click */
$('.addressDisplay').on('click', function() {
  // On clicking an address, copy it from localStorage to clipboard
  navigator.clipboard.writeText(window.localStorage.getItem('IntMediumAddress'))
  alert(`Copied address ${window.localStorage.getItem('IntMediumAddress')} to clipboard!`)
})