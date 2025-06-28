import { useState, useMemo, useCallback } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import "./EditableNode.css";
import { useMode } from "../contexts/ModeContext";
import { useTokenInteraction } from "../contexts/TokenInteractionContext";
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
    const { getNodes } = useReactFlow();
    const { handleTokenClick } = useTokenInteraction();

    // Helper to get token color (checks both modes)
    const getTokenColor = useCallback(
        (token: string) => {
            return (
                data.tokenColors?.[token] ||
                data.tokenColors?.[`_${token}_`] ||
                data.tokenColors?.[token.replace(/_/g, "")]
            );
        },
        [data.tokenColors]
    );

    // Simple token click handler
    const handleTokenClickLocal = useCallback(
        (tokenValue: string, e: React.MouseEvent) => {
            e.stopPropagation();
            console.log("Static Token clicked:", tokenValue);

            // Get current node info
            const currentNodes = getNodes();
            const currentNode = currentNodes.find((node) => node.id === id);
            if (!currentNode) {
                console.error("Current node not found");
                return;
            }

            // Use the context handler
            handleTokenClick(
                tokenValue,
                id,
                currentNode.position,
                currentNode.type || "staticEditable",
                data.color
            );
        },
        [id, getNodes, handleTokenClick, data.color]
    );

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
                                className="word-token"
                                style={{
                                    backgroundColor: getTokenColor(word),
                                    color: getTokenColor(word)
                                        ? getContrastColor(getTokenColor(word)!)
                                        : undefined,
                                    cursor: "pointer",
                                    padding: getTokenColor(word)
                                        ? "2px 4px"
                                        : undefined,
                                    borderRadius: getTokenColor(word)
                                        ? "4px"
                                        : undefined,
                                    margin: "1px",
                                    display: "inline-block",
                                }}
                                onClick={(e) => handleTokenClickLocal(word, e)}
                            >
                                {word}
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
                                <span
                                    key={index}
                                    className="concept-token"
                                    style={{
                                        backgroundColor: getTokenColor(part),
                                        color: getTokenColor(part)
                                            ? getContrastColor(
                                                  getTokenColor(part)!
                                              )
                                            : undefined,
                                        cursor: "pointer",
                                        padding: getTokenColor(part)
                                            ? "3px 6px"
                                            : undefined,
                                        borderRadius: getTokenColor(part)
                                            ? "6px"
                                            : undefined,
                                        margin: "2px",
                                        fontWeight: "bold",
                                        display: "inline-block",
                                    }}
                                    onClick={(e) =>
                                        handleTokenClickLocal(part, e)
                                    }
                                >
                                    {part}
                                </span>
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
        handleTokenClickLocal,
        getTokenColor,
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
