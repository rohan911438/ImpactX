# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c7813489-be1c-4ea5-9662-7c958ca0f1cb

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c7813489-be1c-4ea5-9662-7c958ca0f1cb) and start prompting.

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

## Backend API (local dev)

This repo now includes a lightweight backend for demoing submissions and AI verification.

- Server: Express + lowdb (JSON) persistence
- Uploads: Stored locally in `uploads/` and served from `/uploads`
- Port: 8787

Key endpoints:

- GET `/api/health` – health check
- GET `/api/impacts?walletAddress=0x...` – list impacts for a wallet
- POST `/api/impacts` – submit an impact (multipart)
	- fields: `walletAddress`, `actionType`, `description`
	- file: `photo`
	- simulates AI verification and updates the record after ~2s
- GET `/api/verifications` – recent verification requests
- GET `/api/leaderboard` – aggregate leaderboard

## Local development workflow

Frontend runs on Vite (port 8080). API runs on 8787. A dev proxy is configured so the frontend can call `/api/*` directly.

Run servers:

```cmd
npm run dev:server   # start API at http://localhost:8787
npm run dev          # start Vite at http://localhost:8080
# or run both in one terminal
npm run dev:all
```

Wallet integration:

- MetaMask connect via `wagmi` (Celo Mainnet/Alfajores)
- Optional WalletConnect for mobile (Valora): set `VITE_WALLETCONNECT_PROJECT_ID` in `.env`

```cmd
echo VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here> .env
```

Then restart `npm run dev`. The WalletConnect button appears in the top-right.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c7813489-be1c-4ea5-9662-7c958ca0f1cb) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
