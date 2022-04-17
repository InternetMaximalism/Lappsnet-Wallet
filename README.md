# Lappsnet Wallet

Wallet for interacting with Lappsnet, an experimental network of smart contracts for Lightning Network users.

## Table of Contents
- [Using the wallet](#user-instructions)
- [How to withdraw to LN](#how-to-withdraw-to-ln)
- [How to get ESAT tokens](#how-to-get-esat-tokens)
- [How to Recover](#how-to-recover)
- [Developer Instructions](#developer-instructions)

## User instructions

### Create key

Visit [https://wallet.lappsnet.io/wallet](https://wallet.lappsnet.io/wallet) to create an account.

Your browser will generate a private key, which is then encrypted using your security chip. (Screen lock, Yubikey, etc.)

You register a username with Lappsnet Wallet's servers, which stores the encryption key for you.
The encrypted private key is stored in your browser.

Finally, back up your private key, secured by a password, in your password manager.

### Connecting to dapps

Connecting to dApps is done by signing a message provided by the dapp.

It should look something like `nonce: asdfasdfasdf` or `asdfasdfasdf`.
If it looks like it could be a transaction or authorization, DO NOT SIGN.

Otherwise, sign it and you should be redirected to the dApp as a logged in user.

### Signing transactions

Some dApps may prepare a transaction for you to sign.

Once on Lappsnet Wallet, check the contents of the transaction before signing.
*THIS IS CRUCIAL!*

If the transaction looks fine (destination address, amount, etc.), sign it.

The transaction will be broadcast, and the dapp will be notified.

### Create transaction

You can also initiate transactions yourself, from [https://wallet.lappsnet.io/wallet](https://wallet.lappsnet.io/wallet).

Choose whether you want to send ESATs (the native currency of Lappsnet), or other tokens.

TIP: Clicking on a token in the list will open a create transaction form for that token!

### Call contract

You can also make contract calls directly from within Lappsnet Wallet.

For this, you must specify the contract address, method, and enter parameters as necessary.
Some operations may cost gas, while others may be free. You will be shown an estimated gas cost when confirming.

After entering the contract address, click 'load' to get a list of methods.

Note: Only contracts verified on the [explorer](https://explorer.lappsnet.io) can be called this way.

You will see the result of a contract call in a success or error message at the top of the page.

## How to withdraw to LN

Visit the [Redeem page](https://wallet.lappsnet.io/redeem) while you are logged into your lappsnet wallet.
You will be asked to provide an invoice where the amount is `100 sats <= amount in sats < (ESAT balance / 1.02) `

Note that we charge a 2% fee on withdrawals to cover any potential Lightning Network fees.
Therefore, the withdrawal rate is `100 satoshi : 102 ESAT`.

If all routes to your wallet cost more than 2% in fees, the withdrawal will fail.

You can also withdraw to LN while logged in using your recovery key.

## How to get ESAT tokens

Visit the [Lappsnet website](https://web.lappsnet.io/) to purchase ESAT tokens at a rate of `100 ESAT : 100 satoshi`.

## How to recover

When you create your wallet, you will be asked to enter a passphrase to encrypt a backup key.
Store the encrypted key in your password manager when prompted. (*Not the passphrase!*)

You can also initiate a fresh backup at any time while logged in.

Unable to log into your wallet? Here is a troubleshooting guide:

### Lappsnet Wallet server unavailable

If the Lappsnet servers are down, you will have to run a local or cached version of Lappsnet wallet to recover your account.

Use the 'recover account' option, and enter your encrypted private key (saved in your password manager) and passphrase.

### Browser data cleared

Clearing browsing data may delete your local key.
In such case, you will not be able to recover your account by authenticating with our servers.

Use the 'recover account' option, and enter your encrypted private key (saved in your password manager) and passphrase.

### Security device lost/broken

If the security device (e.g. screen lock, YubiKey) is lost or broken, you will not be able to authenticate with the server. This may include hard resets of your device!

Use the 'recover account' option, and enter your encrypted private key (saved in your password manager) and passphrase.

For maximum safety, make sure your password manager data is stored on multiple devices.

## Developer instructions

There are 5 operations available, all initiated by a user opening a link in a new tab.

### Connect wallet

Path: `https://wallet.lappsnet.io/wallet`

| parameter | required? |
| --- | --- |
| `connect=true` | YES |
| `nonce=<nonce>` | YES |
| `callbackUrl=<encodeURIComponent(callback url)>` | YES |
| `callbackMethod=GET` | NO |

Generate a nonce for each wallet connection attempt. The nonce should preferably be human-readable.

The user will follow the link, sign the nonce with their account, and a callback will POST `{ signature, address }` to the specified URL.

If `callbackMethod=GET` is specified, instead of a POST callback, the user will be redirected to `${callbackUrl}?address=${address}&signature=${signature}`.

### Sign and broadcast transaction

Path: `https://wallet.lappsnet.io/wallet`

| parameter | required? |
| --- | --- |
| `signTx=true` | YES |
| `txData=<base64URL encoded tx>` | YES |
| `callbackUrl=<encodeURIComponent(callback url)>` | no |
| `callbackMethod=GET` | NO |

The user is asked to sign and broadcast the transaction provided in the `txData` parameter.

The `{ txhash }` will be POSTed to the callback url if specified.

If `callbackMethod=GET` is specified, instead of a POST callback, the user will be redirected to `${callbackUrl}?txhash=${<transactionHash>}`.

### Create transaction

Path: `https://wallet.lappsnet.io/wallet`

| parameter | required? |
| --- | --- |
| `createTx=true` | YES |
| `amount=<number of tokens, NOT Wei>` | no |
| `to=<recipient address>` | no |
| `contractAddress=<ERC20 token contract>` | no |
| `callbackUrl=<encodeURIComponent(callback url)>` | no |

The user is asked to create a transaction. Defaults to sending ESATs (Lappsnet's native token), unless `contractAddress` is specified.

All parameters given are entered in the form presented to the user, but the user may edit these values.

Once the user creates, signs, and broadcasts their transaction, `{ txhash }` will be POSTed to callback url if specified.

If `callbackMethod=GET` is specified, instead of a POST callback, the user will be redirected to `${callbackUrl}?txhash=${<transactionHash>}`.

### Call contract

(*Contract MUST BE VERIFIED* on [explorer](https://explorer.Lappsnet.xyz))

Path: `https://wallet.lappsnet.io/wallet`

| parameter | required? |
| --- | --- |
| `callContract=true` | YES |
| `contractAddress=<contract address>` | no |

You can send users to make contract calls on their own.

If `contractAddress` is specified, the user will be shown a list of methods for that contract, with corresponding input fields.

The user provides the necessary inputs, and a gas estimate is given for confirmation.

The chosen method will be called using send() or call() depending on the method.
The result is displayed to the user in a success or error banner.

### Open wallet

Path: `https://wallet.lappsnet.io/wallet`

Simply opens the wallet for the user to operate.