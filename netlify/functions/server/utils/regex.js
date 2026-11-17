// Escapes regex special characters so a search term like "C++" or "(demo)"
// is treated as a literal substring, not a broken (or exploitable) pattern.
export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
