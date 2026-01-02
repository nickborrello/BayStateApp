# Self-Hosted Runner Setup Guide

This guide explains how to set up a new computer as a self-hosted GitHub Actions runner for Bay State's distributed scraping system.

## Prerequisites

- **macOS, Windows, or Linux** computer
- **Docker Desktop** installed ([download](https://www.docker.com/products/docker-desktop/))
- **Admin access** to the BayStateApp admin panel

---

## Step 1: Generate an API Key

1. Login to the **BayStateApp Admin Panel**
2. Navigate to **Scraper Network** → **Runner Accounts**
3. Click **"Create Runner"** and enter a unique name for this computer
4. **Copy the API key** (starts with `bsr_`) - this is only shown once!

> ⚠️ Save this key securely. If you lose it, you'll need to revoke and create a new one.

---

## Step 2: Run the Installer

### Option A: One-Line Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper/main/install.py | python3
```

When prompted, paste your API key from Step 1.

### Option B: Manual Install

```bash
git clone https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper.git
cd BayStateScraper
python install.py
```

---

## Step 3: Configure GitHub Actions Runner

1. Go to [GitHub → BayStateScraper → Settings → Actions → Runners](https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper/settings/actions/runners)
2. Click **"New self-hosted runner"**
3. Follow the instructions to download and configure the runner
4. When prompted for labels, include `docker`:

```bash
./config.sh --url https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper \
  --token <YOUR_TOKEN> \
  --labels self-hosted,docker
```

---

## Step 4: Set GitHub Secrets

Add these secrets to your self-hosted runner's environment or repository:

| Secret | Description | Example |
|--------|-------------|---------|
| `SCRAPER_API_URL` | BayStateApp base URL | `https://app.baystatepet.com` |
| `SCRAPER_API_KEY` | Your API key from Step 1 | `bsr_abc123...` |
| `SCRAPER_WEBHOOK_SECRET` | Shared secret for crash reports | (generate a random string) |

---

## Step 5: Verify Runner is Online

1. Check [GitHub → BayStateScraper → Settings → Actions → Runners](https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper/settings/actions/runners)
2. Your runner should show a **green "Idle"** status
3. In the BayStateApp admin panel → Scraper Network, the runner should appear

---

## Running as a Background Service

### macOS (launchd)

```bash
cd ~/actions-runner
./svc.sh install
./svc.sh start
```

### Linux (systemd)

```bash
cd ~/actions-runner
sudo ./svc.sh install
sudo ./svc.sh start
```

### Windows

```powershell
cd C:\actions-runner
.\config.cmd --runasservice
```

---

## Managing API Keys

### Rotate a Key

1. Go to Admin Panel → Scraper Network → Runner Accounts
2. Find your runner and click **"Revoke"** on the old key
3. Click **"Create Key"** to generate a new one
4. Update `SCRAPER_API_KEY` on your runner

### Check Key Status

Keys show:
- **Last used** - when the key was last used for authentication
- **Expires** - optional expiration date
- **Prefix** - first 12 characters for identification

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Runner shows "Offline" | Check if `./run.sh` is running; restart it |
| "Invalid API key" error | Verify key in GitHub Secrets matches admin panel |
| Docker build fails | Ensure Docker Desktop is running |
| Scrape job hangs | Check GitHub Actions logs for the run |

---

## Updating the Scraper

When scraper code changes, rebuild the Docker image on each runner:

```bash
cd /path/to/BayStateScraper/scraper_backend
docker build -t baystate-scraper:latest .
```
