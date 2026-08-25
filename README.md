# try-dabble-apps

CSR/PWA apps on `*.try-dabble.com`. One isolated folder per app. Do not import across apps.

Homepage cards and guides live in [coreanq/try-dabble-main](https://github.com/coreanq/try-dabble-main).

## Layout

```
apps/<slug>/
  wrangler.jsonc
  package.json
  public/
```

## Deploy one app

Node 22+, wrangler 3+. From that folder only:

```
cd apps/<slug>
npx wrangler deploy
```

## Apps

- [cost-per-use](https://cost-per-use.try-dabble.com/)
- [gift-stash](https://gift-stash.try-dabble.com/)
- [place-inbox](https://place-inbox.try-dabble.com/)
- [photo-spec](https://photo-spec.try-dabble.com/)
- [later-inbox](https://later-inbox.try-dabble.com/)
- [omok](https://omok.try-dabble.com/) — Next static export; `next build` then wrangler from `out/`
- [jump-map](https://jump-map.try-dabble.com/) — Block Jumper CSR/PWA
