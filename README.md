# Application structure for review

This repository contains an Express server (backend) and EJS + Javascript files (Frontend).

## Wallet page (Main UI)
In production, `views/wallet.ejs` view loads `lappsnet-wallet-2022-04-01.js` and `base64.min.js`.

For review, a new folder `public/js/refactor/wallet` contains a more organized collection of JS files.
In this branch, these are included in the page via `<script src="/js/refactor/wallet/***.js">` instead of the production monofile.

## Redeem page (ESAT->sats)
In production, `views/redeem.ejs` view loads `redeem-2022-04-04.js` and `base64.min.js`

## Other pages
`views/index.ejs` is the static top page for the domain, explaining what Lappsnet Wallet is.

`views/docs.ejs` is the static documentation page.

## Notes on EJS

The EJS files are mostly pure HTML except for the following includes:

`views/head.ejs` is the html head element shared in all views, `views/logo.ejs` is the logo shared in all views.

The following JS is included at the bottom of `wallet` and `redeem` to prevent DOM flashing during load:

```
    <script>
      // Display page after all JS has loaded
      window.onload = function(e) {
        $('body').removeClass('hidden');
      }
    </script>
```