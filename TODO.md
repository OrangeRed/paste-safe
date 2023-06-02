# TODO

## Frontend

- [x] Create slug page with url to fetch snippet
  - [x] try to decrypt with no password, if not display password field
- [ ] Markdown Viewer ()
  - [ ] Add snippet preview using markdown codeblock
  - [ ] Add ability to save snippet as markdown
  - [ ] Add ability to preview markdown snippet
- [ ] Add Burn timer drop down
- [ ] Create 404 page
- [~] Styling

## Backend

- [x] Throw an error when looking past burn date
  - [x] Only get non burned dates on prefetch
- [ ] Occassionally remove burned snippets from db

## CI/CD

- [ ] Husky
  - [ ] Commitlint
  - [ ] eslint
  - [ ] prettier
  - [ ] lintstaged
- [ ] Github actions
  - [ ] eslint
  - [ ] prettier
  - [ ] deploy ? vercel

## Deployment

- [ ] Planetscale for db
  - [ ] update envs
- [ ] Vercel
  - [ ] update envs

## Misc

- [ ] Switch to sway https://github.com/joan31/dotfiles-sway
