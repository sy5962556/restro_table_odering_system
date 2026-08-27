import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  Volume2, 
  VolumeX, 
  QrCode, 
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { playOrderBell } from '../../services/soundService';
import api from '../../services/api';

export const AdminTopNav = ({ onToggleSidebar, title = 'Dashboard Overview' }) => {
  const navigate = useNavigate();
  const { socket, joinRestaurant } = useSocket();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to socket notifications
  useEffect(() => {
    if (!socket) return;
    joinRestaurant('all');

    const handleNewOrder = ({ order, notification }) => {
      if (soundEnabled) playOrderBell();
      if (notification) {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(c => c + 1);
      }
    };

    const handleBillRequested = ({ notification }) => {
      if (soundEnabled) playOrderBell();
      if (notification) {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(c => c + 1);
      }
    };

    const handleWaiterCalled = ({ notification }) => {
      if (soundEnabled) playOrderBell();
      if (notification) {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(c => c + 1);
      }
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('billRequested', handleBillRequested);
    socket.on('waiterCalled', handleWaiterCalled);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('billRequested', handleBillRequested);
      socket.off('waiterCalled', handleWaiterCalled);
    };
  }, [socket, soundEnabled]);

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* QR Simulator Quick Link */}
          <button
            onClick={() => navigate('/simulator')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Simulate Customer QR</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 border-slate-200 dark:border-slate-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
            title={soundEnabled ? 'Audio Alerts Enabled' : 'Audio Alerts Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) markAllAsRead();
              }}
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-2 animate-fadeIn z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Live Alerts</h4>
                  <span className="text-[10px] text-slate-400">Real-Time Sync</span>
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 space-y-1">
                    <p>No new alerts</p>
                    <p className="text-[10px]">Orders & calls will show up here automatically.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.slice(0, 8).map((notif, idx) => (
                      <div 
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs space-y-0.5"
                      >
                        <h5 className="font-bold text-slate-900 dark:text-white">{notif.title}</h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopNav;
