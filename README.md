# About

Documentation for developers who want to interface with Lappsnet Wallet.

dApps integration of Lappsnet Wallet should be done via a JS wrapper (to-be-developed) that implements the following requests.

WalletConnect was rejected as a centralization vector, as it relies on a server provided by the wallet operator.

### Deploying this site

Files are in `gitbook` branch. Command `npx honkit build . ./docs` to build static pages to `docs/`.

When updating this page, `npx honkit serve` can be used for local preview.

## Methods to implement

A list of methods, and their web3js counterparts.

Parameters should be passed as URL query params.

| Method | Comparable web3js method |
| --- | --- |
|[Connect wallet / sign arbitrary data](#connect-wallet--sign-arbitrary-data)|Sign a message to connect wallet, or any arbitrary data `web3.accounts.sign(nonce,privateKey)`|
|[Create transaction](#create-transaction)|Provide user-editable tx for `web3.eth.signTransaction(tx, address)` and `.sendSignedTransaction()`|
|[Sign and broadcast transaction](#sign-and-broadcast-transaction)|Provide uneditable tx for `web3.eth.signTransaction(tx, address)` and `.sendSignedTransaction()`|
|[Call contract](#call-contract)|Give a list of methods with `web3.eth.Contract.methods` for the user to call `.myMethod().call(options)` or `myMethod().send(options)` on.|

## Connect wallet / Sign arbitrary data

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

# FIDO API

Lappsnet wallet uses FIDO for key generation & retrieval.

Specifically, a user private key is generated by the following logic:

1. Use FIDO to create a public key associated with `wallet.lappsnet.io`
2. Generate a private key for the wallet
3. Encrypt the private key with the FIDO public key, saving the encrypted key to localStorage
4. A backup of the unencrypted key can be saved to the browser's key manager, if the user wishes

This construction enables a non-custodial FIDO wallet UX.
Even if `wallet.lappsnet.io` were down, the user can recover their key from backup.

# User registration and auth

To authenticate users with FIDO, the `wallet.lappsnet.io` server must store a minimal amount
of user information.

## Users DB

### Users table

The database schema is presented in pseudocode below. Given byte lengths are not optimized.

```
    User: {
      username: varchar(100) PRIMARY_KEY UNIQUE NOT NULL,
      credId: varchar(1000) UNIQUE NOT NULL,
      pubKeyBytes: varchar(256) NOT NULL,
      pubKeyPem: varchar(256) NOT NULL,
      counter: integer NOT NULL
    }
```

### Challenges table

FIDO challenges must expire, so each challenge issued expires after some time.

```
    Challenge: {
      challenge: varchar(100) PRIMARY_KEY NOT NULL,
      username: varchar(100) NOT NULL,
      expiration: varchar(30) NOT NULL
    }
```

### Serverside APIs

Registration flow:

- checkUsername
- registerUsername
- postAttestation

Auth flow (every time when signing):

- requestAuth
- postAssertion

Serverside code is in [routes/api.js](https://github.com/InternetMaximalism/Lappsnet-Wallet/blob/master/routes/api.js)

Clientside code that interacts with the API can be found in [public/js/refactor/wallet/](https://github.com/InternetMaximalism/Lappsnet-Wallet/tree/master/public/js/refactor/wallet),
specifically [utils/fido.js](https://github.com/InternetMaximalism/Lappsnet-Wallet/blob/master/public/js/refactor/wallet/utils/fido.js) and [components/newAccount.js](https://github.com/InternetMaximalism/Lappsnet-Wallet/blob/master/public/js/refactor/wallet/components/newAccount.js)

#### checkUsername API

Used to register a username for FIDO auth

`/api/checkUsername` with request body `{ username: "username_string" }`

return values:
`status 200, json { available: true }` if username is still available
`status 409, json { available: false }` if username is taken
`status 500` if other error

#### registerUsername API

Used to register a username for FIDO auth

`/api/registerUsername` with request body `{ username: "username_string" }`

Server generates attestationOptions for FIDO registration,
also stores the challenge in the DB.

return values:
`status 200, Object(registrationOptions)` where 
```
    registrationOptions = {
      user: {
        id: base64url(username)
        name: username,
        displayName: username
      },
      challenge: base64url(challenge),
      timeout: 300000,
      rpId: RPID,
      rpName: RPNAME,
      challengeSize: 64,
      cryptoParams: [-7, -257],
      authenticatorUserVerification: 'required'
    }
```

#### postAttestation API

Used to formally register the user using FIDO

`/api/postAttestation` with request body `{ attestation }`

Server verifies that the challenge has not expired,
deletes the challenge from DB,
validates the attestation contents,
and registers a user to DB.

return values:
`status 200, json { publicKey, username }` if successful
`status 500` if failure or other error

The client uses this pubkey to encrypt the privkey generated locally,
and store the encrypted key in localStorage.

#### requestAuth API

Used to request authentication data to sign

`/api/requestAuth` with request body `{ username }`

Server generates authnOptions,
generates and adds challenge to DB

return values:
`status 200, Object(assertionOptions)` if success
where
```
    assertionOptions = {
      allowCredentials: [{
        id: UserDB.credId,
        type: 'public-key',
        transports: ["usb", "nfc", "ble", "internal"]
      }],
      challenge: base64url(assertionOptions.challenge),
      timeout: 300000,
      rpId: RPID,
      rpName: RPNAME,
      challengeSize: 64,
      cryptoParams: [-7, -257],
      authenticatorUserVerification: 'required'
    }
```
`status 500` if error

#### postAssertion API

The client signs the assertionOptions and posts the result

`/api/postAssertion` with request body `{ assertion }`

Server checks DB for challenge,
then verifies assertion

return values:
`status 200, json { publicKey, username }` if successful
`status 500` if error

## Something missing?

If it is something easily addressible, please open an issue and I can probably make the fix relatively quickly. (e.g. adding callbacks for function calls, fixing discrepancies)