import { useState } from "react";
import { Handle, Position } from "reactflow";
import "./EditableNode.css";

function DraggableEditableNode({ data, id }) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(data.label || "Draggable Node");
    const [showTooltip, setShowTooltip] = useState(false);

    const handleClick = (e) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleSave = () => {
        setIsEditing(false);
        console.log("Draggable node text changed to:", text);
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
            setText(data.label || "Draggable Node");
            setIsEditing(false);
        }
    };

    return (
        <div
            className="draggable-editable-node"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Multiple handles for many-to-many connections */}
            <Handle type="target" position={Position.Top} id="top" />
            <Handle type="target" position={Position.Left} id="left" />
            <Handle type="target" position={Position.Right} id="right" />
            <Handle type="target" position={Position.Bottom} id="bottom" />

            {showTooltip && (
                <div className="node-tooltip">
                    <div className="tooltip-content">
                        <span>🎯 Draggable Node</span>
                        <span>Drag me around!</span>
                        <span>Click to edit text</span>
                    </div>
                </div>
            )}

            <div className="node-content" onClick={handleClick}>
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
            </div>

            {/* Multiple source handles for many-to-many connections */}
            <Handle type="source" position={Position.Top} id="top-source" />
            <Handle type="source" position={Position.Left} id="left-source" />
            <Handle type="source" position={Position.Right} id="right-source" />
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
            />
        </div>
    );
}

export default DraggableEditableNode;
