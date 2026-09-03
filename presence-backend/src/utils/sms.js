// SMS reminders/confirmations, using Africa's Talking (africastalking.com) —
// a pay-as-you-go SMS gateway with Mobile Money billing, commonly used
// across Cameroon/West & East Africa, and a much better fit here than
// Twilio (which doesn't route to most Cameroonian numbers as reliably).
//
// This is entirely OPTIONAL and silently does nothing until you sign up for
// a real Africa's Talking account and set these three environment
// variables (in your .env locally, and in your host's environment variable
// settings when deployed):
//
//   AFRICASTALKING_USERNAME
//   AFRICASTALKING_API_KEY
//   AFRICASTALKING_SENDER_ID   (optional — omit to use the shared shortcode)
//
// Until then, every call below just logs what *would* have been sent and
// returns without throwing — so registration/check-in flows never break or
// slow down because SMS isn't set up yet.

const USERNAME = process.env.AFRICASTALKING_USERNAME;
const API_KEY = process.env.AFRICASTALKING_API_KEY;
const SENDER_ID = process.env.AFRICASTALKING_SENDER_ID;

const isConfigured = Boolean(USERNAME && API_KEY);

/**
 * @param {string} to E.164-ish phone number, e.g. '+237683794633'
 * @param {string} message
 */
export async function sendSms(to, message) {
  if (!to) return { sent: false, reason: 'no-phone-on-file' };
  if (!isConfigured) {
    console.log(`[sms:not-configured] Would send to ${to}: ${message}`);
    return { sent: false, reason: 'sms-not-configured' };
  }
  try {
    const body = new URLSearchParams({ username: USERNAME, to, message });
    if (SENDER_ID) body.set('from', SENDER_ID);
    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        apiKey: API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    });
    if (!res.ok) return { sent: false, reason: `http-${res.status}` };
    return { sent: true };
  } catch (err) {
    console.error('[sms:error]', err.message);
    return { sent: false, reason: 'network-error' };
  }
}
