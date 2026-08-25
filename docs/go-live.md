# Put MeConny on the internet

The hub is ready to host. Vercel is the host. You still have to click import once — this machine cannot log into your Vercel account.

Ignore the homepage that says **Agentic Infrastructure**. That is marketing. You only need **Add New → Project**.

## 1. Open the import page

Go to: [https://vercel.com/new](https://vercel.com/new)

If you are not signed in, choose **Continue with GitHub** and use `JunyiZhou-Conny`.

## 2. Import this repo

Under **Import Git Repository**, find **MeConny** and click **Import**.

If it is missing:

1. Click **Adjust GitHub App Permissions** (sometimes **Configure**).
2. Grant Vercel access to `JunyiZhou-Conny/MeConny` (or all repos).
3. Return to [vercel.com/new](https://vercel.com/new) and refresh.

## 3. Leave the defaults and deploy

Vercel should detect **Next.js**. Do not add a database, AI Gateway, or a template.

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `./` |
| Build Command | `next build` (default) |
| Install Command | `npm install` (default) |

Click **Deploy**. Wait until the build is green.

## 4. Open the live URL

Click the **Visit** link. You should get something like:

`https://meconny.vercel.app`

That page must show **Junyi (Conny) Zhou**, the cream-on-black Javis layout, and the three project cards. If you see a blank page or the old React shell, say so.

Send me that `*.vercel.app` URL when it is up so I can check it.

## 5. Optional: `connyzhou.com`

Do this only after the `*.vercel.app` URL looks right.

1. Buy **connyzhou.com** at [Cloudflare Registrar](https://dash.cloudflare.com/) or [Porkbun](https://porkbun.com). About **$10–15 / year**. Same price at renewal on Cloudflare (~$10.46).
2. In the Vercel project: **Settings → Domains → Add** `connyzhou.com` (and `www` if you want it).
3. Copy the DNS records Vercel shows into the registrar. Cloudflare often can do this automatically if the domain lives there.

Hosting stays **$0** on the Hobby plan. The domain is the only required payment.

## What you can skip

- Pro plan
- v0 / Composer / templates
- Environment variables
- Marketplace databases
- Anything labeled Fluid Compute, Sandbox, or AI Gateway
