import { useState, useMemo, useCallback } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import "./EditableNode.css";
import { useTokenInteraction } from "../contexts/TokenInteractionContext";
import {
    getContrastColor,
    darkenColor,
    parseTextIntoTokens,
    Token,
} from "../utils/nodeHelpers";

interface NodeData {
    title?: string;
    summary?: string;
    full_text?: string;
    myColor?: string;
}

interface DraggableEditableNodeProps {
    data: NodeData;
    id: string;
}

function DraggableEditableNode({ data, id }: DraggableEditableNodeProps) {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [summary, setSummary] = useState<string>(data.summary || "Draggable Node");
    const [title] = useState<string>(data.title || "");
    const [fullText] = useState<string>(data.full_text || "");
    const [showTooltip, setShowTooltip] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const { getNodes } = useReactFlow();
    const { handleTokenClick } = useTokenInteraction();

    // Parse text into tokens
    const tokens = useMemo(() => parseTextIntoTokens(summary), [summary]);

    // Check if token is clickable
    const isTokenClickable = useCallback(() => {
        return true; // All tokens are clickable now
    }, []);

    // Token click handler
    const handleTokenClickLocal = useCallback(
        (token: Token, e: React.MouseEvent) => {
            e.stopPropagation();

            // Get current node info
            const currentNodes = getNodes();
            const currentNode = currentNodes.find((node) => node.id === id);
            if (!currentNode) {
                return;
            }

            // Use the context handler
            let color: string = handleTokenClick(
                token,
                id,
                currentNode.position,
                currentNode.type || "draggableEditable",
                data.myColor
            );
            return color;
        },
        [id, getNodes, handleTokenClick, data.myColor]
    );

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    }, []);

    const handleSave = useCallback(() => {
        setIsEditing(false);
    }, []);

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
                setSummary(data.summary || "Draggable Node");
                setIsEditing(false);
            }
        },
        [handleSave, data.summary]
    );

    const toggleExpansion = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
        },
        [isExpanded]
    );

    // Group tokens by concept for blue outline
    const groupedTokens = useMemo(() => {
        const groups: { [concept: string]: Token[] } = {};
        tokens.forEach((token) => {
            const concept = token.myConcept || token.word;
            if (!groups[concept]) {
                groups[concept] = [];
            }
            groups[concept].push(token);
        });
        return groups;
    }, [tokens]);

    const renderContent = useMemo(() => {
        if (isEditing) {
            return (
                <input
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyPress}
                    onClick={handleInputClick}
                    className="node-input nodrag"
                    autoFocus
                />
            );
        }

        return (
            <div className="node-content-word">
                <div onClick={handleClick}>
                    {tokens.map((token, index) => {
                        const isClickable = isTokenClickable();

                        return (
                            <span
                                key={index}
                                className={`word-token ${
                                    !isClickable ? "disabled" : ""
                                }`}
                                style={{
                                    cursor: isClickable ? "pointer" : "default",
                                    padding: "1px 3px",
                                    borderRadius: "4px",
                                    margin: "1px",
                                    display: "inline-block",
                                    opacity: isClickable ? 1 : 0.7,
                                    border: token.myConcept
                                        ? "2px solid #4A90E2"
                                        : undefined,
                                }}
                                onClick={(e) =>
                                    isClickable
                                        ? handleTokenClickLocal(token, e)
                                        : e.stopPropagation()
                                }
                            >
                                {token.word}
                                {index < tokens.length - 1 ? " " : ""}
                            </span>
                        );
                    })}
                    {tokens.length > 5 && !isExpanded && <span>...</span>}
                </div>
                {tokens.length > 5 && (
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
    }, [
        isEditing,
        summary,
        isExpanded,
        tokens,
        groupedTokens,
        handleClick,
        handleSave,
        handleKeyPress,
        handleInputClick,
        toggleExpansion,
        handleTokenClickLocal,
        isTokenClickable,
    ]);

    return (
        <div
            className="draggable-editable-node"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{
                background: data.myColor,
                color: data.myColor
                    ? getContrastColor(data.myColor)
                    : undefined,
                border: data.myColor
                    ? `2px solid ${darkenColor(data.myColor, 20)}`
                    : undefined,
            }}
        >
            {showTooltip && (
                <div className="node-tooltip">
                    <div className="tooltip-content">
                        <span>🎯 Draggable Node</span>
                        <span>Drag me around!</span>
                        <span>Click to edit text</span>
                        <span>Click words to create connections</span>
                    </div>
                </div>
            )}

            <div className="node-content">{renderContent}</div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
            />
        </div>
    );
}

export default DraggableEditableNode;
