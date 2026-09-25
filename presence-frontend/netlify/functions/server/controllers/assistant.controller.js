import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { runAssistant } from '../utils/assistant.js';

// Deliberately open to logged-out visitors too (no requireAuth on this
// route) — "how do I use this thing" is exactly the question someone asks
// BEFORE they've created an account. Rate-limited instead (see
// assistantLimiter on the route) since there's no login to gate abuse
// with here.
export const chat = asyncHandler(async (req, res) => {
  const { message, history } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw ApiError.badRequest('A message is required.');
  }
  if (history && (!Array.isArray(history) || history.length > 40)) {
    throw ApiError.badRequest('Invalid conversation history.');
  }
  const result = await runAssistant({ message, history });
  res.json(result);
});
