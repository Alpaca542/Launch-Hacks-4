import { useState, useEffect } from "react";
import { Handle, Position } from "reactflow";
import "./EditableNode.css";

function TopBar({ name, onSetName, user }) {
    const [edit, setEdit] = useState(false);
    const [editedName, setEditedName] = useState(name || "");
    
    // Update editedName when name prop changes
    useEffect(() => {
        setEditedName(name || "");
    }, [name]);
    
    const handleKeyPress = (event) => {
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
                        <p>
                            Welcome,{" "}
                            {user?.isAnonymous ? "Anonymous User" : user?.email || "User"}
                        </p>
                    </header>
                </div>
                {!edit ? (
                    <h6 onClick={handleClick} style={{ cursor: 'pointer' }}>
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
            </div>
        </>
    );
}

export default TopBar;
