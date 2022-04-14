/* escapeHTML.js - helper function to escape special characters */
function escapeHTML (string) {
  return string.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#x27;')
               .replace(/`/g, '&#x60')
}