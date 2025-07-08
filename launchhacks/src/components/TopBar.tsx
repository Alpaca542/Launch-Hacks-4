import { useState, useEffect } from "react";
import "./EditableNode.css";

interface User {
    isAnonymous?: boolean;
    email?: string | null;
}

interface TopBarProps {
    name: string;
    onSetName: (name: string) => void;
    user: User | null;
    isSaving: boolean;
}

function TopBar({ name, onSetName, user, isSaving }: TopBarProps) {
    const [edit, setEdit] = useState(false);
    const [editedName, setEditedName] = useState(name || "");

    // Update editedName when name prop changes
    useEffect(() => {
        setEditedName(name || "");
    }, [name]);

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            onSetName(editedName);
            setEdit(false);
        }
    };

    const handleClick = () => {
        setEdit(true);
        setEditedName(name || "");
    };

    return (
        <>
            <div className={"name"}>
                <div className="app-container">
                    <header className="app-header">
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                            }}
                        >
                            <h1>Launch Flow</h1>
                            <span
                                style={{ color: "#64748b", fontSize: "13px" }}
                            >
                                •
                            </span>
                            {!edit ? (
                                <button
                                    onClick={handleClick}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#94a3b8",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        transition: "all 0.15s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background =
                                            "rgba(255, 255, 255, 0.05)";
                                        e.currentTarget.style.color = "#f1f5f9";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background =
                                            "none";
                                        e.currentTarget.style.color = "#94a3b8";
                                    }}
                                >
                                    {name || "Untitled Board"}
                                </button>
                            ) : (
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) =>
                                        setEditedName(e.target.value)
                                    }
                                    onKeyDown={handleKeyPress}
                                    onBlur={() => {
                                        onSetName(editedName);
                                        setEdit(false);
                                    }}
                                    style={{
                                        background: "#2a2a2a",
                                        border: "1px solid rgba(255, 255, 255, 0.2)",
                                        borderRadius: "4px",
                                        padding: "4px 8px",
                                        color: "#f1f5f9",
                                        fontSize: "14px",
                                        minWidth: "120px",
                                    }}
                                    autoFocus
                                />
                            )}
                        </div>
                        <div className="user-info">
                            <p>
                                {user?.isAnonymous
                                    ? "Guest"
                                    : user?.email?.split("@")[0] || "User"}
                            </p>
                            {isSaving && (
                                <span className="save-indicator">
                                    💾 Saving
                                </span>
                            )}
                        </div>
                    </header>
                </div>
            </div>
        </>
    );
}

export default TopBar;
