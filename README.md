# Klotho Connect

A volunteer platform for the Klotho Foundation: chapter leads post visits and
events, volunteers browse by state and chapter and sign up. Built with Vite +
React + Firebase (Auth + Firestore + Cloud Functions).

## Setup

You'll do a handful of things: create a Firebase project, turn on Auth +
Firestore, drop your web app's keys into `.env`, set your own chapter-lead
signup code, deploy the security rules, and (optionally) wire up the
reminder emails. Nothing else in the code needs to change.

### 1. Create a Firebase project

Go to the [Firebase console](https://console.firebase.google.com), create a
project, then inside it click **Build > Authentication > Get started** and
enable the **Email/Password** sign-in provider. Then click **Build >
Firestore Database > Create database** and start it in **production mode**,
any region.

### 2. Add a web app and get your config

Still in Project settings (gear icon, top left) > **General** tab, scroll to
"Your apps," click the web icon (`</>`), give it any nickname, and Firebase
will show you a config object with your keys.

Copy `.env.example` to `.env` and fill in those values:

```bash
cp .env.example .env
```

### 3. Install dependencies and run it

```bash
npm install
npm run dev
```

The app will run, but nobody can sign up as a chapter lead yet — that
needs step 4.

### 4. Set your chapter-lead signup code

Open `firestore.rules` and find this line near the top:

```
request.resource.data.code == "klotho-lead-2026";
```

Change `"klotho-lead-2026"` to whatever code you want to hand out to real
chapter leads, then keep reading — **the code only takes effect once you
deploy the rules file**, which is step 5.

**How this code actually works, so you know what you're relying on:** the
code lives only in this rules file — it's never sent to the browser, so it
can't be found by looking at your site's source. Firestore itself checks it
server-side when someone tries to register a chapter. It's not tied to a
single use — anyone with the current code can register a new chapter, or
add themselves as a second/successor lead on an existing one. If the code
ever leaks, change the line above and redeploy; it takes effect immediately
for new signups.

### 5. Deploy the security rules

```bash
npm install -g firebase-tools   # if you don't already have it
firebase login
firebase use --add                # pick your project, give it any alias
firebase deploy --only firestore:rules,firestore:indexes
```

Volunteer sign-up and browsing works fully at this point. Chapter-lead
sign-up works too, using the code from step 4.

### 6. (Optional) Turn on the day-before reminder emails

This emails every admin of a chapter with the headcount and details for
anything happening in the next ~48 hours, once a day. It's optional — skip
it and everything else still works — but it does need a bit more setup
because sending email from a server always does:

**a. Upgrade to the Blaze plan.** Firebase console > click the plan name,
bottom left > Blaze. This is required by Google for any Cloud Function
that calls an outside service, which sending email is. At this scale (one
run a day, a handful of emails) you'll stay inside the free tier
allowances and this should cost **$0/month** — Blaze is pay-as-you-go, not
a flat fee.

**b. Create a free [Resend](https://resend.com) account** and grab an API
key from the dashboard (no credit card needed for their free tier — 3,000
emails/month). Set it as a Firebase secret:

```bash
firebase functions:secrets:set RESEND_API_KEY
```

(pastes the key in at the prompt — it isn't echoed or stored in your code)

**c. Update the sender address.** Open `functions/index.js` and find:

```js
const FROM_ADDRESS = 'Klotho Connect <onboarding@resend.dev>';
```

Resend's shared address only delivers to the email you signed up to Resend
with — fine for testing solo, but it'll silently fail to reach any *other*
chapter lead until you [verify a sending domain](https://resend.com/domains)
in Resend and change this line to use it, e.g.
`'Klotho Connect <events@yourdomain.org>'`.

**d. Deploy the function:**

```bash
firebase deploy --only functions
```

That's it — it runs automatically every day at 9am US Eastern. To change
the time or timezone, edit `schedule` / `timeZone` near the top of
`functions/index.js` and redeploy. To watch it work: `firebase
functions:log`.

### 7. (Optional) Deploy the site itself

```bash
npm run build
firebase deploy --only hosting
```

## How accounts work

- **Volunteers** sign up with just a name/email/password and immediately
  land on the state → chapter → event browser.
- **Chapter leads** additionally enter the signup code from step 4, pick a
  state, and either create a brand-new chapter or join an existing one as
  a second/successor lead. They land on a dashboard scoped to that one
  chapter, where they create events and see who's signed up.
- Each event has a **volunteers-needed number that's a goal, not a cap** —
  people can keep signing up past it; the UI just shows progress toward it.

## Data model (Firestore)

```
users/{uid}                 name, email, role ('volunteer' | 'admin'), chapterId (admins only)
chapters/{id}                name, state, adminIds[], createdBy
events/{id}                  chapterId, title, description, location, dateTime,
                              volunteersNeeded, reminderSent, createdBy
events/{id}/signups/{uid}    uid, name, email, eventId, chapterId, signedUpAt
adminVerifications/{uid}     short-lived proof of a correct signup code (see firestore.rules)
```

## Project structure

```
src/
  firebase.js                Firebase init — reads .env, nothing else touches keys
  contexts/AuthContext.jsx   current user + Firestore profile
  lib/auth.js                 sign up / log in / log out
  lib/firestore.js            chapters, events, signups
  components/                  Navbar, EventCard, ProtectedRoute, etc.
  pages/
    volunteer/                 state → chapter → events → sign up, "My events"
    admin/                      dashboard, create/edit event, roster
firestore.rules              all access control — see inline comments
firestore.indexes.json       the two indexes the app's queries need
functions/index.js           the scheduled reminder email (optional)
```

## Known limitations, worth knowing about

- **The signup code is a deterrent, not encryption.** It stops casual
  impersonation but isn't rate-limited — someone scripting repeated
  guesses isn't blocked by anything here. Fine for handing out to real
  chapter leads; if you ever need stronger guarantees, that's a case for
  moving signup into a Cloud Function you control instead of a client-side
  Firestore write.
- **One admin account = one chapter.** Someone leading two chapters needs
  two accounts (two emails). Multiple admins *per* chapter is supported.
- **Reminder emails require Blaze**, as explained above — there's no way
  around this for any Firebase project sending email on a schedule, since
  Spark (free) plan functions can't call external APIs.
- Deleting an event deletes its whole signup list with it; there's no undo.
