# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/73742088-8eca-4dbf-8a93-04d90827cedb

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/73742088-8eca-4dbf-8a93-04d90827cedb) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/73742088-8eca-4dbf-8a93-04d90827cedb) and click on Share -> Publish.

## Mobile app (Android + iOS)

This repo is configured with Capacitor for native mobile builds.

See the full guide here:

- [MOBILE_APP_SETUP.md](./MOBILE_APP_SETUP.md)

## Ulta affiliate API setup

Keep the Ulta affiliate credentials server-side only. For Supabase edge functions, set:

```sh
supabase secrets set \
  ULTA_AFFILIATE_ACCOUNT_SID=your_account_sid \
  ULTA_AFFILIATE_AUTH_TOKEN=your_auth_token \
  ULTA_AFFILIATE_PROBE_SECRET=choose_a_long_random_probe_secret
```

Optional:

```sh
supabase secrets set \
  ULTA_AFFILIATE_API_BASE_URL=https://api.impact.com
```

This repo now includes an authenticated probe function at `supabase/functions/ulta-affiliate-probe` that validates the Impact credentials server-side. It tries these endpoints in order and returns the first successful response:

```txt
GET /Mediapartners/<AccountSID>/CompanyInformation
GET /Mediapartners/<AccountSID>/Campaigns
GET /Mediapartners/<AccountSID>
```

Use it first to validate the credentials from the backend before wiring product/catalog search endpoints.

Example test:

```sh
curl -s https://trbvlmzrnopvubizaacb.supabase.co/functions/v1/ulta-affiliate-probe \
  -H 'x-probe-secret: your_probe_secret'
```

The Ulta product search function at `supabase/functions/ulta-product-search` uses the same `ULTA_AFFILIATE_ACCOUNT_SID`, `ULTA_AFFILIATE_AUTH_TOKEN`, and optional `ULTA_AFFILIATE_API_BASE_URL` secrets to call Impact's catalog search endpoint server-side.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
