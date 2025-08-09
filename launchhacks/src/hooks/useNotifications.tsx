import { useState } from "react";

// Type definitions
export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    timestamp: Date;
    duration?: number;
    autoRemove?: boolean;
}

export interface NotificationOptions {
    duration?: number;
    autoRemove?: boolean;
}

export interface UseNotificationsReturn {
    notifications: Notification[];
    addNotification: (
        notification: Omit<Notification, "id" | "timestamp">
    ) => string;
    removeNotification: (id: string) => void;
    clearAllNotifications: () => void;
    showSuccess: (message: string, options?: NotificationOptions) => string;
    showError: (message: string, options?: NotificationOptions) => string;
    showInfo: (message: string, options?: NotificationOptions) => string;
    showWarning: (message: string, options?: NotificationOptions) => string;
}

export const useNotifications = (): UseNotificationsReturn => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = (id: string): void => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const addNotification = (
        notification: Omit<Notification, "id" | "timestamp">
    ): string => {
        const id = `notification_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 6)}`;
        const newNotification: Notification = {
            id,
            timestamp: new Date(),
            ...notification,
        };

        setNotifications((prev) => [...prev, newNotification]);

        // Auto-remove after delay if specified
        if (notification.autoRemove !== false) {
            setTimeout(() => {
                removeNotification(id);
            }, notification.duration || 5000);
        }

        return id;
    };

    const clearAllNotifications = (): void => {
        setNotifications([]);
    };

    const showSuccess = (
        message: string,
        options: NotificationOptions = {}
    ): string => {
        return addNotification({
            type: "success",
            message,
            ...options,
        });
    };

    const showError = (
        message: string,
        options: NotificationOptions = {}
    ): string => {
        return addNotification({
            type: "error",
            message,
            duration: 7000, // Errors stay longer
            ...options,
        });
    };

    const showInfo = (
        message: string,
        options: NotificationOptions = {}
    ): string => {
        return addNotification({
            type: "info",
            message,
            ...options,
        });
    };

    const showWarning = (
        message: string,
        options: NotificationOptions = {}
    ): string => {
        return addNotification({
            type: "warning",
            message,
            duration: 6000,
            ...options,
        });
    };

    return {
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        showSuccess,
        showError,
        showInfo,
        showWarning,
    };
};
