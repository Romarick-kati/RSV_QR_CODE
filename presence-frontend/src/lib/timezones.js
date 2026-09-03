// Curated list for the EventForm timezone <select> — West/Central Africa
// first (this app's primary market), then other regions organizers might
// host events in. Every value is a real IANA zone name Intl understands.
export const TIMEZONE_OPTIONS = [
  { group: 'Africa', zones: [
    { value: 'Africa/Douala', label: 'Douala, Yaoundé (WAT, UTC+1)' },
    { value: 'Africa/Lagos', label: 'Lagos (WAT, UTC+1)' },
    { value: 'Africa/Accra', label: 'Accra (GMT, UTC+0)' },
    { value: 'Africa/Abidjan', label: 'Abidjan, Dakar (GMT, UTC+0)' },
    { value: 'Africa/Nairobi', label: 'Nairobi (EAT, UTC+3)' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST, UTC+2)' },
    { value: 'Africa/Cairo', label: 'Cairo (EET, UTC+2)' },
    { value: 'Africa/Kinshasa', label: 'Kinshasa (WAT, UTC+1)' },
  ] },
  { group: 'Europe', zones: [
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris, Berlin' },
    { value: 'Europe/Lisbon', label: 'Lisbon' },
  ] },
  { group: 'Americas', zones: [
    { value: 'America/New_York', label: 'New York (Eastern)' },
    { value: 'America/Chicago', label: 'Chicago (Central)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (Pacific)' },
    { value: 'America/Toronto', label: 'Toronto' },
  ] },
  { group: 'Middle East & Asia', zones: [
    { value: 'Asia/Dubai', label: 'Dubai' },
    { value: 'Asia/Kolkata', label: 'Mumbai, Delhi' },
    { value: 'Asia/Shanghai', label: 'Beijing, Shanghai' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
  ] },
];

const LABEL_BY_VALUE = TIMEZONE_OPTIONS.flatMap((g) => g.zones).reduce((acc, z) => { acc[z.value] = z.label; return acc; }, {});

/** Short "WAT" / "GMT+1"-style abbreviation for a zone at a given date, via Intl (DST-aware). */
export function timezoneAbbreviation(timeZone, date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(date);
    return parts.find((p) => p.type === 'timeZoneName')?.value || timeZone;
  } catch {
    return timeZone || '';
  }
}

export function timezoneLabel(value) {
  return LABEL_BY_VALUE[value] || value;
}
