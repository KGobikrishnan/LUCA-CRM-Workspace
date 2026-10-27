import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell, X, CheckCheck, Send, ChevronDown,
  CheckSquare, Briefcase, MessageSquare, Info,
  Volume2, Clock, Users
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
};

const typeConfig = {
  task_assign: { icon: CheckSquare, color: 'text-violet-500', bg: 'bg-violet-100 dark:bg-violet-900/30', label: 'Task' },
  project_assign: { icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Project' },
  message: { icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30', label: 'Message' },
  system: { icon: Info, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700/50', label: 'System' },
};

const getTypeConfig = (type) => typeConfig[type] || typeConfig.system;

// ─── Notification Item ────────────────────────────────────────────────────────

const NotifItem = ({ notif, onMarkRead }) => {
  const cfg = getTypeConfig(notif.type);
  const Icon = cfg.icon;
  const isBroadcast = !notif.userId;

  return (
    <div
      onClick={() => !notif.isRead && onMarkRead(notif.id)}
      className={`flex gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-200 group
        ${notif.isRead
          ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
          : 'bg-indigo-50/60 dark:bg-indigo-900/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/30'
        }`}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-bold leading-tight truncate ${notif.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
            {notif.title || cfg.label}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {!notif.isRead && (
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
            )}
            {isBroadcast && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
                ALL
              </span>
            )}
          </div>
        </div>
        <p className={`text-xs mt-0.5 leading-relaxed line-clamp-2 ${notif.isRead ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
          {notif.message}
        </p>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {timeAgo(notif.createdAt)}
        </p>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const NotificationPanel = () => {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Compose state (admin/super admin only)
  const [composeMsg, setComposeMsg] = useState('');
  const [composeTarget, setComposeTarget] = useState('ALL');
  const [sending, setSending] = useState(false);

  const panelRef = useRef(null);
  const isAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';

  // ── Fetch notifications ──────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/notifications/user/${user.id}`);
      setNotifications(res.data);
      const unread = res.data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [user?.id]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) { /* silent */ }
  }, [isAdmin]);

  // Poll every 30s
  useEffect(() => {
    fetchNotifications();
    fetchUsers();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUsers]);

  // Open panel → fetch fresh
  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchNotifications().finally(() => setLoading(false));
    }
  }, [open]);

  // Click-outside close
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.put(`/notifications/user/${user.id}/mark-all-read`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) { /* silent */ }
  };

  const sendMessage = async () => {
    if (!composeMsg.trim()) return;
    setSending(true);
    try {
      await api.post('/notifications/send', {
        title: 'Admin Message',
        message: composeMsg.trim(),
        senderId: user.id,
        targetUserId: composeTarget === 'ALL' ? 'ALL' : composeTarget,
      });
      setComposeMsg('');
      setComposeTarget('ALL');
      await fetchNotifications();
    } catch (err) {
      console.error('Send failed', err);
    } finally {
      setSending(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-xl transition-all active:scale-95
          text-slate-500 dark:text-slate-400
          hover:text-indigo-600 dark:hover:text-indigo-400
          hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        title="Notifications"
      >
        <Bell className={`w-[18px] h-[18px] ${unreadCount > 0 ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full
            bg-red-500 border-2 border-white dark:border-slate-900
            text-white text-[9px] font-black flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] sm:w-[420px]
          bg-white dark:bg-slate-900
          border border-slate-200 dark:border-slate-700
          rounded-3xl shadow-2xl shadow-slate-900/20 dark:shadow-black/40
          flex flex-col max-h-[85vh] z-50
          animate-in slide-in-from-top-2 fade-in duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-[10px] font-bold text-indigo-500">{unreadCount} unread</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  title="Mark all read"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> All Read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Admin Compose Box */}
          {isAdmin && (
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 dark:from-indigo-900/20 dark:to-violet-900/10">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Send Announcement</span>
              </div>

              {/* Target dropdown */}
              <div className="relative mb-2">
                <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={composeTarget}
                  onChange={e => setComposeTarget(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="ALL">📢 Send to All Users</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      👤 {u.fullName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Message input */}
              <div className="flex gap-2">
                <textarea
                  value={composeMsg}
                  onChange={e => setComposeMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type your message... (Enter to send)"
                  rows={2}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 resize-none focus:ring-2 focus:ring-indigo-500 outline-none font-medium placeholder-slate-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={!composeMsg.trim() || sending}
                  className="self-end px-3 py-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 text-xs font-black"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? '...' : 'Send'}
                </button>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-6 text-center">
                <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">All caught up!</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No notifications yet.</p>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {notifications.map(n => (
                  <NotifItem key={n.id} notif={n} onMarkRead={markRead} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
