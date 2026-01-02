# Self-Hosted Runner Setup Guide

This guide explains how to set up a new laptop or computer as a self-hosted GitHub Actions runner for Bay State's distributed scraping system.

## Prerequisites

- **macOS, Windows, or Linux** computer
- **Docker Desktop** installed ([download](https://www.docker.com/products/docker-desktop/))
- **Admin access** to the BayStateApp GitHub repository

---

## Step 1: Generate Scraper Credentials

1. Login to the **BayStateApp Admin Panel**
2. Navigate to **Scraper Network** (or `/admin/scraper-network`)
3. Scroll to the **Runner Accounts** section
4. Click **"Create Account"** and enter a unique name for your computer
5. Copy the generated **Email** and **Password** (you will need these for Step 3)

---

## Step 2: Get Your GitHub Runner Token

1. Go to [GitHub → BayStateScraper → Settings → Actions → Runners](https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper/settings/actions/runners)
2. Click **"New self-hosted runner"**
3. Copy the **token** shown (it expires in 1 hour)

---

## Step 3: Run the Setup Script

Open Terminal and run:

```bash
# Clone the Scraper repository
git clone https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper.git
cd BayStateScraper

# Run the setup script
./setup_local_runner.sh
```

The script will:
1. Install Python dependencies
2. Install Playwright browsers
3. Create a `.env` file for you
4. Prompt you to enter the credentials from **Step 1**

---

## Step 4: Configure GitHub Runner

Follow the GitHub instructions from **Step 2** to configure the actions runner. When prompted for labels, ensure you include `docker`:

```bash
./config.sh --url https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper --token <YOUR_TOKEN> --labels self-hosted,docker
```

---

## Step 5: Verify Runner is Online

1. Go to [GitHub → BayStateScraper → Settings → Actions → Runners](https://github.com/Bay-State-Pet-and-Garden-Supply/BayStateScraper/settings/actions/runners)
2. Your runner should appear with a **green "Idle"** status
3. In the BayStateApp admin panel, the runner should now appear in the **Connected Runners** grid.

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

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Runner shows "Offline" | Check if `./run.sh` is running; restart it |
| Docker build fails | Ensure Docker Desktop is running |
| Token expired | Generate a new token from GitHub settings |
| Scrape job hangs | Check GitHub Actions logs for the run |

---

## Updating the Scraper

When scraper code changes, rebuild the Docker image on each runner:

```bash
cd /path/to/BayStateApp/scraper_backend
docker build -t baystate-scraper:latest .
```

Or run the update script:

```bash
./scripts/update-scraper.sh
```
