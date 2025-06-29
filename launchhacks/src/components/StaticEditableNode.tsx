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
    label?: string;
    myColor?: string;
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

    const { getNodes } = useReactFlow();
    const { handleTokenClick } = useTokenInteraction();

    // Parse text into tokens
    const tokens = useMemo(() => parseTextIntoTokens(text), [text]);

    // Helper to get token color by concept
    const getTokenColor = useCallback(
        (token: Token) => {
            const concept = token.myConcept || token.word;
            return data.tokenColors?.[concept];
        },
        [data.tokenColors]
    );

    // Check if token is clickable (not already colored)
    const isTokenClickable = useCallback(
        (token: Token) => {
            return !getTokenColor(token);
        },
        [getTokenColor]
    );

    // Token click handler
    const handleTokenClickLocal = useCallback(
        (token: Token, e: React.MouseEvent) => {
            e.stopPropagation();

            if (!isTokenClickable(token)) {
                console.log("Token already colored, ignoring click");
                return;
            }

            console.log("Static Token clicked:", token);

            // Get current node info
            const currentNodes = getNodes();
            const currentNode = currentNodes.find((node) => node.id === id);
            if (!currentNode) {
                console.error("Current node not found");
                return;
            }

            // Use the context handler
            handleTokenClick(
                token,
                id,
                currentNode.position,
                currentNode.type || "staticEditable",
                data.myColor
            );
        },
        [id, getNodes, handleTokenClick, data.myColor, isTokenClickable]
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

        return (
            <div className="node-content-word">
                <div onClick={handleClick}>
                    {tokens.map((token, index) => {
                        const concept = token.myConcept || token.word;
                        const tokenColor = data.tokenColors?.[concept];
                        const isClickable = isTokenClickable(token);

                        return (
                            <span
                                key={index}
                                className={`word-token ${
                                    !isClickable ? "disabled" : ""
                                }`}
                                style={{
                                    backgroundColor: tokenColor,
                                    color: tokenColor ? tokenColor : undefined,
                                    cursor: isClickable ? "pointer" : "default",
                                    padding: tokenColor ? "2px 4px" : "1px 3px",
                                    borderRadius: "4px",
                                    margin: "1px",
                                    display: "inline-block",
                                    opacity: isClickable ? 1 : 0.7,
                                    border:
                                        token.myConcept && !tokenColor
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
        text,
        isExpanded,
        tokens,
        data.tokenColors,
        handleClick,
        handleSave,
        handleKeyPress,
        handleInputClick,
        toggleExpansion,
        handleTokenClickLocal,
        getTokenColor,
        isTokenClickable,
    ]);

    return (
        <div
            className="static-editable-node nodrag"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{
                backgroundColor: data.myColor,
                color: data.myColor
                    ? getContrastColor(data.myColor)
                    : undefined,
                border: data.myColor
                    ? `2px solid ${darkenColor(data.myColor, 20)}`
                    : undefined,
            }}
        >
            <Handle type="target" position={Position.Bottom} id="bottom" />

            {showTooltip && (
                <div className="node-tooltip">
                    <div className="tooltip-content">
                        <span>📍 Static Node</span>
                        <span>Click to edit text</span>
                        <span>Click words to create connections</span>
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
