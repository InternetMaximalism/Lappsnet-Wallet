# IntMedium Identity

Wallet for interacting with IntMedium, the testnet for IntMax.

## User instructions

1. Create key

Visit `<intmedium-identity hostname>/auth` to create an account.

Choose a username, and you can generate a private key using your phone's authentication chip.

Your fingerprint is neither sent or stored, only used to authorize key generation.

2. Connect wallet

Click on the 'Connect' button provided on a dApp.

Once on IntMedium Identity, you will be asked whether to continue with the current account,
create a new one, or recover one from private key.

Once you choose your option and proceed accordingly, you will be shown the message you are
requested to sign.

It should look something like `nonce: asdfasdfasdf` or `asdfasdfasdf`.
If it looks like a transaction, DO NOT SIGN.

Otherwise, sign it and you should be redirected to the dApp as a logged in user.

3. Sign transaction

If the dApp prepares a transaction for you to sign, follow the link.

Once on IntMedium Identity, check the contents of the transaction before signing.
THIS IS CRUCIAL!

If the transaction looks fine (destination address, amount, etc.), sign it.

The transaction will be broadcast, and the dapp will be notified.

4. Create transaction

You can also initiate transactions yourself.

Follow a link to `<intmedium-identity hostname>/auth` and you will be met with
the usual account options.

Once you proceed, there is a form where you can craft transactions.
Choose whether you want to send SATs (the native currency of IntMedium), or other tokens.

TIP: Click on a token that you own to create a transaction for that token!

Once done, the signed transaction will be submitted to the network.

5. Call contract

You can also make contract calls directly from within IntMedium Identity!

For this, you must specify the contract address, method, and enter parameters as necessary.
Some operations may cost gas, while others may be free. You will be shown an estimated gas cost when confirming.

Contract address may also be provided as a query string in the URL.

You will see the result of a contract call in a success or error message at the top of the page.

## Integration instructions

There are 5 operations available, all initiated by a user opening a link in a new tab.

1. Connect wallet

Path: `https://<intmedium identity hostname>/auth`
REQUIRED Query parameters: `connect=true`, `nonce=<nonce>`, `callbackUrl=<encodeURIComponent(callback url)>`

Generate a nonce for each wallet connection attempt.

The user will follow the link, sign the nonce with their account, and a callback will return `{ signature, publicAddress }`
to the specified URL.

Verify signature.

2. Sign and broadcast transaction

Path: `https://<intmedium-identity hostname>/auth`
REQUIRED Query parameters: `signTx=true`, `txData=<base64URL encoded tx>`
OPTIONAL Query parameters: `callbackUrl=<encodeURIComponent(callback url)>`

The user is asked to sign and broadcast the transaction provided in the `txData` parameter.

The `txhash` will be sent to the callback url if specified. Verify if necessary.

3. Create transaction

Path: `https://<intmedium-identity hostname>/auth`
REQUIRED Query parameters: `createTx=true`
OPTIONAL Query parameters: `amount=<number of tokens, NOT Wei>`, `to=<recipient address>`, `contractAddress=<ERC20 token contract>`,
`callbackUrl=<encodeURIComponent(callback url)>`

The user is asked to create a transaction. Defaults to sending SATs (IntMedium's native token), unless `contractAddress` is specified.

All parameters given are entered in the form presented to the user, but the user may edit these values.

Once the user creates, signs, and broadcasts their transaction, `txhash` will be sent to callback url if specified.
Verify if necessary.

4. Call contract (Contract MUST BE VERIFIED on [explorer](https://explorer.intmedium.xyz))

Path: `https://<intmedium-identity hostname>/auth`
REQUIRED Query parameters: `callContract=true`
OPTIONAL Query parameters: `contractAddress=<contract address>`

You can send users to make contract calls on their own.

If `contractAddress` is specified, the user will be shown a list of methods for that contract.
Otherwise, the user must provide the contract address, after which a list of methods is loaded.

The user provides the necessary inputs, and a gas estimate is given for confirmation.

The chosen method will be called using send() or call() depending on the method.
The result is displayed to the user in a success or error banner.

5. Open wallet

Path: `https://<intmedium-identity hostname>/auth`

Simply opens the wallet for the user to operate.