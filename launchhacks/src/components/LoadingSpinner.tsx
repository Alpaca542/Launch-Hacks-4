import React from "react";

interface LoadingSpinnerProps {
    size?: "small" | "medium" | "large";
    color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = "medium",
    color = "#4f86f7",
}) => {
    return (
        <div className={`loading-spinner ${size}`}>
            <div className="spinner-ring" style={{ borderTopColor: color }} />
        </div>
    );
};

export default LoadingSpinner;
