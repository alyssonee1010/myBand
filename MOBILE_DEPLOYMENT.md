# Mobile Deployment

This project now uses Capacitor so the existing React app can ship to iPhone and Android while keeping the web build optional.

## Toolchain Note

- Capacitor 8 expects Node.js 22 or newer for official CLI support
- The current repo setup was created on Node 20 and works, but the build machine should be upgraded to Node 22 before store release work

## What Is Already Set Up

- Capacitor is installed in `apps/web`
- Native Android project exists in `apps/web/android`
- Native iOS project exists in `apps/web/ios`
- The app uses `HashRouter` on native platforms so in-app navigation works inside the WebView
- Auth tokens use Capacitor Preferences on native platforms instead of depending only on browser `localStorage`
- The API base URL is now environment-driven for production mobile builds
- API CORS supports Capacitor origins via `ALLOWED_ORIGINS`

## Important Placeholders To Change

- Capacitor app id is currently `com.myband.mobile`
- Before store submission, replace it with your real unique bundle id in `apps/web/capacitor.config.ts`
- iOS bundle id and Android application id must match your final signing setup

## Required Environment

### Frontend

Copy `apps/web/.env.example` and set:

```bash
VITE_API_BASE_URL=https://your-real-api-domain.com/api
```

Notes:

- For App Store and Play Store builds, this must be a real HTTPS backend
- `localhost` will not work for production mobile builds
- For simulator or device testing before production, you can also set `VITE_NATIVE_DEV_API_BASE_URL`

### API

Copy `apps/api/.env.example` and confirm:

```bash
ALLOWED_ORIGINS="http://localhost:3000,http://localhost,capacitor://localhost,ionic://localhost"
```

If you also host the web app separately, include its public origin too.

## iOS Machine Setup

The repo created the iOS project, but the final CocoaPods sync on this machine was blocked by local Xcode setup.

Run these on the Mac that will build the app:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```

Then resync the iOS project:

```bash
cd apps/web
npm run mobile:sync
```

## Open Native Projects

```bash
cd apps/web
npm run mobile:ios
npm run mobile:android
```

If you only want to resync without opening an IDE:

```bash
cd apps/web
npm run mobile:sync
```

## App Store Checklist

- Set a real bundle identifier
- Configure team signing in Xcode
- Add app icons and launch screens
- Add Privacy Policy URL and App Privacy answers in App Store Connect
- Test login, uploads, PDFs, and images on a real iPhone
- Archive in Xcode and upload to App Store Connect

## Play Store Checklist

- Set the Android application id/signing config
- Add adaptive icons and app metadata
- Test login, uploads, PDFs, and images on a real Android device
- Build an Android App Bundle from Android Studio
- Upload the `.aab` to Google Play Console

## Notes

- Web still works, but mobile is now the primary deployment path
- Store deployment still requires developer accounts, signing certificates, and a hosted production backend
- The codebase is now prepared for those steps, but the stores themselves cannot be completed from source code alone
