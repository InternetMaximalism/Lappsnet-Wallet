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

A dApp frontend wishing to integrate IntMedium Identity must follow these instructions:

1. Connect wallet

The method for connecting to a user's wallet is similar to other wallets.

Start by generating a nonce for the connection attempt on the backend.

Have the user open a tab to `<intmedium-identity hostname>/auth?connect=true&callbackUrl=<encodeURIComponent(callback url)>`.

An example of `callback url` would be `<your-dapp hostname>/api/authentication`. Make sure CORS is allowed.

The user will sign the nonce with their private key, and post `{ signature, publicAddress }` to `callback url`.

Verify signature, and sign user in as given address.

2. Sign transaction

You can pass a transaction to IntMedium Identity using query parameters, if it is not too big.

Have the user open a tab to `<intmedium-identity hostname>/auth?signTx=true&txData=<base64URL encoded tx>&callbackUrl=<encodeURIComponent(callback url)>`.

Once the user signs and broadcasts the transaction, `txhash` will be sent to `callback url`.

3. Create transaction

You can also have the user create their own transaction.

Have the user open a tab to `<intmedium-identity hostname>/auth?createTx=true&callbackUrl=<encodeURIComponent(callback url)`.

There, they will be able to craft their own transaction, sign and broadcast it.

If callbackUrl is specified, the transaction hash will be posted there.

4. Call contract

You can send users to make contract calls on their own.

Have the user open a tab to `<intmedium-identity hostname>/auth?callContract=true`.

Callbacks are not supported.