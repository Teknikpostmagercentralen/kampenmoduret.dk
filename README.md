# How create an admin user

1. Create a user in auth
2. Put the user ID in /admins/
3. Congrats, you now have an admin suer


# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/main/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or control-game the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.


## 🚀 Deploying

This project uses **Cloudflare Pages** for deployment with the following setup:

- ✅ **Pushing to `main`** triggers a **preview deployment** (useful for testing).
- ✅ **Pushing to `production`** triggers a **production deployment**, updating the live site at [https://kampenmoduret.dk](https://kampenmoduret.dk).

### 🔧 Manual Preview Deployment

You can also deploy manually as a preview **without committing** using Wrangler:

```bash
wrangler pages deploy .svelte-kit/cloudflare --project-name=kampenmoduret-dk