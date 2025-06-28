import { useState, useMemo, useCallback } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import "./EditableNode.css";
import { useMode } from "../contexts/ModeContext";
import WordToken from "./WordToken";
import ConceptToken from "./ConceptToken";
import { getContrastColor, darkenColor } from "../utils/nodeHelpers";

interface NodeData {
    label?: string;
    color?: string;
    tokenColors?: { [key: string]: string };
}

interface StaticEditableNodeProps {
    data: NodeData;
    id: string;
}

function StaticEditableNode({ data, id }: StaticEditableNodeProps) {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [text, setText] = useState<string>(data.label || "Static Node");
    const [showTooltip, setShowTooltip] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const { mode } = useMode();
    const reactFlowInstance = useReactFlow();

    // Get current node position
    const currentNode = reactFlowInstance.getNode(id);
    const nodePosition = currentNode?.position || { x: 0, y: 0 };

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    }, []);

    const handleSave = useCallback(() => {
        setIsEditing(false);
        console.log("Static node text changed to:", text);
    }, [text]);

    const handleInputClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === "Enter") {
                handleSave();
            }
            if (e.key === "Escape") {
                setText(data.label || "Static Node");
                setIsEditing(false);
            }
        },
        [handleSave, data.label]
    );

    const toggleExpansion = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
        },
        [isExpanded]
    );

    const renderContent = useMemo(() => {
        if (isEditing) {
            return (
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
            );
        }

        if (mode === "word") {
            const words = text.split(" ").filter((word) => word.trim() !== "");
            const displayWords = isExpanded ? words : words.slice(0, 3);

            return (
                <div className="node-content-word">
                    <div onClick={handleClick}>
                        {displayWords.map((word, index) => (
                            <span
                                key={index}
                                style={{
                                    display: "inline-block",
                                    margin: "2px",
                                }}
                            >
                                <WordToken
                                    value={word}
                                    nodeId={id}
                                    nodePosition={nodePosition}
                                    nodeType="staticEditable"
                                    nodeColor={data.color}
                                    tokenColor={data.tokenColors?.[word]}
                                />
                                {index < displayWords.length - 1 ? " " : ""}
                            </span>
                        ))}
                        {words.length > 3 && !isExpanded && <span>...</span>}
                    </div>
                    {words.length > 3 && (
                        <button
                            className="node-expand-btn"
                            onClick={toggleExpansion}
                            title={isExpanded ? "Show less" : "Show more"}
                        >
                            {isExpanded ? "−" : "+"}
                        </button>
                    )}
                </div>
            );
        } else {
            // Concept mode
            const textParts = text.split("_");

            return (
                <div className="node-content-concept" onClick={handleClick}>
                    {textParts.map((part, index) => {
                        if (index % 2 === 1) {
                            // This is a concept (between underscores)
                            return (
                                <ConceptToken
                                    key={index}
                                    value={part}
                                    nodeId={id}
                                    nodePosition={nodePosition}
                                    nodeType="staticEditable"
                                    nodeColor={data.color}
                                    tokenColor={data.tokenColors?.[part]}
                                />
                            );
                        } else {
                            // This is regular text
                            return <span key={index}>{part}</span>;
                        }
                    })}
                </div>
            );
        }
    }, [
        isEditing,
        text,
        mode,
        isExpanded,
        handleClick,
        handleSave,
        handleKeyPress,
        handleInputClick,
        toggleExpansion,
    ]);

    return (
        <div
            className="static-editable-node nodrag"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{
                backgroundColor: data.color,
                color: data.color ? getContrastColor(data.color) : undefined,
                border: data.color
                    ? `2px solid ${darkenColor(data.color, 20)}`
                    : undefined,
            }}
        >
            <Handle type="target" position={Position.Bottom} id="bottom" />

            {showTooltip && (
                <div className="node-tooltip">
                    <div className="tooltip-content">
                        <span>📍 Static Node</span>
                        <span>
                            Mode: {mode === "word" ? "📝 Word" : "🧠 Concept"}
                        </span>
                        <span>Click to edit text</span>
                    </div>
                </div>
            )}

            {renderContent}

            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
            />
        </div>
    );
}

export default StaticEditableNode;
