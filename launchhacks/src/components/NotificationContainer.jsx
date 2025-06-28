import React from "react";

const NotificationItem = ({ notification, onRemove }) => {
    const getIcon = (type) => {
        switch (type) {
            case "success":
                return "✅";
            case "error":
                return "❌";
            case "warning":
                return "⚠️";
            case "info":
                return "ℹ️";
            default:
                return "📄";
        }
    };

    return (
        <div className={`notification notification-${notification.type}`}>
            <div className="notification-content">
                <span className="notification-icon">
                    {getIcon(notification.type)}
                </span>
                <span className="notification-message">
                    {notification.message}
                </span>
            </div>
            <button
                className="notification-close"
                onClick={() => onRemove(notification.id)}
            >
                ×
            </button>
        </div>
    );
};

const NotificationContainer = ({ notifications, onRemove }) => {
    if (notifications.length === 0) return null;

    return (
        <div className="notifications-container">
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
};

export default NotificationContainer;
