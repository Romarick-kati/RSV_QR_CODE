import { ApiError } from './ApiError.js';

// An ADMIN (you, the platform owner) can see/manage every event. An
// ORGANIZER or ATTENDEE may only see and manage events they created
// themselves — this is what keeps a self-serve "anyone can host" model
// (any signed-in user can create an event, Luma-style) safe: creating an
// event doesn't grant visibility into anyone else's events or attendee
// data, only your own.
export function isEventOwner(user, event) {
  if (user.role === 'ADMIN') return true;
  const organizerId = event.organizer?._id?.toString() || event.organizer?.toString();
  return ['ORGANIZER', 'ATTENDEE'].includes(user.role) && organizerId === user.id;
}

export function assertEventAccess(user, event) {
  if (!isEventOwner(user, event)) {
    throw ApiError.forbidden('You do not have access to this event.');
  }
}
