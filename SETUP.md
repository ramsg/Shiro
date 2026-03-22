# Farm Dashboard Audio Integration - Setup Guide

## What's Implemented

### Backend (Netlify Functions)
- ✅ 5 serverless functions in `netlify/functions/`
- ✅ Azure Speech Services integration for Kannada audio generation
- ✅ GitHub API integration for file storage (private repo)
- ✅ Admin password authentication

### Frontend
- ✅ Admin login panel
- ✅ Audio Management tab for admin
- ✅ Task editing UI
- ✅ Farm worker auto-play (detects Kannada language)
- ✅ Hybrid autoplay with fallback button

### Storage Architecture
- **Audio files** → Stored in private GitHub repo (`/audio/` folder)
- **Manifest** → `audio/manifest.json` (tracks all generated files)
- **Tasks** → `audio/tasks.json` (editable task content)
- **Served via** → Netlify static assets (free, unlimited bandwidth)

## Setup Steps

### 1. Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token"
3. Select scope: `repo` (full control of private repositories)
4. Copy the token (you'll need this in step 3)

### 2. Verify Azure Setup

1. Check `.env` file has:
   - `AZURE_SPEECH_KEY` (your Azure Speech key)
   - `AZURE_REGION` (e.g., centralindia)

### 3. Deploy to Netlify

1. Commit changes: `git add . && git commit -m "Implement GitHub API audio storage"`
2. Push to GitHub: `git push origin main`
3. Netlify auto-deploys via webhook

### 4. Configure Netlify Environment Variables

In Netlify Dashboard → Site settings → Build & deploy → Environment:

```
AZURE_SPEECH_KEY = <from your .env>
AZURE_REGION = centralindia
ADMIN_PASSWORD = <choose secure password>
GITHUB_TOKEN = <personal access token from step 1>
GITHUB_REPO = <your-username>/<repo-name>
```

Example: `GITHUB_REPO = ramesh-gopalakrishna/farm-dashboard`

### 5. Create `/audio` Directory in Your Repo

```bash
# Create the directory structure (if not exists)
mkdir -p audio

# Create empty manifest.json
echo '{"daily":{},"weekly":{}}' > audio/manifest.json

# Commit and push
git add audio/
git commit -m "Create audio directory"
git push origin main
```

### 6. Test Locally (Optional)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Create .env with all variables
cat > .env << EOF
AZURE_SPEECH_KEY=<your-key>
AZURE_REGION=centralindia
ADMIN_PASSWORD=<your-password>
GITHUB_TOKEN=<your-token>
GITHUB_REPO=<your-repo>
EOF

# Test locally
netlify dev

# Opens http://localhost:8888
# Admin login with password from ADMIN_PASSWORD env var
```

## Farm Worker Experience

1. Farm worker opens tizisit.com
2. Page detects language (Kannada) + day of week
3. Monday-Saturday: Auto-plays daily tasks audio
4. Sunday: Auto-plays weekly tasks audio
5. If autoplay blocked by browser: "▶️ Play Daily Briefing" button appears
6. Audio is served from your private GitHub repo via Netlify CDN

## Admin Experience

1. Admin opens tizisit.com
2. Clicks "🎵 Audio Mgmt" tab
3. Prompted for password
4. Enter password from `ADMIN_PASSWORD`
5. Click "Generate" for any day
6. Netlify Function:
   - Generates audio via Azure Speech Services
   - Commits MP3 file to private GitHub repo
   - Updates `audio/manifest.json`
   - Netlify redeploys automatically
7. Audio immediately available to farm workers

## How It Works

**When Admin Generates Audio:**
```
1. Admin clicks "Generate" for Monday
   ↓
2. Netlify Function calls Azure Speech Services
   ↓
3. Azure generates Kannada audio (MP3)
   ↓
4. Function uses GitHub API to commit audio/daily/monday.mp3 to repo
   ↓
5. Function updates audio/manifest.json
   ↓
6. Netlify auto-redeploys with new audio file
   ↓
7. Farm worker refreshes → sees new audio available
```

**When Farm Worker Accesses Audio:**
```
1. Worker views dashboard in Kannada on Monday
   ↓
2. Browser fetches /audio/manifest.json
   ↓
3. Finds /audio/daily/monday.mp3 URL
   ↓
4. Auto-plays from Netlify CDN (fast, free, unlimited bandwidth)
```

## Audio File Structure

```
your-repo/
└── audio/
    ├── manifest.json      (tracks all audio files)
    ├── tasks.json         (editable task definitions)
    ├── daily/
    │   ├── monday.mp3
    │   ├── tuesday.mp3
    │   └── ...
    └── weekly/
        └── sunday.mp3
```

## Cost Breakdown

| Component | Cost | Notes |
|-----------|------|-------|
| GitHub Private Repo | **$0** | Included with GitHub Free |
| Netlify Functions | **$0** | Free tier (125k invokes/mo) |
| Netlify Hosting | **$0** | Free tier (unlimited bandwidth) |
| Azure Speech Services | **$0** | Free tier (5M chars/month) |
| **Total Monthly** | **$0** | ✅ Completely Free |

## Troubleshooting

### "Unauthorized" error when generating audio
- Check `GITHUB_TOKEN` is valid and not expired
- Verify token has `repo` scope
- Check `GITHUB_REPO` format: `username/repo-name`

### Audio generation fails
- Verify `AZURE_SPEECH_KEY` and `AZURE_REGION` are correct
- Check Azure account has free tier available (5M chars/month)
- Check Netlify Function logs for GitHub API errors

### Audio not appearing for farm worker
- Check that commit succeeded (check your repo's `/audio/` folder)
- Verify `audio/manifest.json` was updated
- Check browser console for fetch errors
- Refresh page to clear cache

### Autoplay not working on farm worker view
- Browser autoplay policy blocks audio without user gesture
- Fallback button ("▶️ Play Daily Briefing") should appear
- User needs to interact with page once to enable future autoplay

## Next Steps

1. Generate GitHub Personal Access Token
2. Commit empty `/audio/` directory
3. Configure Netlify environment variables
4. Test admin login and audio generation
5. Monitor Azure Speech Services (5M chars/month free)

---

For questions or issues, check:
- Netlify Function logs: Netlify Dashboard → Functions
- GitHub repo `/audio/` folder for generated files
- Browser console: F12 Developer Tools → Console
- Network tab: Check API calls to `/.netlify/functions/`
- GitHub personal access token: Still valid and has `repo` scope
