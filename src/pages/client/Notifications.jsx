import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { formatNotificationTime, getNotificationRedirectPath } from '../../utils/notificationRedirect';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadNotificationCount,
    notificationsLoading,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useOrders();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onOpenNotification = async (notification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
    }
    navigate(getNotificationRedirectPath(notification));
  };

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-header">
          <div>
            <h1>Notifications</h1>
            <p>Track order updates and important account alerts</p>
          </div>
          <button
            type="button"
            className="notifications-mark-all"
            onClick={markAllNotificationsRead}
            disabled={unreadNotificationCount === 0}
          >
            <CheckCheck size={16} />
            Mark All Read
          </button>
        </div>

        {notificationsLoading && notifications.length === 0 ? (
          <div className="notifications-empty">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <Bell size={28} />
            <span>No notifications yet.</span>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <button
                type="button"
                key={notification.id}
                className={`notifications-item ${notification.read ? 'read' : 'unread'}`}
                onClick={() => onOpenNotification(notification)}
              >
                <div className="notifications-item-top">
                  <strong>{notification.title}</strong>
                  <span>{formatNotificationTime(notification.createdAt)}</span>
                </div>
                <p>{notification.message}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
