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
                return "bg-green-900/20 dark:bg-green-900/30 border-green-500/30 dark:border-green-500/40 text-green-300 dark:text-green-400";
            case "error":
                return "bg-red-900/20 dark:bg-red-900/30 border-red-500/30 dark:border-red-500/40 text-red-300 dark:text-red-400";
            case "warning":
                return "bg-yellow-900/20 dark:bg-yellow-900/30 border-yellow-500/30 dark:border-yellow-500/40 text-yellow-300 dark:text-yellow-400";
            case "info":
                return "bg-blue-900/20 dark:bg-blue-900/30 border-blue-500/30 dark:border-blue-500/40 text-blue-300 dark:text-blue-400";
            default:
                return "bg-gray-900/20 dark:bg-gray-900/30 border-gray-500/30 dark:border-gray-500/40 text-gray-300 dark:text-gray-400";
        }
    };
    return (
        <div
            className={`notification relative min-w-80 max-w-md p-4 rounded-xl border shadow-2xl backdrop-blur-sm                         transform transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-3xl                        ${getTypeClasses(
                notification.type
            )}`}
        >
            {" "}
            <div className="flex items-start gap-3">
                {" "}
                <span className="text-lg flex-shrink-0 mt-0.5">
                    {" "}
                    {getIcon(notification.type)}{" "}
                </span>{" "}
                <div className="flex-1 min-w-0">
                    {" "}
                    <p className="text-sm font-medium leading-5 break-words">
                        {" "}
                        {notification.message}{" "}
                    </p>{" "}
                </div>{" "}
                <button
                    onClick={() => onRemove(notification.id)}
                    className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-200 dark:hover:text-gray-300                              hover:bg-gray-700/50 dark:hover:bg-gray-600/50                              rounded-full p-1 transition-all duration-200                              focus:outline-none focus:ring-2 focus:ring-gray-500/20 dark:focus:ring-gray-400/20"
                    aria-label="Close notification"
                >
                    {" "}
                    <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        {" "}
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />{" "}
                    </svg>{" "}
                </button>{" "}
            </div>{" "}
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
    return (
        <div className="notification-container fixed top-4 right-4 space-y-3 z-[2000] pointer-events-none">
            {" "}
            {notifications.map((notification) => (
                <div key={notification.id} className="pointer-events-auto">
                    {" "}
                    <NotificationItem
                        notification={notification}
                        onRemove={onRemove}
                    />{" "}
                </div>
            ))}{" "}
        </div>
    );
};
export default NotificationContainer;
