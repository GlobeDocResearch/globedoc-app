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

## Supabase setup

### 1. Create a project

Create a new project at [supabase.com](https://supabase.com) (or use a self-hosted instance, see below). From the project's API settings, note the project URL, the project reference ID, the publishable (anon) key and the service-role key.

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your own values. Never commit `.env`.

| Variable | Required | Used by | Description |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Required | Browser | Project URL, e.g. `https://your-project-ref.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Required | Browser | Publishable (anon) key |
| `VITE_SUPABASE_PROJECT_ID` | Required | Browser | Project reference ID, e.g. `your-project-ref` |
| `SUPABASE_URL` | Required | Server | Same project URL as above |
| `SUPABASE_PUBLISHABLE_KEY` | Required | Server | Same publishable key as above |
| `SUPABASE_PROJECT_ID` | Required | Server | Same project reference ID as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Required | Server only | Service-role key for privileged server tasks (pairing, account deletion). Keep it secret and never expose it to the browser |
| `GOOGLE_TRANSLATE_API_KEY` | Optional | Server | Machine translation of fixed interface labels |
| `WHO_ICD_CLIENT_ID` | Optional | Server | WHO ICD-11 / ICHI terminology lookup |
| `WHO_ICD_CLIENT_SECRET` | Optional | Server | WHO ICD-11 / ICHI terminology lookup |
| `LOVABLE_API_KEY` | Optional | Server | Transactional email sending on the hosted version |
| `LOVABLE_SEND_URL` | Optional | Server | Transactional email endpoint on the hosted version |

Example (placeholders only):

```sh
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
VITE_SUPABASE_PROJECT_ID="your-project-ref"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
SUPABASE_PROJECT_ID="your-project-ref"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 3. Apply the schema and migrations

The full database schema, Row Level Security policies, functions, triggers and storage buckets are defined as SQL migrations in `supabase/migrations/`, applied in filename (timestamp) order. Two later migrations live in `drizzle/migrations/` and must be applied after them, in order (`0000_…`, then `0001_…`).

Using the [Supabase CLI](https://supabase.com/docs/guides/cli):

```sh
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

Then run the files in `drizzle/migrations/` in order, for example with `psql "postgresql://postgres:your-db-password@your-db-host:5432/postgres" -f drizzle/migrations/0000_add_optional_profile_identity.sql` (and likewise for `0001_…`), or paste them into the SQL editor.

### 4. Row Level Security

The migrations enable Row Level Security on every application table and create policies that restrict health data to its owner (`auth.uid()`), with service-role-only tables scoped to `service_role`. After applying them, confirm in the dashboard (Database → Tables) that RLS is shown as enabled on every table in the `public` schema. Do not disable RLS or add broad policies; the app relies on it to keep patient data private. The `avatars` and `records` storage buckets must remain private.

### 5. Auth

In Authentication settings:

- Enable the **Email** provider and keep email confirmation turned on.
- Set the **Site URL** to your app's address (e.g. `https://app.example.org`) and add it, plus `http://localhost:8080` for local development, to the allowed redirect URLs.
- Optionally enable Google sign-in and configure custom SMTP for reliable email delivery.
- Keep anonymous sign-ins disabled.

## Self-hosting and deployment

### Cloudflare Workers (wrangler)

The app is built for the Cloudflare Workers runtime; `wrangler.jsonc` points at `src/server.ts` and enables `nodejs_compat`.

1. Install dependencies and log in: `bun install`, then `bunx wrangler login`.
2. Optionally change `name` in `wrangler.jsonc` to your own Worker name.
3. Build the app: `bun run build`. The `VITE_*` variables are embedded at build time, so they must be set in `.env` or the shell before building.
4. Add the server-side variables as Worker secrets, one at a time, for example:

   ```sh
   bunx wrangler secret put SUPABASE_URL
   bunx wrangler secret put SUPABASE_PUBLISHABLE_KEY
   bunx wrangler secret put SUPABASE_PROJECT_ID
   bunx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   ```

   Add any optional variables (translation, WHO ICD) the same way.
5. Deploy: `bunx wrangler deploy`.
6. Optionally attach a custom domain to the Worker, then add that domain to the Auth Site URL and redirect URLs.

### Using a self-hosted Supabase

GlobeDoc works with a [self-hosted Supabase](https://supabase.com/docs/guides/self-hosting) instance (for example the official Docker setup), which lets you choose where data is stored.

1. Deploy Supabase on your own infrastructure and serve its API over HTTPS, e.g. `https://supabase.example.org`.
2. Generate your own JWT secret, publishable (anon) key and service-role key as described in the self-hosting guide.
3. Set `VITE_SUPABASE_URL` and `SUPABASE_URL` to your instance's API URL, the key variables to your generated keys, and the project ID variables to any identifier for your instance (e.g. `your-instance-id`).
4. Apply the migrations from `supabase/migrations/` and then `drizzle/migrations/` with `psql` against your instance's database, in order.
5. Configure Auth (Site URL, redirect URLs, SMTP) through the instance's environment configuration, and confirm RLS is enabled on every table.
6. Set up regular backups of both the database and file storage, as self-hosted instances have none by default.

## Licence

Source code is licensed under the GNU Affero General Public License v3.0 (see [LICENSE](LICENSE)). Documentation is licensed under CC BY 4.0, except photographs and the GlobeDoc name and logo, which are not licensed for reuse. See [NOTICE](NOTICE).

## Reporting a security vulnerability

Please do not open a public issue. Follow the instructions at [https://globedoc.com/security](https://globedoc.com/security).

## More information

[https://globedoc.com](https://globedoc.com)
