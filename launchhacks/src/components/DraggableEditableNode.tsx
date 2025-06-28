import { useState } from "react";
import { Handle, Position } from "reactflow";
import "./EditableNode.css";

interface NodeData {
    label?: string;
}

interface DraggableEditableNodeProps {
    data: NodeData;
    id: string;
}

function DraggableEditableNode({ data, id }: DraggableEditableNodeProps) {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [text, setText] = useState<string>(data.label || "Draggable Node");
    const [showTooltip, setShowTooltip] = useState<boolean>(false);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleSave = () => {
        setIsEditing(false);
        console.log("Draggable node text changed to:", text);
    };

    const handleInputClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
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
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
            />
        </div>
    );
}

export default DraggableEditableNode;
