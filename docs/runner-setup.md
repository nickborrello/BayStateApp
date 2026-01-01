# Self-Hosted Runner Setup Guide

This guide explains how to set up a new laptop or computer as a self-hosted GitHub Actions runner for Bay State's distributed scraping system.

## Prerequisites

- **macOS, Windows, or Linux** computer
- **Docker Desktop** installed ([download](https://www.docker.com/products/docker-desktop/))
- **Admin access** to the BayStateApp GitHub repository

---

## Step 1: Get Your Runner Token

1. Go to [GitHub → BayStateApp → Settings → Actions → Runners](https://github.com/nickborrello/BayStateApp/settings/actions/runners)
2. Click **"New self-hosted runner"**
3. Copy the **token** shown (it expires in 1 hour)

---

## Step 2: Run the Setup Script

Open Terminal and run:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/nickborrello/BayStateApp/main/scripts/setup-runner.sh | bash
```

Or manually:

```bash
# Clone the repo (if not already)
git clone https://github.com/nickborrello/BayStateApp.git
cd BayStateApp

# Run the setup script
chmod +x scripts/setup-runner.sh
./scripts/setup-runner.sh
```

The script will:
1. Build the Docker scraper image
2. Download the GitHub Actions runner
3. Prompt you for the token
4. Configure and start the runner

---

## Step 3: Verify Runner is Online

1. Go to [GitHub → BayStateApp → Settings → Actions → Runners](https://github.com/nickborrello/BayStateApp/settings/actions/runners)
2. Your runner should appear with a **green "Idle"** status
3. In the admin panel, go to `/admin/scraping` — the runner count should update

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
