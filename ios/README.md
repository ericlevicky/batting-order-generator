# iOS Native Project

This directory contains the native iOS project for the Batting Order Generator app.

## ⚠️ Important

**Always open `App.xcworkspace`, NOT `App.xcodeproj`!**

The `.xcworkspace` file includes CocoaPods dependencies and is the correct way to open the project.

## Structure

- `App/` - Main iOS application
  - `App.xcodeproj/` - Xcode project file
  - `App.xcworkspace/` - Xcode workspace (open this!)
  - `App/` - Application source code and resources
    - `AppDelegate.swift` - App entry point
    - `Assets.xcassets/` - App icon and images
    - `Base.lproj/` - Storyboards (UI)
    - `Info.plist` - App configuration
    - `public/` - Web assets (auto-generated, don't edit!)
  - `Podfile` - CocoaPods dependencies
- `capacitor-cordova-ios-plugins/` - Capacitor plugin infrastructure

## Working with the iOS Project

### Opening in Xcode

From the project root:
```bash
npm run ios:open
```

Or manually:
```bash
open ios/App/App.xcworkspace
```

### Syncing Changes

After making changes to the web app (React components, CSS, etc.):

```bash
npm run ios:sync
```

This will:
1. Build the web app (`npm run build`)
2. Copy the web assets to `App/App/public/`
3. Update iOS native dependencies

### Building and Running

1. Open in Xcode (see above)
2. Select a simulator or connected device
3. Click the Play button (▶️) or press Cmd+R

### Troubleshooting

**Web changes not appearing?**
- Make sure to run `npm run ios:sync` after web changes
- Clean build in Xcode: Product → Clean Build Folder (Shift+Cmd+K)

**CocoaPods errors?**
```bash
cd ios/App
pod install
```

**Can't open in Xcode?**
- Make sure you're opening `.xcworkspace`, not `.xcodeproj`
- Make sure Xcode is installed from the Mac App Store

## Don't Edit These Files

- `App/App/public/*` - Auto-generated from web build
- `App/App/capacitor.config.json` - Auto-synced from root config

## For More Information

See the main [iOS Deployment Guide](../IOS_DEPLOYMENT.md) in the project root.
