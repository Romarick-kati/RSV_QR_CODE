import { config } from '../config/env.js';
import Event from '../models/Event.js';

// Everything the assistant knows about how Presence itself works. This is
// hand-written knowledge, not pulled from the FAQ/About pages at runtime —
// so if those pages change, remember to update this too (or the assistant
// will confidently describe an older version of the product).
const SYSTEM_PROMPT = `You are the Presence Assistant, a friendly, concise help widget built into the Presence event-registration platform. You answer questions about how Presence works and can look up real, currently-published events with the search_events tool.

WHAT PRESENCE IS
Presence replaces paper sign-in sheets with online RSVPs, digital QR passes, and a scanner-verified check-in. Anyone can register an account and create a free event with no approval needed. Charging for an event (a paid ticket) requires an approved "organizer" account — a free upgrade requested from the Profile page, reviewed by an admin.

FOR ATTENDEES
- Browse events on the Discover or Events pages, open one, and click "RSVP" (or "Pay & register" if it costs money).
- Registering produces a QR pass instantly, viewable any time under "My events" in the dashboard.
- At the venue, an organizer scans that QR code to check the attendee in — each code only works once.
- Paid events are charged through Fapshi via MTN or Orange Mobile Money; the pass unlocks automatically the moment Fapshi confirms payment, no manual approval needed.
- Online and hybrid events get an automatically-generated video meeting room (Jitsi) — the join link appears on the attendee's pass once they're registered.
- An attendee can cancel their own registration from "My events" before the registration deadline.

FOR ORGANIZERS
- Create an event from "+ Create event" in the nav bar: set title, description, date/time, timezone, venue (or online/hybrid format), capacity, registration deadline, optional custom registration questions, and price (0 = free).
- An event can be saved as a draft (invisible to the public) or published (goes live immediately and everyone finds out about it).
- The organizer console (accessible once you have an event) has: Dashboard (live totals), Events (manage all your events), Attendees (per-event guest list, force-confirm a payment if needed, promote from waitlist), Scanner (QR check-in, works offline and syncs later), Analytics (registration/capacity charts), Reports (cross-event attendance export as CSV), and Users (ADMIN only — manage accounts and roles).

LANGUAGE
Presence supports English and French — the toggle is in the nav bar (EN/FR).

ABOUT PRESENCE ITSELF
Presence was founded and built by Ndi Romarick Kati, a full-stack developer working across the MERN stack (MongoDB, Express, React, Node.js). He built the whole system end-to-end — frontend, backend, QR pass generation, real-time check-in, and the Fapshi payment integration. More about him is on the "Founder" page (linked from the About page).

HOW TO ANSWER
- Be brief — a sentence or two, occasionally a short list. This is a chat widget, not an essay.
- If someone asks whether an event exists, or wants recommendations, use search_events instead of guessing — you have no memory of what events exist otherwise.
- If you don't know something about Presence, say so plainly rather than inventing an answer. Don't make up prices, dates, or policies not stated above.
- Never claim to process payments, change account details, or take any action yourself — you only answer questions and search events. Direct the person to the actual page/button for anything that requires action.`;

const SEARCH_EVENTS_TOOL = {
  name: 'search_events',
  description: 'Search Presence\'s currently published, upcoming events by keyword (matches title, description, or category) and/or format. Use this whenever someone asks if an event exists, wants a recommendation, or asks what\'s happening — never guess at real event data.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Keyword to match against event title, description, or category. Leave empty to list any upcoming events.' },
      format: { type: 'string', enum: ['in-person', 'online', 'hybrid'], description: 'Optional — restrict to events of this format.' },
    },
  },
};

async function searchEvents({ query, format }) {
  const filter = { status: 'published', date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } };
  if (format) filter.format = format;
  if (query && query.trim()) {
    const safe = query.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(safe, 'i');
    filter.$or = [{ title: rx }, { description: rx }, { category: rx }];
  }
  const events = await Event.find(filter).sort({ date: 1 }).limit(5);
  if (events.length === 0) return 'No matching upcoming events found.';
  return events
    .map((e) => `- "${e.title}" (${e.category}, ${e.format}) on ${e.date.toDateString()} at ${e.venue} — ${e.price > 0 ? `${e.price} FCFA` : 'free'}. /events/${e.id}`)
    .join('\n');
}

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 12; // caps token/cost growth on a long-running chat

// Gemini's REST shape, confirmed against Google's own current docs
// (ai.google.dev/gemini-api/docs/generate-content/function-calling):
// the model name goes in the URL path (not the body, unlike Anthropic),
// auth is a plain x-goog-api-key header (no Bearer prefix), and the system
// prompt is its own top-level `systemInstruction` field rather than living
// alongside the conversation.
async function callGemini(contents) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.assistantModel}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.geminiApiKey,
    },
    body: JSON.stringify({
      contents,
      tools: [{ functionDeclarations: [SEARCH_EVENTS_TOOL] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

// `history` is whatever the previous turn returned — the frontend just
// echoes it back untouched, so this stays fully stateless server-side
// (no session/conversation record in the database). Gemini calls this
// array `contents` and uses role "model" where Anthropic used "assistant"
// — naming kept faithful to Gemini's own vocabulary throughout this file
// rather than papering over it, since a future maintainer reading Gemini's
// docs alongside this file shouldn't have to mentally translate terms.
export async function runAssistant({ message, history = [] }) {
  if (!config.geminiApiKey) {
    return {
      reply: "The assistant isn't set up yet — the site owner needs to add a GEMINI_API_KEY. In the meantime, check the FAQ page for common questions!",
      history,
    };
  }

  const trimmedMessage = String(message || '').slice(0, MAX_MESSAGE_LENGTH);
  let contents = [...history.slice(-MAX_HISTORY_MESSAGES), { role: 'user', parts: [{ text: trimmedMessage }] }];

  let data = await callGemini(contents);

  // Standard Gemini function-calling loop: if the model's turn contains
  // any functionCall parts, run them ourselves, hand the results back as
  // functionResponse parts, and let the model produce its real answer.
  // Bounded to a couple of rounds — this assistant only has one simple
  // tool, so it should never need more than one round-trip in practice,
  // but a hard cap protects against an unexpected loop.
  let rounds = 0;
  while (rounds < 3) {
    const modelParts = data.candidates?.[0]?.content?.parts || [];
    const functionCalls = modelParts.filter((p) => p.functionCall).map((p) => p.functionCall);
    if (functionCalls.length === 0) break;
    rounds += 1;
    const functionResponseParts = await Promise.all(
      functionCalls.map(async (fc) => {
        let output;
        try {
          output = fc.name === 'search_events' ? await searchEvents(fc.args || {}) : `Unknown tool: ${fc.name}`;
        } catch (err) {
          output = `Tool error: ${err.message}`;
        }
        // `id` is only present on some model versions (Gemini 3+ always
        // sends one; 2.x models often don't) — pass it through when it
        // exists rather than assuming either way.
        return { functionResponse: { name: fc.name, response: { result: output }, ...(fc.id ? { id: fc.id } : {}) } };
      })
    );
    contents = [...contents, { role: 'model', parts: modelParts }, { role: 'user', parts: functionResponseParts }];
    data = await callGemini(contents);
  }

  const finalParts = data.candidates?.[0]?.content?.parts || [];
  const replyText = finalParts.filter((p) => p.text).map((p) => p.text).join('\n').trim() || "Sorry, I didn't catch that — could you rephrase?";
  contents = [...contents, { role: 'model', parts: finalParts }];
  return { reply: replyText, history: contents.slice(-MAX_HISTORY_MESSAGES) };
}
