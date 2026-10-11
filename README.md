# ScamShield — offline Android prototype

A working educational app for scam awareness and safer payment habits. It includes searchable learning guides, a three-question quiz, **clearly labeled sample** scam updates, a fictional recipient directory, a rules-based payment assessment, a 1,000-point practice wallet, local reports and persistent receipt history.

**All recipients, profile ages, identity signals, reports and points are simulated.** Nothing verifies a real person, sends money, contacts a recipient, reports to authorities or fetches live alerts. A lower-risk assessment is not a guarantee of safety.

## Try the working preview

Open `index.html` in a current desktop browser. It redirects to the bundled app. Everything is local, with no CDN, fonts, analytics or network calls. Local-file storage behavior varies by browser; for reliable persistence, serve the folder locally:

```sh
cd ScamShield
python3 -m http.server 8000
```

Open `http://localhost:8000`. Use browser device mode for a phone-size preview. The app adapts from a bottom navigation bar on phones to a side navigation panel on larger screens. Use one active tab for a demo; local storage is not a multi-client database.

## Build and run on Android

The repository is an Android Studio source project, **not a prebuilt APK**. The development environment that produced this project had Java but no Android SDK or Gradle, so Android compilation and device behavior have not been verified. A Gradle wrapper binary is not included.

Required build components:

- Android Studio with JDK 17.
- Android SDK Platform 35 and the Android build tools selected by the Android Gradle plugin.
- Gradle 8.9, matching the pinned Android Gradle Plugin 8.7.3.
- Android 8.0 / API 26 or later with a current Android System WebView for the demo device.
- Internet access on the build machine for the initial Android/Gradle downloads. The built app itself is offline.

1. Open the `ScamShield` directory in Android Studio as a project.
2. Install SDK Platform 35 in SDK Manager and choose JDK 17 as Gradle JDK.
3. Point Android Studio’s Gradle settings at a local Gradle 8.9 distribution. Alternatively, with Gradle 8.9 installed, run the following to generate the wrapper:

   ```sh
   gradle wrapper --gradle-version 8.9
   ```

4. Sync the project. Start an emulator or attach a development phone with USB debugging enabled, then click **Run**.
5. To produce a debug APK after generating the wrapper:

   ```sh
   # macOS / Linux
   ./gradlew assembleDebug
   # Windows PowerShell
   .\gradlew.bat assembleDebug
   ```

   The expected output is `app/build/outputs/apk/debug/app-debug.apk`.

For command-line builds, set `ANDROID_HOME` to your installed SDK or create a local (untracked) `local.properties` containing `sdk.dir=/absolute/path/to/your/android/sdk`. On Windows, Android Studio can generate `local.properties` with the correct escaping. Do not commit machine-specific SDK paths.

## Five-minute presentation walkthrough

1. **Overview (30 seconds):** Show the 1,000-point wallet, lesson progress, and visible demo label. Explain that no actual money or bank connection exists.
2. **Lower-risk practice (60 seconds):** Open Practice pay → Paying a friend back → Check the signals. Read the lower-risk caveat. Acknowledge the review and send 80 fictional points. Show the receipt and reduced balance.
3. **Medium-risk practice (60 seconds):** Practice again → The rushed seller. New profile, an unverified sample report and urgency combine into a medium result. Show both acknowledgment checkboxes. You may return to edit instead of sending.
4. **High-risk block (60 seconds):** Select the fake support scenario. Show the mismatch, reports, pressure, threat and secrecy signals. There is no override. Points remain unchanged. Add a fictional local report and explain that it is not submitted externally.
5. **Learning and transparency (60 seconds):** Search Learn for “password”, open a guide, mark it explored, and take the quick quiz. Open Scam updates and point out the invented-example label.
6. **Persistence and reset (30 seconds):** Open Wallet, refresh and show the saved receipt. Use Reset demo; demonstrate Cancel first, then confirm a fresh 1,000-point start.

The shareable flowchart is in `docs/flowchart.svg`. The editable Mermaid source and implementation map are in `docs/ARCHITECTURE.md`.

## Validation

No package installation is needed for the logic tests. Use Node.js 18 or later:

```sh
npm test
npm run check
```

