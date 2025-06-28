import React from "react";

interface Notification {
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
}

interface NotificationItemProps {
    notification: Notification;
    onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onRemove,
}) => {
    const getIcon = (type: Notification["type"]): string => {
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

interface NotificationContainerProps {
    notifications: Notification[];
    onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
    notifications,
    onRemove,
}) => {
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
