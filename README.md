# ⚾ Little League Batting Order Generator

[![Tests](https://github.com/ericlevicky/batting-order-generator/actions/workflows/test.yml/badge.svg)](https://github.com/ericlevicky/batting-order-generator/actions/workflows/test.yml)

A modern React web application for generating batting orders and field position rotations for little league baseball games. **Installable as a Progressive Web App (PWA) on any device!** 📱

## 🎉 New: Install as an App!

You can now install this on your iPhone, Android, or computer - **completely FREE!**

- 📱 **Add to home screen** on iOS/Android
- 💻 **Install on desktop** - Chrome, Edge, Safari
- ⚡ **Works offline** after installation
- 🚫 **No App Store fees** - Deploy and share instantly!

**👉 See the [PWA Installation Guide](./PWA_GUIDE.md) for details**

## Platforms

- **Web App**: Use in any browser at your deployed URL
- **PWA**: Install on home screen (iPhone, Android, desktop) - FREE!

## Features

- **Smart Player Input**: Add players with individual name/number fields and Tab navigation
- **Baseball Field Visualization**: Interactive field diagram showing player positions (desktop view)
- **Position Rotation**: Automatic rotation ensuring fair playing time
- **Fair Playing Time**: Balances infield and outfield innings for each player
- **Configurable Settings**:
  - Number of innings (1-9)
  - Number of outfielders (2-4)
  - Optional catcher position
- **Responsive Design**: Field overlay on desktop, list view on mobile
- **Statistics Tracking**: View each player's infield, outfield, and bench time
- **Print Support**: Print-optimized layout for game day
- **Walk-Up Music**: Play walk-up songs for each batter via Spotify Connect

## Requirements

- **Node.js 18.0.0 or higher** (Node.js 20.4+ recommended)
- npm (comes with Node.js)

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser

3. **Build for Production**
   ```bash
   npm run build
   ```
   Built files will be in the `dist/` directory

4. **Run Tests**
   ```bash
   npm test
   ```
   Run tests in watch mode:
   ```bash
   npm run test:watch
   ```

## Usage

1. Click "Load Example Team" to populate with sample players, or add players manually
2. Enter player name → Tab → Enter number (optional) → Tab to add next player
3. Use up/down arrows to reorder players in batting order
4. Configure innings, outfielders, and catcher option
5. Click "Generate Lineup" to create the rotation
6. Print or save the lineup for game day

## Walk-Up Music (Spotify Connect)

Play custom walk-up songs for each batter during the game using your Spotify account. Music plays through Spotify Connect on any active device (phone, speaker, computer).

### Prerequisites

- A **Spotify Premium** account (required for playback control)
- An active Spotify playback device (open Spotify on your phone, speaker, or computer)

### Connecting Spotify

1. Click the **🎵 Walk-Up Music** button in the app
2. Click **Connect to Spotify** — you'll be redirected to Spotify to authorize the app
3. After approving, you'll be redirected back and connected

> **Note:** The app uses the secure PKCE authorization flow, so no backend or client secret is needed.

### Deploying with Spotify (for site owners)

To enable Spotify integration on your own deployment, you need a Spotify Developer App:

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Fill in a name (e.g. "Batting Order Music") and description
4. Set the **Redirect URI** to your app's URL (e.g. `https://your-site.vercel.app/` for production or `http://localhost:5173/` for local dev)
5. Check **Web API** under "Which API/SDKs are you planning to use?"
6. Save the app and copy your **Client ID**
7. Set the `VITE_SPOTIFY_CLIENT_ID` environment variable to your Client ID (in Vercel environment settings or a local `.env` file)

### Configuring Walk-Up Songs

1. Once connected, select a **playlist** from your Spotify library to use as your song source
2. For each player, click the edit button to assign a song from the playlist
3. Optionally set a **start time** and **end time** (e.g. `0:30` to `0:45`) to play just the best part of the song
4. Song assignments are saved locally and persist between sessions

### Game Day Playback

- **Config tab**: Assign and manage songs for each player
- **Play tab**: Tap a player's name to play their walk-up song; tap again to stop
- **Game Mode**: Select a saved game to follow the batting order — use the next/previous batter buttons to advance through the lineup and auto-play each batter's song
- Music plays on whichever device is currently active in Spotify (phone, Bluetooth speaker, etc.)
- If playback fails, make sure Spotify is open and playing on at least one device

## Troubleshooting

### Node.js Version Error

If you see an error like:
```
You are using Node.js X.X.X. Vite requires Node.js version 18.0.0+
```

**Solution**: Upgrade Node.js to version 18 or higher:
- Visit https://nodejs.org/ to download the latest LTS version
- Or use nvm: `nvm install 20` and `nvm use 20`

After upgrading, delete `node_modules` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## How It Works

### Batting Order
- Players are assigned a batting order based on the order they're entered
- This batting order remains consistent throughout all innings
- All players bat, including those on the bench

### Position Assignment
The algorithm ensures fair distribution of positions:
1. **Balancing**: Players with fewer active innings get priority for field positions
2. **Variety**: The system balances time between infield and outfield positions
3. **Rotation**: Positions rotate each inning using standard baseball numbering (1=P, 2=C, 3=1B, etc.)
4. **Bench**: Players not on the field sit on the bench but remain in the batting order

### Statistics
After generating a lineup, you can view:
- Each player's batting order position
- Number of innings in infield positions
- Number of innings in outfield positions
- Number of innings on the bench

## Technology Stack

- React 19.2
- Vite 5.4 (fast build tool)
- Vanilla CSS (no external styling dependencies)
- PWA (Progressive Web App) - installable on all devices

## Deployment

### Web Deployment (Vercel)

This project is configured to automatically deploy to Vercel when a pull request is merged to the `main` branch.

#### Setup Vercel Deployment

1. **Create a Vercel Account**: Sign up for a free account at [vercel.com](https://vercel.com/)

2. **Create a New Project**: In Vercel, import your GitHub repository

3. **Get Required Credentials**:
   - **VERCEL_TOKEN**: Go to Settings → Tokens → Create a new token
   - **VERCEL_ORG_ID**: Found in Settings → General → Your ID
   - **VERCEL_PROJECT_ID**: Found in Project Settings → General → Project ID

4. **Configure GitHub Secrets**:
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add three repository secrets:
     - `VERCEL_TOKEN`: Your Vercel access token
     - `VERCEL_ORG_ID`: Your Vercel org/user ID
     - `VERCEL_PROJECT_ID`: Your Vercel project ID

5. **Automatic Deployment**: Once configured, the site will automatically deploy when PRs are merged to `main`

#### Manual Deployment

You can also trigger a deployment manually:
- Go to Actions tab in GitHub
- Select "Deploy to Vercel" workflow
- Click "Run workflow"

### Progressive Web App (PWA)

This app is a PWA and can be installed on any device!

**📱 See the complete [PWA Guide](./PWA_GUIDE.md) for installation instructions.**

**Quick Install:**
- **iPhone/iPad**: Open in Safari → Share → Add to Home Screen
- **Android**: Open in Chrome → Tap "Install" prompt or Menu → Install app
- **Desktop**: Click install icon in browser address bar

**Benefits:**
- ✅ FREE - No app store fees
- ✅ Works offline after installation
- ✅ Looks like a native app
- ✅ Works on ALL devices (iOS, Android, desktop)
- ✅ Updates automatically when you deploy

Once deployed to Vercel, anyone can install your app on their device instantly!


## License

Open source - feel free to use and modify for your team!