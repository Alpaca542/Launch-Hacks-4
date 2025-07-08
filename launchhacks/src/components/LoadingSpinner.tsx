import React from "react";

interface LoadingSpinnerProps {
    size?: "small" | "medium" | "large";
    color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = "medium",
    color = "#4f86f7",
}) => {
    const sizeClasses = {
        small: "w-4 h-4 border-2",
        medium: "w-8 h-8 border-3",
        large: "w-12 h-12 border-4",
    };

    return (
        <div className="flex items-center justify-center">
            <div
                className={`${sizeClasses[size]} border-gray-200 dark:border-gray-700 border-t-indigo-500 dark:border-t-indigo-400 rounded-full animate-spin`}
                style={{ borderTopColor: color }}
            />
        </div>
    );
};

export default LoadingSpinner;
