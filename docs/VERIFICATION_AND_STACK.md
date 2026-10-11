# How ScamShield checks a receiver, why users grant access, and the tech stack

## 1. How "is this receiver legit?" works

**In this prototype (10-day demo):** everything is simulated. `engine.js` holds a fake directory
(name match, profile age, reports) and scores pressure words in the message. Points, not rupees.

**In a real product, three layers, cheapest first:**

| Layer | What it checks | Who provides it |
| --- | --- | --- |
| 1. Message and context | Urgency, threats, secrecy, "guaranteed returns", OTP / remote-access requests | Our own rules (already built) |
| 2. Payee identity | Does the name registered with the receiver's bank match who the user thinks they are paying? | The payment network (UPI payee-name lookup via a bank/PSP) |
| 3. Reputation | Is the UPI ID / account / phone reported for fraud? | Public and partner data: cybercrime.gov.in complaints, bank fraud flags, user reports |

**Honest constraint:** NPCI, Visa and Mastercard do not hand data to a student project. Real access
means partnering with a licensed bank or UPI app (a TPAP/PSP through a sponsor bank), or pitching
NPCI/banks as a pilot. For the pitch, say: "Prototype uses simulated data; production plugs into a
partner bank's name-lookup and fraud-flag APIs." Confirm current NPCI and RBI rules before claiming specifics.

## 2. Why would a user give us access?

Design so the answer is "they don't have to":

- **v1 asks for nothing.** User types or pastes the receiver's UPI ID and the message they received. No bank login, no SMS, no contacts.
- **Value is immediate.** A warning appears *before* the pay button, at the moment of fear or rush.
- **Optional deeper access later,** only with explicit consent and a clear reason, for example India's Account Aggregator consent flow (user approves what data, for how long, and can revoke).
- **Never collect:** passwords, PINs, OTPs, card numbers. Say this on the first screen.
- **Trust signals:** works offline, no ads, data stays on device, one-tap delete.

## 3. Flowchart

See `docs/flowchart.svg` (editable Mermaid is in `docs/ARCHITECTURE.md`).

## 4. How to build it: tech stack

You do not need Next.js for an APK. Options, fastest first:

1. **What you have now (recommended for 10 days):** HTML + CSS + JavaScript UI inside a Java Android `WebView`. One UI codebase, works offline, easy to demo in a browser.
2. **Next.js / React as a PWA, wrapped with Capacitor:** nicer component structure and a path to a website; extra setup time.
3. **Flutter or React Native:** more native feel, but a rewrite.

| Part | Prototype | Production |
| --- | --- | --- |
| UI | HTML, CSS, JS (this repo) | React/Next.js or Flutter |
| Android shell | Java `MainActivity` | Kotlin |
| Risk logic | `engine.js` rules | Node.js or Java (Spring Boot) API plus ML model |
| Data | localStorage | PostgreSQL, Redis |
| Alerts | Sample list | RSS/news ingest, Firebase Cloud Messaging push |
