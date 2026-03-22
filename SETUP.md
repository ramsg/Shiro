# Farm Dashboard Audio Integration - Setup Guide

## What's Implemented

### Backend (Netlify Functions)
- ✅ 5 serverless functions in `netlify/functions/`
- ✅ Azure Speech Services integration for Kannada audio generation
- ✅ Bunny CDN upload and retrieval
- ✅ Admin password authentication

### Frontend
- ✅ Admin login panel
- ✅ Audio Management tab for admin
- ✅ Task editing UI
- ✅ Farm worker auto-play (detects Kannada language)
- ✅ Hybrid autoplay with fallback button

## Setup Steps

### 1. Set Up Bunny CDN (Free Account)

1. Go to https://bunny.net and create free account
2. Create storage zone named "farmtasks"
3. Note the:
   - API Key (from account settings)
   - Storage Zone Hostname (e.g., farmtasks.storage.bunnycdn.com)

### 2. Verify Azure Setup

1. Check `.env` file has:
   - `AZURE_SPEECH_KEY` (your Azure Speech key)
   - `AZURE_REGION` (e.g., centralindia)

### 3. Deploy to Netlify

1. Commit changes: `git add . && git commit -m "Add audio integration with Netlify Functions"`
2. Push to GitHub: `git push origin main`
3. Netlify auto-deploys via webhook

### 4. Configure Netlify Environment Variables

In Netlify Dashboard → Site settings → Build & deploy → Environment:

```
AZURE_SPEECH_KEY = <from your .env>
AZURE_REGION = centralindia
BUNNY_CDN_API_KEY = <from bunny.net account>
BUNNY_STORAGE_ZONE = farmtasks
BUNNY_FTP_HOSTNAME = farmtasks.storage.bunnycdn.com
ADMIN_PASSWORD = <choose secure password>
```

### 5. Test Locally (Optional)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Test locally (requires .env with all variables)
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

## Admin Experience

1. Admin opens tizisit.com
2. Clicks "🎵 Audio Mgmt" tab
3. If not logged in: prompted for password
4. Enter password from ADMIN_PASSWORD
5. Can generate audio for each day
6. Status shows when audio was generated

## Audio Files

Generated files stored on Bunny CDN:
- Daily: `https://farmtasks.b-cdn.net/audio/daily/{day}.mp3`
- Weekly: `https://farmtasks.b-cdn.net/audio/weekly/sunday.mp3`
- Manifest: `https://farmtasks.b-cdn.net/manifest.json` (tracks all files)

## Troubleshooting

### "Unauthorized" error in admin login
- Check ADMIN_PASSWORD env var is set in Netlify Dashboard
- Make sure password matches what you configured

### Audio generation fails
- Verify AZURE_SPEECH_KEY and AZURE_REGION are correct
- Check Azure account has free tier available (5M chars/month)

### Autoplay not working on farm worker view
- Browser autoplay policy blocks audio without user gesture
- Fallback button ("▶️ Play Daily Briefing") should appear
- User needs to interact with page once to enable future autoplay

### Files not uploading to Bunny
- Verify BUNNY_CDN_API_KEY is correct
- Check BUNNY_FTP_HOSTNAME is correct format
- Ensure Bunny storage zone exists

## Next Steps

1. Set up Bunny CDN account
2. Configure Netlify environment variables
3. Push to GitHub to trigger deploy
4. Test admin login and audio generation
5. Monitor Azure Speech Services usage (free tier: 5M chars/month)

---

For questions or issues, check:
- Netlify Function logs: Netlify Dashboard → Functions
- Browser console: F12 Developer Tools → Console
- Network tab: Check API calls to `/.netlify/functions/`
