/* Click button to auth for private key, and show
 * form prompting for passphrase to encrypt privkey with
 */
$('.backUpAccount').on('click', function() {
  backUpAccountClickHandler()
})

// rawPk holds unencrypted pk during backup
let rawPk = null

async function backUpAccountClickHandler() {
  try {
    rawPk = await authAndDecryptPk()
    showBackupModal()
  } catch (err) {
    console.error(err)
  }
}

function showBackupModal () {
  $('#backupForm').hide()
  $('#backupModal').show()
}

// When passphrase is entered, checks before using it to encrypt pk
$('#backupPw').change(function () {
  if ($('#backupPw').val() === null || $('#backupPw').val() === "") {
    return console.error('Empty encryption password not allowed')
  }
  if (rawPk === null) {
    return console.error('rawPk is null')
  }
  enterEncPk()
})

// Encrypt pk and show it in backup form
async function enterEncPk () {
  let e = await encryptPk(rawPk, $('#backupPw').val())
  // null pk after encryption
  rawPk = null
  $('#encrypted').val(e)
  $('#backupForm').show()
}

// Clicking the save button also nulls pk, just in case
$('#saveEncrypted').on('click', function () {
  rawPk = null
})