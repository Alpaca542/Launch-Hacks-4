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

    const getTypeClasses = (type: Notification["type"]): string => {
        switch (type) {
            case "success":
                return "bg-green-900/20 dark:bg-green-900/30 border-green-500/30 dark:border-green-500/40 text-green-400 dark:text-green-400";
            case "error":
                return "bg-red-900/20 dark:bg-red-900/30 border-red-500/30 dark:border-red-500/40 text-red-400 dark:text-red-400";
            case "warning":
                return "bg-yellow-900/20 dark:bg-yellow-900/30 border-yellow-500/30 dark:border-yellow-500/40 text-yellow-400 dark:text-yellow-400";
            case "info":
                return "bg-blue-900/20 dark:bg-blue-900/30 border-blue-500/30 dark:border-blue-500/40 text-blue-400 dark:text-blue-400";
            default:
                return "bg-gray-900/20 dark:bg-gray-900/30 border-gray-500/30 dark:border-gray-500/40 text-gray-400 dark:text-gray-400";
        }
    };

    return (
        <div
            className={`notification relative min-w-80 max-w-md p-4 rounded-lg border shadow-lg backdrop-blur-sm 
                        animate-slide-in-right transition-all duration-300 
                        ${getTypeClasses(notification.type)}`}
        >
            <div className="notification-content flex items-start gap-3 pr-6">
                <span className="notification-icon text-lg flex-shrink-0">
                    {getIcon(notification.type)}
                </span>
                <span className="notification-message flex-1 text-sm leading-relaxed">
                    {notification.message}
                </span>
            </div>
            <button
                className="notification-close absolute top-2 right-2 bg-transparent border-none 
                         text-gray-400 dark:text-gray-400 hover:text-white dark:hover:text-white 
                         cursor-pointer text-lg p-1 rounded transition-colors duration-150 
                         hover:bg-white/10 dark:hover:bg-white/10"
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
        <div
            className="notifications-container fixed top-4 right-4 z-50 flex flex-col gap-3 
                       max-h-screen overflow-y-auto"
        >
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
