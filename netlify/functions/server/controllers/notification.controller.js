import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicUser } from '../services/token.service.js';

// Open to any authenticated account, not just ADMIN/ORGANIZER — this is
// the "how do I find out a new event exists" feed for ordinary attendees,
// deliberately kept separate from the admin bell's own feed (see
// audience field on the Notification model).
export const listMine = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ audience: 'attendee' }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = notifications.filter((n) => !n.readBy.some((id) => id.equals(req.user.id))).length;
  const shaped = notifications.map((n) => ({
    ...publicUser(n),
    readByMe: n.readBy.some((id) => id.equals(req.user.id)),
    readBy: undefined, // who else has read it isn't the frontend's business
  }));
  res.json({ notifications: shaped, unreadCount });
});

export const markMineRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, audience: 'attendee' });
  if (!notification) return res.json({ notification: null }); // already gone / wrong audience — nothing to do
  if (!notification.readBy.some((id) => id.equals(req.user.id))) {
    notification.readBy.push(req.user.id);
    await notification.save();
  }
  res.json({ notification: publicUser(notification) });
});

export const markAllMineRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ audience: 'attendee', readBy: { $ne: req.user.id } }, { $addToSet: { readBy: req.user.id } });
  res.json({ message: 'All notifications marked as read.' });
});
