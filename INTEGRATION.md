# Interfacing with Lappsnet Wallet

dApps integration of Lappsnet Wallet should be done via a JS wrapper
(to-be-developed) that implements the following requests.

WalletConnect was rejected as a centralization vector, as it relies
on a server provided by the wallet operator.

## Methods to implement

A list of methods, and their web3js counterparts.

Parameters should be passed as URL query params.

| Method | Comparable web3js method |
| --- | --- |
|[Connect wallet / sign arbitrary data](#connect-wallet--sign-arbitrary-data)|Sign a message to connect wallet, or any arbitrary data `web3.accounts.sign(nonce,privateKey)`|
|[Create transaction](#create-transaction)|Provide user-editable tx for `web3.eth.signTransaction(tx, address)` and `.sendSignedTransaction()`|
|[Sign and broadcast transaction](#sign-and-broadcast-transaction)|Provide uneditable tx for `web3.eth.signTransaction(tx, address)` and `.sendSignedTransaction()`|
|[Call contract](#call-contract)|Give a list of methods with `web3.eth.Contract.methods` for the user to call `.myMethod().call(options)` or `myMethod().send(options)` on.|

### Connect wallet / Sign arbitrary data

Compares to: `web3.eth.accounts.sign(nonce, privateKey)`

Asks user to connect wallet by signing a message (nonce). Can also
technically be used to sign any arbitrary data. *This includes sending tokens other than ESAT or ERC20,* although you could also use the [Call contract](#call-contract) method which has a poorer UX.

___User views the data they are asked to sign.___
If confirmed, POSTs address and signature.

If `callbackMethod=GET` is specified, user will instead GET with
address and signature as params. Some mitigation of replay attacks
is desired in this case, as both the nonce and signature are publicly
visible.

Make request: `GET https://wallet.lappsnet.io/wallet`

| parameter | required? |
| --- | --- |
| `connect=true` | YES |
| `nonce=<nonce>` | YES |
| `callbackUrl=<encodeURIComponent(callback url)>` | YES |
| `callbackMethod=GET` | NO |

Returns: `POST <callbackUrl>` with payload: `{ signature, address }`

Or: `GET <callbackUrl>?address=<address>&signature=<signature>`

`signature` is return [object](https://web3js.readthedocs.io/en/v1.2.11/web3-eth-accounts.html#sign) from `web3.eth.accounts.sign(data, privkey)`

`address` is hex-encoded address (string).

The frontend should verify the signature: `web3.eth.accounts.recover(signature) === address`

## Create transaction

Compares to: Opening a wallet with optionally prefilled tx information,
and `web3.eth.signTransaction(tx, address)`

Asks user to create a transction, optionally with pre-filled fields.

If `callbackMethod=GET` is specified, user will instead GET with
txhash as query param.

Make request: `GET https://wallet.lappsnet.io/wallet`

| parameter | required? |
| --- | --- |
| `createTx=true` | YES |
| `amount=<number of tokens, NOT Wei>` | NO |
| `to=<String: recipient address>` | NO |
| `contractAddress=<ERC20 token contract address>` | NO |
| `callbackUrl=<encodeURIComponent(callback url)>` | NO |
| `callbackMethod=GET` | NO |

Returns: `POST <callbackUrl>` with payload `{ txhash }`

Or: `GET <callbackUrl>?txhash=<txhash>`

`txhash` is 32-byte String transaction hash.

## Sign and broadcast transaction

Compares to: `web3.eth.signTransaction(tx, address)`

If you don't want the user to be presented with an editable form,
use this function instead of [create transaction](#create-transaction).

_Transaction data must be base64url encoded!_

___User views the transaction they are asked to sign.___ Then, the
signed transaction is broadcast, and txhash is POSTed as callback.

If `callbackMethod=GET` is specified, user will instead GET with
txhash as query param.

Make request: `GET https://wallet.lappsnet.io/wallet`

| parameter | required? |
| --- | --- |
| `signTx=true` | YES |
| `txData=<base64URL encoded tx>` | YES |
| `callbackUrl=<encodeURIComponent(callback url)>` | no |
| `callbackMethod=GET` | NO |

Returns: `POST <callbackUrl>?txhash=<txhash>`

Or: `GET <callbackUrl>?txhash=<txhash>`

`txhash` is 32-byte String transaction hash.

## Call contract

Compares to: `web3.eth.Contract.methods.myMethod([param, [...]]).call(options)` and `web3.eth.Contract.methods.myMethod([param, [...]]).send(options)`

Make a contract call directly from the wallet.
Contract **MUST** be verified on [Lappsnet Explorer](https://explorer.lappsnet.io), as we rely on it to get ABI info.

Note that this is not intuitive for many users; it may be preferable to
[sign arbitrary data](#connect-wallet--sign-arbitrary-data) in a
human-readable way, and make the call() or send() on the frontend.

Make request: `GET https://wallet.lappsnet.io/wallet`

| parameter | required? |
| --- | --- |
| `callContract=true` | YES |
| `contractAddress=<contract address>` | no |

The user must manually select the method and enter the relevant values.

Returns: There is no callback to this function.

## Something missing?

If it is something easily addressible, please open an issue and I can probably make the fix relatively quickly. (e.g. adding callbacks for function calls, fixing discrepancies)