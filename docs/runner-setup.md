# Self-Hosted Runner Setup Guide

This guide explains how to set up a runner for Bay State's distributed scraping system.

## What is a Runner?

A **runner** is a computer that executes scraping jobs. When you click "Run Scrape" in the Admin Panel, a runner:
1. Receives the job
2. Opens a browser
3. Visits websites and extracts product data
4. Sends results back to BayStateApp

## Architecture Overview

```
┌─────────────────┐                         ┌─────────────────────┐
│   BayStateApp   │   "Run scrape job"      │   GitHub Actions    │
│   (Admin Panel) │ ──────────────────────▶ │                     │
└─────────────────┘                         └──────────┬──────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────────┐
                                            │   Your Server       │
                                            │   (Runner Agent)    │
                                            │                     │
                                            │   Runs Docker       │
                                            │   container with    │
                                            │   scraper code      │
                                            └──────────┬──────────┘
                                                       │
         Results sent back                             │
┌─────────────────┐                                    │
│   BayStateApp   │ ◀──────────────────────────────────┘
│   (Database)    │
└─────────────────┘
```

---

## Choose Your Setup Method

| Method | Best For | Difficulty |
|--------|----------|------------|
| **Desktop App** | Testing, debugging, manual scrapes | Easy |
| **GitHub Actions Runner** | Production, automated scrapes | Medium |

---

## Option A: Desktop App (Recommended for Testing)

### Step 1: Download

Go to [GitHub Releases](https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper/releases/latest) and download:
- **macOS**: `Bay.State.Scraper.dmg`
- **Windows**: `Bay.State.Scraper.msi`

### Step 2: Install

- **macOS**: Open `.dmg`, drag to Applications
- **Windows**: Run `.msi` installer

### Step 3: First Run

1. Open the app
2. **First Run (macOS only)**: Right-click → Open → Confirm (required until app is notarized)
3. Follow the **Setup Wizard**:
   - Enter a **Runner Name** (e.g., "Nick's MacBook")
   - Enter your **API Key** (get from Admin Panel → Scraper Network → Create Runner)
   - Install Chromium when prompted
4. Done! Your runner appears in the Admin Panel.

### Step 4: Verify

Check the **Scraper Network** page in Admin Panel. You should see your runner with a green "Ready" status.

---

## Option B: GitHub Actions Self-Hosted Runner (Production)

This sets up an always-on runner that processes jobs automatically.

### Prerequisites

- A server (Mac, Linux, or Windows) that stays on
- Docker installed
- Admin access to the GitHub repository

### Step 1: Generate an API Key

1. Login to **BayStateApp Admin Panel**
2. Navigate to **Scraper Network** → **Runner Accounts**
3. Click **"Create Runner"** and enter a unique name
4. **Copy the API key** (starts with `bsr_`) - only shown once!

### Step 2: Add GitHub Secrets

Go to: `https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper/settings/secrets/actions`

Add these **Repository Secrets**:

| Secret | Required | Where to Get |
|--------|----------|--------------|
| `SCRAPER_API_URL` | Yes | Your BayStateApp URL (e.g., `https://app.baystatepet.com`) |
| `SCRAPER_API_KEY` | Yes | Admin Panel → Scraper Network → Create Runner |
| `SCRAPER_WEBHOOK_SECRET` | Yes | Generate: `openssl rand -hex 32` |
| `SCRAPER_CALLBACK_URL` | Yes | `{SCRAPER_API_URL}/api/admin/scraping/callback` |
| `SUPABASE_URL` | Yes | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase Dashboard → Settings → API → service_role |
| `SETTINGS_ENCRYPTION_KEY` | Yes | Same key used when encrypting settings in your database |

### Step 3: Install Docker

**macOS:**
```bash
brew install --cask docker
# Or download Docker Desktop from https://docker.com
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

**Windows:**
Download Docker Desktop from https://docker.com

### Step 4: Install GitHub Actions Runner

1. Go to: `https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper/settings/actions/runners/new`

2. Select your OS and follow the instructions. Example for macOS:

```bash
# Create a folder
mkdir actions-runner && cd actions-runner

# Download the runner
curl -o actions-runner.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-arm64-2.311.0.tar.gz

# Extract
tar xzf actions-runner.tar.gz

# Configure (use the token from the GitHub page)
./config.sh --url https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper --token YOUR_TOKEN_HERE

# Add labels for the scraper workflow
# When prompted for labels, enter: self-hosted,docker
```

### Step 5: Start the Runner

**Run interactively (for testing):**
```bash
./run.sh
```

**Install as a service (for production):**
```bash
# macOS
./svc.sh install
./svc.sh start

# Linux
sudo ./svc.sh install
sudo ./svc.sh start
```

### Step 6: Verify

1. Go to: `https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper/settings/actions/runners`
2. Your runner should show as **Idle** (green dot)

---

## How Jobs Run (Production Flow)

1. You click **"Run Scrape"** in BayStateApp Admin Panel
2. BayStateApp triggers a GitHub Actions workflow
3. GitHub finds your self-hosted runner
4. Runner pulls the Docker image and starts a container
5. Container receives secrets via environment variables
6. Scraper runs, extracts data
7. Results are sent back to BayStateApp

**You don't need to do anything manually** - it's fully automated once set up.

---

## Credential Security (Vault Pattern)

Site passwords (Phillips, Orgill, etc.) are **never stored on the runner**. Instead:

1. GitHub Actions passes "vault keys" to the Docker container
2. Container connects to Supabase and downloads encrypted settings
3. Container decrypts settings using `SETTINGS_ENCRYPTION_KEY`
4. Credentials exist only in memory during execution
5. Container exits and credentials are gone

This ensures credentials never touch the filesystem.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Runner not appearing in GitHub | Check if `./run.sh` is running, verify labels include `self-hosted,docker` |
| Runner not appearing in Admin Panel | For Desktop App only - GitHub runners don't register there |
| "Invalid API key" | Verify the key in GitHub Secrets matches Admin Panel |
| Docker permission denied | Run `sudo usermod -aG docker $USER` and log out/in |
| "No matching manifest" on M1/M2 Mac | Wait for multi-platform build or use `--platform linux/amd64` |
| Jobs stuck in "queued" | Check runner is online and has correct labels |

---

## FAQ

**Q: Do I need both Desktop App and GitHub Runner?**
A: No. Choose one:
- Desktop App for testing/debugging
- GitHub Runner for production

**Q: Does the Desktop App need to stay open?**
A: Yes, for it to receive jobs. For always-on operation, use the GitHub Runner.

**Q: Where do site passwords come from?**
A: Encrypted in Supabase. The runner fetches and decrypts them at runtime.

**Q: Can I run multiple runners?**
A: Yes! Each needs a unique name and API key.
