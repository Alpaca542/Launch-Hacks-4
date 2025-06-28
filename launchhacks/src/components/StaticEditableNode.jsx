import { useState } from "react";
import { Handle, Position } from "reactflow";
import "./EditableNode.css";

function StaticEditableNode({ data, id }) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(data.label || "Static Node");
    const [showTooltip, setShowTooltip] = useState(false);

    const handleClick = (e) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleSave = () => {
        setIsEditing(false);
        console.log("Static node text changed to:", text);
    };

    const handleInputClick = (e) => {
        e.stopPropagation();
    };

    const handleKeyPress = (e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
            handleSave();
        }
        if (e.key === "Escape") {
            setText(data.label || "Static Node");
            setIsEditing(false);
        }
    };

    return (
        <div
            className="static-editable-node nodrag"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <Handle type="target" position={Position.Bottom} id="bottom" />

            {showTooltip && (
                <div className="node-tooltip">
                    <div className="tooltip-content">
                        <span>📍 Static Node</span>
                        <span>Click to edit text</span>
                    </div>
                </div>
            )}

            {isEditing ? (
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyPress}
                    onClick={handleInputClick}
                    className="node-input nodrag"
                    autoFocus
                />
            ) : (
                <div className="node-text">{text}</div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
            />
        </div>
    );
}

export default StaticEditableNode;
