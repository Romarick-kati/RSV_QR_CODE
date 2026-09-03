import { ApiError } from './ApiError.js';

// An ADMIN (you, the platform owner) can see/manage every event. An
// ORGANIZER (a client you've sold an account to) may only see and manage
// events they created — this is what keeps two different clients' data
// separated on a single shared deployment.
export function isEventOwner(user, event) {
  if (user.role === 'ADMIN') return true;
  const organizerId = event.organizer?._id?.toString() || event.organizer?.toString();
  return user.role === 'ORGANIZER' && organizerId === user.id;
}

export function assertEventAccess(user, event) {
  if (!isEventOwner(user, event)) {
    throw ApiError.forbidden('You do not have access to this event.');
  }
}
