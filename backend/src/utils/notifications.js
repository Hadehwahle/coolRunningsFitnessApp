import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitTo } from '../socket.js';

export const threadLink = (threadId) => `/community/thread/${threadId}`;

async function wantsNotification(userId, prefKey) {
  const u = await User.findById(userId).select('preferences.notifications active').lean();
  if (!u || u.active === false) return false;
  return u.preferences?.notifications?.[prefKey] !== false;
}

async function createPersonal(data, prefKey) {
  try {
    if (!(await wantsNotification(data.recipient, prefKey))) return null;
    const notif = await Notification.create(data);
    emitTo(`user:${data.recipient.toString()}`, 'notification', notif.toObject());
    return notif;
  } catch (err) {
    console.error('Notification error:', err.message);
    return null;
  }
}

// One shared document for everyone, instead of one per user.
export async function notifyNewBlogPost(post, authorId) {
  try {
    const exists = await Notification.exists({ broadcast: true, type: 'new_blog', blogPost: post._id });
    if (exists) return; // already announced (e.g. unpublished then republished)
    const notif = await Notification.create({
      broadcast: true,
      type: 'new_blog',
      title: 'New Article Published',
      message: `"${post.title}" is now live on the blog.`,
      link: `/blog/${post.slug}`,
      blogPost: post._id,
      actor: authorId,
    });
    // Clients filter this using the user's own "new blog posts" preference
    emitTo('users', 'notification', { ...notif.toObject(), read: false });
  } catch (err) {
    console.error('notifyNewBlogPost:', err.message);
  }
}

function authorIdOf(thread) {
  return thread.author?._id?.toString() || thread.author?.toString();
}

export async function notifyThreadReply(thread, replierUserId, replierName) {
  const authorId = authorIdOf(thread);
  if (!authorId || authorId === replierUserId.toString()) return;
  await createPersonal({
    recipient: authorId,
    type: 'thread_reply',
    title: 'New reply on your discussion',
    message: `${replierName || 'Someone'} replied to "${thread.title}"`,
    link: threadLink(thread._id),
    thread: thread._id,
    actor: replierUserId,
  }, 'threadReplies');
}

export async function notifyThreadLike(thread, likerUserId, likerName) {
  const authorId = authorIdOf(thread);
  if (!authorId || authorId === likerUserId.toString()) return;
  // Don't stack a new notification every time someone toggles like/unlike
  const recent = await Notification.exists({
    recipient: authorId, type: 'thread_like', thread: thread._id, actor: likerUserId,
  });
  if (recent) return;
  await createPersonal({
    recipient: authorId,
    type: 'thread_like',
    title: 'Someone liked your discussion',
    message: `${likerName || 'Someone'} liked "${thread.title}"`,
    link: threadLink(thread._id),
    thread: thread._id,
    actor: likerUserId,
  }, 'threadLikes');
}
