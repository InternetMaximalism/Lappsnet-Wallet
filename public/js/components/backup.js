/* backup.js - handle backup encrypted key modal on account creation */
$('.backUpAccount').on('click', function() {
  backUpAccountClickHandler()
})

async function backUpAccountClickHandler() {
  try {
    rawPk = await authAndRecoverPk()
    showBackupModal()
  } catch (err) {
    console.error(err)
  }
}

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
  rawPk = null
  $('#encrypted').val(e)
  $('#backupForm').show()
}

$('#saveEncrypted').on('click', function () {
  // Clear private key from memory
  rawPk = null
})