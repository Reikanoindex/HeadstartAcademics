# Headstart Academics

Bilingual school website and learning administration portal. English is the default language; Thai is available through EN / TH. This repository contains the current application source and built assets. It does not contain school account records, uploaded media, passwords, sessions, or service credentials.

## Install and run

Use Node.js 24 and pnpm 11. If pnpm is not installed, run `npm install --global pnpm@11.19.0`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://localhost:4173**. `pnpm dev` builds the application and starts a local server; stop it with Ctrl+C. Copy `.env.example` to `.env` only if you need to change the port or configure services. The example contains placeholders, not credentials. If port 4173 is occupied, set `PORT=4175` in `.env` and reopen the URL printed by the server.

To rebuild after edits, restart `pnpm dev`. To run an existing build, use `pnpm start`.

For a production build and checks:

```sh
pnpm build
pnpm test
```

`pnpm build` bundles the server into `dist/server/index.js`. The test suite checks authentication, session revocation, authorization, persistent-record operations, image controls, and demo isolation using in-memory fixtures. It does not send real email or change production records.

The local server keeps development records in ignored `.local-data/`. It does not download or connect to the live school's accounts, branding records, or uploaded images. It deliberately does not impersonate a verified owner: first-administrator setup and owner recovery require the production hosting identity service. Public pages and the isolated demo portals are available locally. This limitation is not a default password or an authentication bypass.

## Structure

- `dist/index.html`, CSS, and JavaScript: public website, bilingual UI, isolated demos, and administration interfaces.
- `worker/accounts.mjs`: password hashing, first-administrator setup, cookies, invitations, password recovery, and account permissions.
- `worker/school.mjs`: courses, access assignments, verified family relationships, assessments, learning records, events, and registrations.
- `worker/handler.mjs`: request authorization, editable public content, appearance, and media storage.
- `build.mjs`: Worker bundling and static asset packaging.
- `tests/`: isolated automated checks.
- `scripts/dev.mjs`: localhost-only Node development adapter with filesystem storage.
- `.env.example`: placeholder environment configuration.

## Hosting and storage

The current deployment uses Sites with a Cloudflare Workers-compatible server and an R2 binding named `BUCKET`. `.openai/hosting.json` identifies the existing Site; it is deployment metadata, not a credential. GitHub receives source only: pushing this repository does not deploy the website or migrate its stored records.

This is not a GitHub Pages-only application. Authentication and private data require the server. Do not expose a development server that accepts untrusted identity headers. Initial administrator setup and owner recovery rely on identity headers verified and supplied by the hosting platform.

Configure runtime values through the hosting provider's protected environment settings:

| Setting | Purpose |
| --- | --- |
| `FIRST_ADMIN_EMAIL` | Email authorized for first-administrator setup; must match the verified site-owner identity. |
| `RESEND_API_KEY` | Secret mail-provider key for invitations and email password resets. |
| `EMAIL_FROM` | Sender address on a domain verified with Resend. |

The earlier `ADMIN_EMAILS` / `TEACHER_ASSIGNMENTS` platform-account mode remains for compatibility when `FIRST_ADMIN_EMAIL` is absent. The current school account deployment uses `FIRST_ADMIN_EMAIL` and server-stored school roles.

Never commit environment secrets or real account data. `.env*`, dependencies, and local Sites runtime files are ignored.

## Manual upload to GitHub

Upload the **contents of this folder** to the repository root. Include `.gitignore`, `.env.example`, `.openai/hosting.json`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, the README, and every source/asset directory. Do not upload `node_modules`, `.env`, `.local-data`, or `.git`. File explorers may hide dotfiles, so enable hidden files when selecting the upload.

The `dist/` folder contains the application's original editable HTML/CSS/JavaScript and images as well as its generated server bundle; do not omit it as though it were entirely disposable build output. There are no separate framework component directories in this project.

The provided ZIP is a transport archive: extract it first, then upload the files and folders rather than uploading only the ZIP to the repository. GitHub Pages cannot run this site's authentication or private API. Production requires the Worker hosting and storage described below.

## Account activation

- Login: `/#login`
- First-administrator setup: `/#setup` (verified, configured site owner only; closes after the first administrator is created)
- Administrator dashboard: `/admin`
- Password recovery: `/#reset`

Users choose their own passwords. There is no default administrator password. Initial setup and verified-owner recovery do not require email delivery; invitations and emailed reset links require the mail configuration above. Public registration cannot assign administrator or teacher roles.

## Implemented and remaining configuration

The administrator interface operates on persistent records for users and roles, parent–student links, courses and lessons, course access dates, assessments, learning reports, events, registrations, bilingual public content, branding, and images. Administrator routes and API actions require server authorization. Demo records are separate and remain in browser memory.

Email delivery has not been configured or verified on the current Site. Course videos require school-approved hosting and actual video URLs; use access-controlled hosting for private videos. Some public school content remains explicitly marked as sample or awaiting school approval. The four demo portals are demonstrations, not a substitute for real authentication. No live classes, payments, or checkout are included.

The Site's hosting audience is independent of school roles and remains owner-private until explicitly changed. Do not infer live email delivery or an individual user's successful activation from passing local tests.
