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
    isConceptMode: boolean;
    onToggleMode: () => void;
}

function TopBar({
    name,
    onSetName,
    user,
    isSaving,
    isConceptMode,
    onToggleMode,
}: TopBarProps) {
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
            <div className="name">
                <div className="app-container">
                    <header className="app-header">
                        <h1>Tink Flow Editor</h1>
                        <div className="user-info">
                            <p>
                                Welcome,{" "}
                                {user?.isAnonymous
                                    ? "Anonymous User"
                                    : user?.email || "User"}
                            </p>
                            {isSaving && (
                                <span className="save-indicator">
                                    💾 Saving...
                                </span>
                            )}
                            <button
                                className="mode-toggle-btn"
                                onClick={onToggleMode}
                                title={`Switch to ${
                                    isConceptMode ? "Word" : "Concept"
                                } Mode`}
                            >
                                {isConceptMode
                                    ? "📝 Word Mode"
                                    : "🧠 Concept Mode"}
                            </button>
                        </div>
                    </header>
                </div>
                <div className="board-title-section">
                    {!edit ? (
                        <h6 onClick={handleClick} style={{ cursor: "pointer" }}>
                            {name || "Untitled Board"}
                        </h6>
                    ) : (
                        <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onKeyDown={handleKeyPress}
                            onBlur={() => {
                                onSetName(editedName);
                                setEdit(false);
                            }}
                            autoFocus
                        />
                    )}
                    <div className="keyboard-shortcuts">
                        <small>
                            💡 Tips: Ctrl+N for new board, Ctrl+1-9 to switch
                            boards
                        </small>
                    </div>
                </div>
            </div>
        </>
    );
}

export default TopBar;
