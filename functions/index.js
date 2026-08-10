// Scheduled reminder emails.
//
// Once a day, this looks for events happening in the next 48 hours that
// haven't been reminded about yet, and emails every admin of that event's
// chapter with the headcount and event details. A 48h (not 24h) lookahead
// is intentional: with a once-a-day check, a strict 24h window can leave
// as little as an hour's notice for events later in the day than the
// check itself runs. 48h guarantees at least ~24h notice, always exactly
// once per event (see the reminderSent flag below).
//
// Requires the Blaze (pay-as-you-go) plan -- Google requires this for any
// function that calls an external API, which sending email does. At this
// volume (one run/day, a handful of emails) you'll stay inside the free
// tier and this should cost $0/month. See ../README.md for setup.

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { Resend } = require('resend');

initializeApp();

const resendApiKey = defineSecret('RESEND_API_KEY');

// >>> Update this once you've verified a sending domain in Resend. <<<
// Resend's shared sandbox address (onboarding@resend.dev) only delivers
// to the email you signed up to Resend with -- fine for testing solo,
// but it will silently fail to reach any *other* chapter lead's inbox
// until you verify your own domain and change this address.
const FROM_ADDRESS = 'Klotho Connect <onboarding@resend.dev>';

const LOOKAHEAD_HOURS = 48;

exports.sendEventReminders = onSchedule(
  {
    schedule: 'every day 09:00',
    timeZone: 'America/New_York',
    secrets: [resendApiKey],
  },
  async () => {
    const db = getFirestore();
    const resend = new Resend(resendApiKey.value());

    const now = Timestamp.now();
    const windowEnd = Timestamp.fromMillis(now.toMillis() + LOOKAHEAD_HOURS * 60 * 60 * 1000);

    const dueSnap = await db
      .collection('events')
      .where('reminderSent', '==', false)
      .where('dateTime', '>=', now)
      .where('dateTime', '<=', windowEnd)
      .get();

    if (dueSnap.empty) {
      logger.info('No events need a reminder today.');
      return;
    }

    for (const eventDoc of dueSnap.docs) {
      await remindForEvent(db, resend, eventDoc);
    }
  }
);

async function remindForEvent(db, resend, eventDoc) {
  const event = eventDoc.data();
  try {
    const [chapterSnap, signupsSnap] = await Promise.all([
      db.collection('chapters').doc(event.chapterId).get(),
      db.collection('events').doc(eventDoc.id).collection('signups').get(),
    ]);

    const chapter = chapterSnap.exists ? chapterSnap.data() : null;
    const adminIds = chapter?.adminIds || [];
    const volunteerNames = signupsSnap.docs.map((d) => d.data().name).filter(Boolean);
    const volunteerCount = signupsSnap.size;

    const adminSnaps = await Promise.all(adminIds.map((uid) => db.collection('users').doc(uid).get()));
    const adminEmails = adminSnaps.map((s) => s.data()?.email).filter(Boolean);

    if (adminEmails.length === 0) {
      logger.warn(`Event ${eventDoc.id} has no reachable chapter admin email \u2014 marking sent without emailing.`);
    } else {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: adminEmails,
        subject: `${volunteerCount} signed up for ${event.title}`,
        html: reminderEmailHtml({ event, chapter, volunteerCount, volunteerNames }),
      });
      logger.info(`Sent reminder for "${event.title}" (${eventDoc.id}) to ${adminEmails.join(', ')}`);
    }

    // Only mark sent once we're actually done -- if resend.emails.send()
    // above throws, we never reach this line, so a real send failure
    // gets retried on tomorrow's run instead of being silently dropped.
    await eventDoc.ref.update({ reminderSent: true });
  } catch (err) {
    logger.error(`Failed to send reminder for event ${eventDoc.id}`, err);
  }
}

function reminderEmailHtml({ event, chapter, volunteerCount, volunteerNames }) {
  const when = event.dateTime.toDate().toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  const roster = volunteerNames.length
    ? `<ul style="padding-left:18px; margin:8px 0;">${volunteerNames.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul>`
    : '<p style="color:#5C4F49;">No one has signed up yet.</p>';

  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color:#2A211D;">
      <p style="text-transform:uppercase; letter-spacing:0.04em; font-size:12px; color:#B36F1E; font-weight:600;">Coming up soon</p>
      <h2 style="font-size:22px; margin:4px 0 16px;">${escapeHtml(event.title)}</h2>
      <p><strong>When:</strong> ${when}</p>
      <p><strong>Where:</strong> ${escapeHtml(event.location || 'No location set')}</p>
      <p><strong>Chapter:</strong> ${escapeHtml(chapter?.name || 'Unknown')}, ${escapeHtml(chapter?.state || '')}</p>
      <p style="margin-top:20px;"><strong>${volunteerCount} of ${event.volunteersNeeded} volunteer${event.volunteersNeeded === 1 ? '' : 's'} signed up:</strong></p>
      ${roster}
      ${event.description ? `<hr style="border:none; border-top:1px solid #E8DFCC; margin:20px 0;" /><p style="font-size:13px; color:#5C4F49; white-space:pre-line;">${escapeHtml(event.description)}</p>` : ''}
    </div>
  `;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
