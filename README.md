# ⚾ Little League Batting Order Generator

[![Tests](https://github.com/ericlevicky/batting-order-generator/actions/workflows/test.yml/badge.svg)](https://github.com/ericlevicky/batting-order-generator/actions/workflows/test.yml)

A modern React web application for generating batting orders and field position rotations for little league baseball games. **Now available as a native iOS app!** 📱

## Platforms

- **Web App**: Use in any browser at your deployed URL
- **iOS App**: Deploy as a native iPhone/iPad app - see [iOS Deployment Guide](./IOS_DEPLOYMENT.md)

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
- Capacitor 7.4 (for iOS native app wrapper)

## Deployment

### Web Deployment (Netlify)

This project is configured to automatically deploy to Netlify when a pull request is merged to the `main` branch.

#### Setup Netlify Deployment

1. **Create a Netlify Account**: Sign up for a free account at [netlify.com](https://www.netlify.com/)

2. **Create a New Site**: In Netlify, create a new site (you can create it manually or link to your GitHub repository)

3. **Get Required Credentials**:
   - **NETLIFY_AUTH_TOKEN**: Go to User Settings → Applications → Personal Access Tokens → New access token
   - **NETLIFY_SITE_ID**: Found in Site Settings → General → Site information → API ID

4. **Configure GitHub Secrets**:
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add two repository secrets:
     - `NETLIFY_AUTH_TOKEN`: Your Netlify personal access token
     - `NETLIFY_SITE_ID`: Your Netlify site API ID

5. **Automatic Deployment**: Once configured, the site will automatically deploy when PRs are merged to `main`

#### Manual Deployment

You can also trigger a deployment manually:
- Go to Actions tab in GitHub
- Select "Deploy to Netlify" workflow
- Click "Run workflow"

### iOS App Deployment

This app can be deployed as a native iOS app to the Apple App Store! 

**📱 See the complete [iOS Deployment Guide](./IOS_DEPLOYMENT.md) for detailed instructions.**

Quick overview:
1. You'll need a Mac with Xcode installed
2. An Apple Developer Account ($99/year)
3. Run `npm run ios:open` to open the project in Xcode
4. Build and test on iOS Simulator or your iPhone
5. Archive and upload to App Store Connect

The iOS native project files are already set up in the `ios/` directory.


## License

Open source - feel free to use and modify for your team!