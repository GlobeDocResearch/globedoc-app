# GlobeDoc

GlobeDoc is a personal health passport developed by GlobeDoc Research Hub (non-profit, in formation). Patients co-own their health record, and healthcare professionals get access only with the patient's consent, through a time-limited pairing code.

This is a research prototype. It is not for clinical use or real patient data.

## Features

- Health Passport covering medical history, medications, allergies, vaccinations, heredity, and lifestyle
- Records with entries, locations, comments, and files
- Patient-controlled pairing codes with chosen validity and an optional reason for visit
- Professional workspace showing paired patients and their shared data
- Data export and full account deletion
- Interface in 26 languages, with patient data never sent to translation services
- Installable on phones and desktops as an app

## Tech stack

- TanStack Start (React 19) with Vite
- Tailwind CSS v4
- Supabase (Postgres with Row Level Security, Auth, and Storage)
- Cloudflare Workers runtime

## Running locally

Requirements: Node.js 20+ or Bun.

```sh
git clone <this-repository-url>
cd <repository-name>
cp .env.example .env   # then fill in your own Supabase project values
bun install            # or: npm install
bun run dev            # or: npm run dev
```

Optional server-side features need extra environment variables, such as `GOOGLE_TRANSLATE_API_KEY` for interface translation and `WHO_ICD_CLIENT_ID` / `WHO_ICD_CLIENT_SECRET` for ICD-11 lookup.

## Licence

Source code is licensed under the GNU Affero General Public License v3.0 (see [LICENSE](LICENSE)). Documentation is licensed under CC BY 4.0, except photographs and the GlobeDoc name and logo, which are not licensed for reuse. See [NOTICE](NOTICE).

## Reporting a security vulnerability

Please do not open a public issue. Follow the instructions at [https://globedoc.com/security](https://globedoc.com/security).

## More information

[https://globedoc.com](https://globedoc.com)
