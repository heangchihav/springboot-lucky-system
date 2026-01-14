# PWA Setup Guide

## Overview
Your Next.js application is now configured as a Progressive Web App (PWA) that can be installed on Android, iOS, and desktop devices.

## Features Implemented

### ✅ Core PWA Features
- **Installable**: Users can install the app on their devices
- **Offline Support**: Service worker caches assets for offline use
- **Native App Experience**: Runs in standalone mode without browser UI
- **Smart Install Prompt**: Shows install prompt only to users who haven't installed
- **Auto-Detection**: Hides install prompt if app is already installed

### ✅ Platform Support
- **Android**: Full PWA support with install prompt
- **iOS/iPhone**: Add to Home Screen support
- **Desktop**: Chrome, Edge, and other Chromium browsers
- **PC/Mac**: Install as desktop application

## Files Created

### Configuration Files
- `public/manifest.json` - PWA manifest with app metadata
- `public/sw.js` - Service worker for offline caching
- `next.config.ts` - Updated with PWA configuration

### Components
- `src/components/PWAInstallPrompt.tsx` - Smart install prompt component
- `src/components/ServiceWorkerRegistration.tsx` - Service worker registration
- `src/lib/pwa.ts` - PWA utility functions

### Layout Updates
- `src/app/layout.tsx` - Added PWA meta tags and components

## Icon Requirements

You need to create the following icon files in the `public/` directory:

### Required Icons
1. **icon-192.png** (192x192px) - For Android devices
2. **icon-512.png** (512x512px) - For Android and desktop
3. **screenshot-wide.png** (1280x720px) - Desktop app store listing
4. **screenshot-narrow.png** (750x1334px) - Mobile app store listing

### Generate Icons from Logo.png

You can use online tools or ImageMagick to generate icons:

```bash
# Using ImageMagick (if installed)
cd public/

# Generate 192x192 icon
convert Logo.png -resize 192x192 icon-192.png

# Generate 512x512 icon
convert Logo.png -resize 512x512 icon-512.png

# Take screenshots of your app for the store listings
# screenshot-wide.png: Desktop view (1280x720)
# screenshot-narrow.png: Mobile view (750x1334)
```

### Alternative: Online Tools
- [Favicon Generator](https://realfavicongenerator.net/)
- [PWA Asset Generator](https://www.pwabuilder.com/)
- [App Icon Generator](https://appicon.co/)

## How It Works

### Install Detection
The app automatically detects if it's already installed by checking:
1. Display mode (standalone)
2. iOS standalone mode
3. Android app referrer

### Install Prompt Behavior
- **First Visit**: Shows install prompt after `beforeinstallprompt` event
- **Dismissed**: Remembers dismissal in localStorage
- **Already Installed**: Automatically hidden
- **After Install**: Prompt disappears permanently

### User Actions
1. **Install Button**: Triggers native install dialog
2. **Not Now Button**: Dismisses prompt and saves preference
3. **Close (X) Button**: Same as "Not Now"

## Testing

### Test on Android
1. Open Chrome on Android
2. Visit your site
3. Install prompt should appear
4. Tap "Install" to add to home screen
5. App opens in standalone mode

### Test on iOS
1. Open Safari on iPhone/iPad
2. Visit your site
3. Tap Share button
4. Select "Add to Home Screen"
5. App opens without Safari UI

### Test on Desktop
1. Open Chrome/Edge on PC/Mac
2. Visit your site
3. Install prompt appears in browser
4. Click "Install" in prompt or address bar icon
5. App opens as desktop application

### Test Offline
1. Install the app
2. Open DevTools → Application → Service Workers
3. Check "Offline" mode
4. Refresh the app
5. App should still load cached content

## Customization

### Update App Name
Edit `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "App"
}
```

### Update Theme Color
Edit `public/manifest.json` and `src/app/layout.tsx`:
```json
{
  "theme_color": "#your-color",
  "background_color": "#your-color"
}
```

### Update Install Prompt Text
Edit `src/components/PWAInstallPrompt.tsx`:
```tsx
<h3>Your Custom Title</h3>
<p>Your custom description</p>
```

### Cache Strategy
Edit `public/sw.js` to customize caching:
- Add more URLs to `urlsToCache`
- Modify cache strategy (cache-first, network-first, etc.)
- Update cache version to force refresh

## Deployment

### Production Checklist
- [ ] Generate all required icon sizes
- [ ] Take app screenshots
- [ ] Update manifest.json with production URL
- [ ] Test on real devices (Android, iOS, Desktop)
- [ ] Verify HTTPS is enabled (required for PWA)
- [ ] Test offline functionality
- [ ] Check service worker registration

### HTTPS Requirement
PWAs require HTTPS in production. Localhost works for development.

## Troubleshooting

### Install Prompt Not Showing
- Check browser console for errors
- Verify manifest.json is accessible
- Ensure HTTPS is enabled (production)
- Check if app is already installed
- Clear browser cache and localStorage

### Service Worker Not Registering
- Check browser console for errors
- Verify sw.js is in public/ directory
- Check service worker scope
- Clear browser cache

### Icons Not Displaying
- Verify icon files exist in public/
- Check file paths in manifest.json
- Clear browser cache
- Regenerate icons with correct sizes

### iOS Issues
- Ensure apple-touch-icon is set
- Check meta tags for iOS
- Test in Safari (not Chrome on iOS)
- iOS has limited PWA support

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox (Advanced Service Workers)](https://developers.google.com/web/tools/workbox)

## Next Steps

1. **Generate Icons**: Create all required icon sizes
2. **Test Installation**: Test on multiple devices and browsers
3. **Take Screenshots**: Capture app screenshots for manifest
4. **Deploy**: Deploy to production with HTTPS
5. **Monitor**: Check service worker and install analytics
