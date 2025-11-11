# 📱 iOS Deployment Guide

This guide walks you through deploying the Batting Order Generator as a native iOS app to the Apple App Store.

## Prerequisites

### Required Hardware & Software
1. **Mac Computer** (MacBook, iMac, Mac Mini, or Mac Studio)
   - Required to run Xcode and build iOS apps
   - macOS 12.0 (Monterey) or later recommended

2. **Xcode 14.0 or later**
   - Free download from the Mac App Store
   - Includes iOS SDK and simulators
   - Size: ~10-15 GB

3. **Apple Developer Account**
   - Individual: $99/year
   - Organization: $99/year
   - Sign up at: https://developer.apple.com/programs/

4. **Node.js 18.0.0 or higher**
   - Already required for the web version
   - Download from: https://nodejs.org/

### What This Repository Now Includes

This repository has been configured with **Capacitor**, which wraps the React web app in a native iOS container. The iOS native project files are located in the `ios/` directory.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Web App

```bash
npm run build
```

This creates the production web bundle in the `dist/` directory.

### 3. Sync Web Assets to iOS

```bash
npm run ios:sync
```

This command:
- Rebuilds the web app
- Copies the web assets to the iOS project
- Updates iOS native dependencies

### 4. Open in Xcode

```bash
npm run ios:open
```

Or manually open:
```bash
open ios/App/App.xcworkspace
```

⚠️ **Important**: Always open the `.xcworkspace` file, NOT the `.xcodeproj` file!

## Testing on Simulator

1. Open the project in Xcode (using step 4 above)
2. Select a simulator from the device dropdown (e.g., "iPhone 15 Pro")
3. Click the Play button (▶️) or press `Cmd + R`
4. The app will build and launch in the iOS Simulator

## Testing on a Physical Device

### First Time Setup

1. **Connect your iPhone/iPad** to your Mac via USB cable
2. **Trust this computer** on your device when prompted
3. In Xcode, select your device from the device dropdown
4. Click the Play button (▶️) or press `Cmd + R`

### Code Signing (First Time)

The first time you build for a device, you'll need to configure code signing:

1. In Xcode, select the **App** target
2. Go to **Signing & Capabilities** tab
3. Select your **Team** (your Apple Developer account)
4. Xcode will automatically create a provisioning profile

If you see errors:
- Make sure you're logged into Xcode with your Apple ID (Xcode → Settings → Accounts)
- Change the **Bundle Identifier** to something unique (e.g., `com.yourname.battingorder`)

## Customizing Your App

### App Name

The app name "Batting Order Generator" can be changed:

1. Edit `capacitor.config.json`:
   ```json
   {
     "appName": "Your App Name"
   }
   ```

2. Or edit in Xcode:
   - Select the **App** target
   - Under **General** → **Display Name**

### Bundle Identifier

The bundle ID `com.battingorder.app` should be unique:

1. Edit `capacitor.config.json`:
   ```json
   {
     "appId": "com.yourcompany.yourapp"
   }
   ```

2. Then run:
   ```bash
   npm run ios:sync
   ```

### App Icon

1. Prepare your app icon (1024x1024 PNG)
2. In Xcode, open **App/Assets.xcassets**
3. Click on **AppIcon**
4. Drag your icon image to the appropriate slots
   - Or use a tool like https://appicon.co/ to generate all sizes

### Splash Screen

1. In Xcode, open **App/Base.lproj/LaunchScreen.storyboard**
2. Customize the splash screen design
3. Or replace **Splash.imageset** in Assets.xcassets

## Preparing for App Store Submission

### 1. Update Version and Build Number

In Xcode:
1. Select the **App** target
2. Under **General** tab:
   - **Version**: User-facing version (e.g., 1.0.0)
   - **Build**: Internal build number (e.g., 1)

### 2. Configure App Store Information

You'll need:
- **App Name** (30 characters max)
- **Subtitle** (30 characters max)
- **Description** (4000 characters max)
- **Keywords** (100 characters max)
- **Screenshots** (required for all supported device sizes)
- **App Icon** (1024x1024 px)
- **Privacy Policy URL** (required if app collects data)
- **Support URL**

### 3. Create App Store Connect Listing

1. Go to https://appstoreconnect.apple.com/
2. Click **My Apps** → **+** → **New App**
3. Fill in the required information:
   - Platform: iOS
   - Name: Batting Order Generator (or your custom name)
   - Primary Language: English
   - Bundle ID: Select your bundle ID
   - SKU: A unique identifier (e.g., batting-order-1)

### 4. Archive and Upload

1. In Xcode, select **Any iOS Device (arm64)** from the device dropdown
2. Go to **Product** → **Archive**
3. Wait for the archive to complete
4. Click **Distribute App**
5. Choose **App Store Connect**
6. Follow the wizard to upload your app

### 5. Submit for Review

1. In App Store Connect, go to your app
2. Add all required information:
   - Screenshots
   - Description
   - Keywords
   - Support URL
   - Privacy Policy URL (if applicable)
3. Click **Add for Review**
4. Select your uploaded build
5. Submit!

⏱️ Review typically takes 24-48 hours.

## Ongoing Maintenance

### Making Code Changes

When you update the web app:

```bash
# 1. Make your changes to React components
# 2. Test locally with web dev server
npm run dev

# 3. Build and sync to iOS
npm run ios:sync

# 4. Test in iOS simulator/device
npm run ios:open
```

### Releasing Updates

1. Update version number in Xcode
2. Build and archive (see step 4 above)
3. Upload to App Store Connect
4. Submit for review

## Troubleshooting

### "Module not found" errors in Xcode

Run:
```bash
npm run ios:sync
```

### CocoaPods errors

Install CocoaPods (if not already installed):
```bash
sudo gem install cocoapods
```

Then reinstall pods:
```bash
cd ios/App
pod install
```

### Web assets not updating

1. Clean the build:
   ```bash
   rm -rf dist ios/App/App/public
   npm run ios:sync
   ```

2. In Xcode: **Product** → **Clean Build Folder** (Shift + Cmd + K)

### Code signing issues

1. Go to Xcode → Settings → Accounts
2. Make sure you're signed in with your Apple ID
3. Click your account → **Download Manual Profiles**

## Resources

- **Capacitor Documentation**: https://capacitorjs.com/docs
- **iOS Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/ios
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **App Store Connect**: https://appstoreconnect.apple.com/

## Need Help?

Common issues:
- Make sure you're opening `.xcworkspace`, not `.xcodeproj`
- Always run `npm run ios:sync` after changing web code
- For code signing issues, try changing the bundle identifier
- For CocoaPods issues, try `pod install` in the `ios/App` directory

## What You Need to Provide

To complete the App Store submission, you'll need:

1. ✅ **Mac computer** with Xcode installed
2. ✅ **Apple Developer Account** ($99/year)
3. ✅ **App Icon** (1024x1024 px PNG)
4. ✅ **Screenshots** of the app running on various device sizes
5. ✅ **App Description** and metadata for App Store listing
6. ✅ **Privacy Policy** (if your app collects any user data)
7. ✅ **Support URL** (can be a GitHub repo or simple website)

The codebase is now ready - you just need the above items to publish!