The tests cover realistic risk scenarios, explicit/text clue deduplication, reports, invalid recipients and amounts, wallet conservation, insufficient balance, exact-balance payments, duplicate transaction prevention, review requirements, blocked high-risk payments, corrupted state and JSON persistence. These tests do not replace Android device or browser interaction testing.

## Small, focused edits with lighter models

The app is deliberately split into simple, readable modules:

| Edit | File | Suggested scope |
| --- | --- | --- |
| Colours, spacing and responsive layout | `app/src/main/assets/web/styles.css` | Visual-only changes; keep contrast and visible focus |
| Lesson copy, demo updates, UI and scenarios | `app/src/main/assets/web/app.js` | One feature or content group at a time |
| Risk rules, recipient fixtures, wallet validation | `app/src/main/assets/web/engine.js` | Update corresponding logic tests |
| Android lifecycle, asset loading and settings | `app/src/main/java/com/example/scamshield/MainActivity.java` | Preserve the local asset allowlist and permission boundary |
| Manifest and build settings | `app/src/main/AndroidManifest.xml`, `app/build.gradle` | Build/device verification required |

Example edit prompt: “Change only the guide card styling in styles.css to increase mobile spacing. Keep the risk engine and wallet behavior unchanged. Run npm run check and report changed files.”

For logic edits: “Add one fictional risk clue in engine.js, expose its checkbox in app.js, and add a meaningful behavior test. Preserve high-risk blocking, whole-number amounts, no overdraft, no duplicates and the lower-risk caveat.”

## Prototype boundaries

- Rules are illustrative keyword checks, not machine learning, fraud intelligence or verified identity checks. They can miss scams or flag innocent text.
- Local reports are unverified and affect only this simulation. Profile age and reports are never proof of wrongdoing.
- Payment drafts remain in memory. Wallet history, learning completion, quiz completion and fictional reports use local storage. They are not encrypted. Do not enter real personal information.
- Basic ledger validation detects malformed stored data; storage is not tamper-proof and this is not a real financial ledger. Multiple simultaneous browser tabs are not supported as concurrent payment clients.
- Progress persists when local storage is available. When storage is unavailable, the app explains that progress lasts only for the session. Corrupt saved data produces a visible fresh-session warning.
- No service worker is necessary: Android ships every asset locally. A served browser preview requires its local server for reloads.
- The Android app requests only the camera (for QR scanning, asked at first use, video only, our local origin only). It requests no internet, SMS, contacts, location or bank permissions, and exposes no JavaScript-to-native bridge. QR scanning uses the browser BarcodeDetector when the device WebView has it; for reliable scanning, save jsQR (jsqr.min.js) as `app/src/main/assets/web/jsqr.js`. Paste-a-link always works. Remote URLs and unrecognized assets are blocked.
- The current Android wrapper uses platform APIs only; it has no runtime Android library dependencies. Build tooling still downloads during setup.

## Manual release checklist

Before presenting on a phone, run the six-step walkthrough above on that device. Also check: 0/negative/fractional amounts, insufficient points, two quick taps on Send, no high-risk override, blocked external navigation, browser/Android Back with an open dialog, small-screen scrolling, keyboard visibility, text scaling, airplane-mode use, restart persistence, report text escaping and reset confirmation. Validate with TalkBack for screen reader behavior. A production security or payment app would require a substantially different architecture and review.

## Android setup references

- [Load local content in a WebView](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content): Android's guidance on local HTTPS origins and asset loading. This dependency-free prototype implements a strict asset interceptor rather than adding AndroidX WebViewAssetLoader.
- [Build your app from the command line](https://developer.android.com/build/building-cmdline): Android build and debug APK workflow.
- [Android Gradle Plugin 8.7 release notes](https://developer.android.com/build/releases/past-releases/agp-8-7-0-release-notes): compatibility details for the pinned build tooling.

## UPI Lab and the cloud APK build

- **UPI Lab (Check tab):** a simulation of the UPI path (app, payer PSP, NPCI switch, payee PSP, remitter and beneficiary banks) with an AI risk screen. The model is a small logistic regression from `tools/train_model.py`, trained on synthetic data; payee network signals are invented.
- **No Android SDK on the machine?** Push this folder to a GitHub repository, open Actions, run **Build APK**, then download `ScamShield-debug-apk`. This workflow has not been run yet.
