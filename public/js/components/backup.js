/* backup.js - handle backup encrypted key modal on account creation */
function showBackupModal () {
  $('#backupForm').hide()
  $('#backupModal').show()
}

$('#backupPw').change(function () {
  if ($('#backupPw').val() === null || $('#backupPw').val() === "") {
    return console.error('Empty encryption password not allowed')
  }
  if (rawPk === null) {
    return console.error('rawPk is null')
  }
  enterEncPk()
})

async function enterEncPk () {
  let e = await encryptPk(rawPk, $('#backupPw').val())
  $('#encrypted').val(e)
  $('#backupForm').show()
}

$('#saveEncrypted').on('click', function () {
  // Clear private key from memory
  rawPk = null
})