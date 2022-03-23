# Lappsnet Wallet

Wallet for interacting with Lappsnet, an experimental network of smart contracts for Lightning Network users.

## Table of Contents
- [User Instructions](#user-instructions)
- [Integration Instructions](#integration-instructions)

## User instructions

### Create key

Visit `<lappsnet wallet hostname>/auth` to create an account.

Your browser will generate a private key, which is then encrypted using your security chip.
(Screen lock, Yubikey, etc.)

You register a username with Lappsnet Wallet's servers, which stores the encryption key for you.
The encrypted private key is stored in your browser.

Finally, back up your private key, secured by a password, in your password manager.

### Connect wallet to dApp

Click on the 'Connect' button provided by the dApp.

Once on Lappsnet Wallet, you will be asked whether to continue with the current account.

Once you choose your option, you will be shown the message to sign.

It should look something like `nonce: asdfasdfasdf` or `asdfasdfasdf`.
If it looks like it could be something unintended, DO NOT SIGN.

Otherwise, sign it and you should be redirected to the dApp as a logged in user.

### Sign transaction

If the dApp prepares a transaction for you to sign, follow the link.

Once on IntMedium Identity, check the contents of the transaction before signing.
THIS IS CRUCIAL!

If the transaction looks fine (destination address, amount, etc.), sign it.

The transaction will be broadcast, and the dapp will be notified.

### Create transaction

You can also initiate transactions yourself.

Follow a link to `<lappsnet wallet hostname>/auth` and you will be met with
the usual account options.

Once you proceed, there is a form where you can craft transactions.
Choose whether you want to send SATs (the native currency of IntMedium), or other tokens.

TIP: Click on a token in the list of tokens you own to create a transaction for that token!

Once done, the signed transaction will be submitted to the network.

### Call contract

You can also make contract calls directly from within IntMedium Identity!

For this, you must specify the contract address, method, and enter parameters as necessary.
Some operations may cost gas, while others may be free. You will be shown an estimated gas cost when confirming.

Contract address may also be provided as a query string in the URL.

After entering the contract address, click 'load' to get a list of methods.

Note: Only contracts verified on the [explorer](https://explorer.intmedium.xyz) can be called this way.

You will see the result of a contract call in a success or error message at the top of the page.

## Integration instructions

There are 5 operations available, all initiated by a user opening a link in a new tab.

### Connect wallet

Path: `https://<lappsnet wallet hostname>/auth`

REQUIRED Query parameters: `connect=true`, `nonce=<nonce>`, `callbackUrl=<encodeURIComponent(callback url)>`

Generate a nonce for each wallet connection attempt.

The user will follow the link, sign the nonce with their account, and a callback will return `{ signature, publicAddress }`
to the specified URL.

Verify signature.

### Sign and broadcast transaction

Path: `https://<lappsnet wallet hostname>/auth`

REQUIRED Query parameters: `signTx=true`, `txData=<base64URL encoded tx>`

OPTIONAL Query parameters: `callbackUrl=<encodeURIComponent(callback url)>`

The user is asked to sign and broadcast the transaction provided in the `txData` parameter.

The `txhash` will be sent to the callback url if specified. Verify if necessary.

### Create transaction

Path: `https://<lappsnet wallet hostname>/auth`

REQUIRED Query parameters: `createTx=true`

OPTIONAL Query parameters: `amount=<number of tokens, NOT Wei>`, `to=<recipient address>`, `contractAddress=<ERC20 token contract>`,
`callbackUrl=<encodeURIComponent(callback url)>`

The user is asked to create a transaction. Defaults to sending SATs (IntMedium's native token), unless `contractAddress` is specified.

All parameters given are entered in the form presented to the user, but the user may edit these values.

Once the user creates, signs, and broadcasts their transaction, `txhash` will be sent to callback url if specified.
Verify if necessary.

### Call contract (Contract MUST BE VERIFIED on [explorer](https://explorer.intmedium.xyz))

Path: `https://<lappsnet wallet hostname>/auth`

REQUIRED Query parameters: `callContract=true`

OPTIONAL Query parameters: `contractAddress=<contract address>`

You can send users to make contract calls on their own.

If `contractAddress` is specified, the user will be shown a list of methods for that contract.
Otherwise, the user must provide the contract address, after which a list of methods is loaded.

The user provides the necessary inputs, and a gas estimate is given for confirmation.

The chosen method will be called using send() or call() depending on the method.
The result is displayed to the user in a success or error banner.

### Open wallet

Path: `https://<lappsnet wallet hostname>/auth`

Simply opens the wallet for the user to operate.
