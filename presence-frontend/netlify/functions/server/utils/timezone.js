// Computes the UTC offset (in minutes) of an IANA timezone at a given
// instant, using only the built-in Intl API — no moment-timezone/date-fns-tz
// dependency needed (and none could be installed here without npm/network
// access anyway). Correct across DST-observing zones because it's computed
// from the actual calendar date passed in, not just "today".
export function getTimezoneOffsetMinutes(timeZone, date = new Date()) {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const parts = dtf.formatToParts(date).reduce((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});
    const asUTC = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour), Number(parts.minute), Number(parts.second)
    );
    return Math.round((asUTC - date.getTime()) / 60000);
  } catch {
    // Unknown/invalid IANA zone string — fall back to WAT rather than
    // crashing the request (defensive; the EventForm only offers valid
    // Intl-recognized zone names, so this really shouldn't happen).
    return 60;
  }
}
