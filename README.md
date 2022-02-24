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

It should look something like `nonce: asdfasdfasdf` or `asdfasdfasdf`. If it is really long,
or clearly some kind of structured data that could be a transaction, DO NOT SIGN.

Otherwise, sign it and you should be redirected to the dApp as a logged in user.

3. Sign transaction

If the dApp prepares a transaction for you to sign, follow the link.

Once on IntMedium Identity, check the contents of the transaction before signing.
THIS IS CRUCIAL!

If the transaction looks fine (destination address, amount, etc.), sign it.

The transaction will be sent to the dApp, which should let you broadcast it.

4. Create transaction

You can also initiate transactions yourself.

Follow a link to `<intmedium-identity hostname>/auth?createTx=true` and you will be met with
the usual account options.

Once you proceed, there is a form where you can craft simple transactions.

Sign it and the signed transaction will be returned to you, or to the dApp that sent you.

## Integration instructions

A dApp frontend wishing to integrate IntMedium Identity must follow these instructions:

1. Connect wallet

The method for connecting to a user's wallet is similar to other wallets.

Start by generating a nonce for the connection attempt on the backend.

Have the user open a tab to `<intmedium-identity hostname>/auth?connect=true&callbackUrl=<encodeURIComponent(callback url)>`.

An example of `callback url` would be `<your-dapp hostname>/api/authentication`.

The user will sign the nonce with their private key, and post `{ signature, publicAddress }` to `callback url`.

Verify signature, and sign user in as given address.

2. Sign transaction

You can pass a transaction to IntMedium Identity using query parameters, if it is not too big.

Instructions to follow.

3. Create transaction

You can also have the user create their own transaction.

Have the user open a tab to `<intmedium-identity hostname>/auth?createTx-true&callbackUrl=<encodeURIComponent(callback url)`.

There, they will be able to craft their own transaction & sign it.

If callbackUrl is specified, the signed transaction will be posted there.

Give it to the user to broadcast.