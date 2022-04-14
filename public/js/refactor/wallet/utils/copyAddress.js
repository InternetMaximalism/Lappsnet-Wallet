/* copyAddress.js - Copy address upon click */
$('.addressDisplay').on('click', function () {
  // On clicking an address, copy it from localStorage to clipboard
  if (!navigator.clipboard) {
    // Don't try anthing
    // TODO: Is it worth implementing the deprecated execCommand('copy') method for compatibility?
  } else {
    navigator.clipboard.writeText(window.localStorage.getItem('addr'))
      .then(() => {
        alert(`Copied address ${window.localStorage.getItem('addr')} to clipboard!`)
      })
      .catch(() => {
        alert(`Something went wrong! Please manually copy and paste.`)
      })
  }
})