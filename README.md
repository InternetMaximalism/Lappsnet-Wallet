# Application structure for review

This repository contains an Express server (backend) and EJS + Javascript files (Frontend).

## Wallet page (Main UI)
In production, `views/wallet.ejs` view loads `lappsnet-wallet-2022-04-01.js` and `base64.min.js`.

For review, a new folder `public/js/refactor/wallet` contains a more organized collection of JS files.
In this branch, these are included in the page via many `<script src="/js/refactor/wallet/***.js">` instead of the production monofile.

EJS components are loaded from `views/wallet`, as well as `views/head.ejs` for common head element and `views/logo.ejs` for logo.

## Redeem page (ESAT->sats)
In production, `views/redeem.ejs` view loads `redeem-2022-04-04.js` and `base64.min.js`.

For review, a new folder `public/js/refactor/redeem` contains a more organized collection of JS files.
In this branch, these are included in the page via many `<script src="/js/refactor/redeem/***.js">` instead of the production monofile.

EJS is loaded from `views/head.ejs` for common head element and `views/logo.ejs` for logo.

## Other pages
`views/index.ejs` is the static top page for the domain, explaining what Lappsnet Wallet is.

`views/docs.ejs` is the static documentation page.

## Notes on EJS

The following JS is included at the bottom of `wallet.ejs` and `redeem.ejs` to prevent DOM flashing during load:

```
    <script>
      // Display page after all JS has loaded
      window.onload = function(e) {
        $('body').removeClass('hidden');
      }
    </script>
```