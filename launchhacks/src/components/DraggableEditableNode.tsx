import { useState, useMemo, useCallback, useEffect } from "react";
import { useReactFlow, Handle, Position } from "reactflow";
import "./EditableNode.css";
import { useTokenInteraction } from "../contexts/TokenInteractionContext";
import LoadingSpinner from "./LoadingSpinner";
import {
    getContrastColor,
    darkenColor,
    parseTextIntoTokens,
    Token,
} from "../utils/nodeHelpers";

interface NodeData {
    label?: string;
    title?: string;
    suggestions?: string[];
    myColor?: string;
    summary?: string;
    full_text?: string;
    onExpand?: () => void;
    expanded?: boolean;
    isLoading?: boolean;
    loadingElement?: React.ReactElement;
    tokenColors?: { [key: string]: string };
    previousNode?: string; // ID of the node that created this one
}

interface DraggableEditableNodeProps {
    data: NodeData;
    id: string;
}

function DraggableEditableNode({ data, id }: DraggableEditableNodeProps) {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [summary, setSummary] = useState<string>(
        data.summary || data.label || "Draggable Node"
    );
    const [isExpanded, setIsExpanded] = useState<boolean>(
        data.expanded || false
    );

    const { getNodes, getNode, setViewport } = useReactFlow();
    const { handleTokenClick, showExplanation } = useTokenInteraction();

    // Sync local state with prop changes (e.g., when AI response updates data)
    useEffect(() => {
        if (!isEditing) {
            setSummary(data.summary || data.label || "Draggable Node");
        }
    }, [data.summary, data.label, isEditing]);

    // Parse text into tokens
    const tokens = useMemo(() => parseTextIntoTokens(summary), [summary]);

    // Display tokens based on expansion state
    const displayTokens = useMemo(() => {
        if (isExpanded || tokens.length <= 5) {
            return tokens;
        }
        return tokens.slice(0, 5);
    }, [tokens, isExpanded]);

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
            const color = handleTokenClick(
                token,
                id,
                currentNode.position,
                currentNode.type || "draggableEditable",
                data.myColor,
                data.summary || data.label || "Draggable Node"
            );
            return color; // Can be null if token is already colored
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
                setSummary(data.summary || data.label || "Draggable Node");
                setIsEditing(false);
            }
        },
        [handleSave, data.summary, data.label]
    );

    const toggleExpansion = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
            if (!isExpanded && data.onExpand) {
                data.onExpand();
            }
        },
        [isExpanded, data.onExpand]
    );

    const handleShowExplanation = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (showExplanation) {
                showExplanation(
                    summary,
                    data.full_text || "No detailed information available."
                );
            }
        },
        [showExplanation, summary, data.full_text]
    );

    // Navigate to previous node
    const navigateToPreviousNode = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (data.previousNode) {
                const previousNode = getNode(data.previousNode);
                if (previousNode) {
                    const { x, y } = previousNode.position;
                    // Center the viewport on the previous node with smooth animation
                    setViewport(
                        { x: -x + 200, y: -y + 100, zoom: 1 },
                        { duration: 500 }
                    );
                }
            }
        },
        [data.previousNode, getNode, setViewport]
    );

    // Group tokens by concept for blue outline
    const groupedTokens = useMemo(() => {
        const groups: { [concept: string]: Token[] } = {};
        displayTokens.forEach((token) => {
            const concept = token.myConcept || token.word;
            if (!groups[concept]) {
                groups[concept] = [];
            }
            groups[concept].push(token);
        });
        return groups;
    }, [displayTokens]);

    const renderContent = useMemo(() => {
        // Show loading spinner if node is loading
        if (data.isLoading) {
            return (
                <div className="node-loading-content">
                    <LoadingSpinner
                        size="small"
                        color={data.myColor || "#4f86f7"}
                    />
                    <span className="loading-text">Loading concept...</span>
                </div>
            );
        }

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
            <div className="node-layout">
                <div className="node-header">
                    <div className="node-title">{data.title || "Node"}</div>
                    <div className="node-buttons">
                        {data.previousNode && (
                            <button
                                className="node-expand-btn previous-node-btn"
                                onClick={navigateToPreviousNode}
                                title="Go to previous node"
                            >
                                ←
                            </button>
                        )}
                        {tokens.length > 5 && (
                            <button
                                className="node-expand-btn"
                                onClick={toggleExpansion}
                                title={isExpanded ? "Show less" : "Show more"}
                            >
                                {isExpanded ? "−" : "+"}
                            </button>
                        )}
                        <button
                            className="node-expand-btn explanation-btn-icon"
                            onClick={handleShowExplanation}
                            title="Show full text"
                        >
                            📄
                        </button>
                    </div>
                </div>
                <div className="node-main-content">
                    <div className="node-summary-section">
                        <div
                            className="node-summary-text"
                            onClick={handleClick}
                        >
                            {displayTokens.map((token, index) => {
                                const tokenColors = data.tokenColors || {};
                                const tokenKey = token.myConcept || token.word;
                                const tokenColor = tokenColors[tokenKey];
                                const isClickable =
                                    isTokenClickable() && !tokenColor; // Not clickable if already colored

                                return (
                                    <span
                                        key={index}
                                        className={`word-token ${
                                            !isClickable ? "disabled" : ""
                                        } ${
                                            token.myConcept
                                                ? "concept-highlight"
                                                : ""
                                        }`}
                                        style={{
                                            backgroundColor:
                                                tokenColor || "transparent",
                                            color: tokenColor
                                                ? getContrastColor(tokenColor)
                                                : "inherit",
                                            border: tokenColor
                                                ? `1px solid ${darkenColor(
                                                      tokenColor,
                                                      20
                                                  )}`
                                                : "",
                                        }}
                                        onClick={(e) =>
                                            isClickable
                                                ? handleTokenClickLocal(
                                                      token,
                                                      e
                                                  )
                                                : e.stopPropagation()
                                        }
                                    >
                                        {token.word}
                                        {index < displayTokens.length - 1
                                            ? " "
                                            : ""}
                                    </span>
                                );
                            })}
                            {tokens.length > 5 && !isExpanded && (
                                <span className="token-truncation">...</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="node-suggestions-section">
                    <div className="node-suggestions-header">Suggestions</div>
                    <div className="node-suggestions-list">
                        {data.suggestions && data.suggestions.length > 0 ? (
                            data.suggestions.map((suggestion, index) => {
                                const tokenColors = data.tokenColors || {};
                                const tokenColor = tokenColors[suggestion];
                                const isClickable =
                                    isTokenClickable() && !tokenColor;

                                return (
                                    <span
                                        key={index}
                                        className={`suggestion-token ${
                                            !isClickable ? "disabled" : ""
                                        }`}
                                        style={{
                                            backgroundColor:
                                                tokenColor || "transparent",
                                            color: tokenColor
                                                ? getContrastColor(tokenColor)
                                                : "inherit",
                                            border: tokenColor
                                                ? `1px solid ${darkenColor(
                                                      tokenColor,
                                                      20
                                                  )}`
                                                : "",
                                        }}
                                        onClick={(e) =>
                                            isClickable
                                                ? handleTokenClickLocal(
                                                      {
                                                          word: suggestion,
                                                          myConcept: suggestion,
                                                          suggestionId:
                                                              data.label +
                                                              suggestion +
                                                              index,
                                                      },
                                                      e
                                                  )
                                                : e.stopPropagation()
                                        }
                                    >
                                        {suggestion}
                                        <Handle
                                            type="source"
                                            position={Position.Bottom}
                                            id={data.label + suggestion + index}
                                        />
                                    </span>
                                );
                            })
                        ) : (
                            <div className="node-suggestions-empty">
                                No suggestions
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }, [
        isEditing,
        summary,
        displayTokens,
        tokens,
        isExpanded,
        groupedTokens,
        handleClick,
        handleSave,
        handleKeyPress,
        handleInputClick,
        toggleExpansion,
        handleShowExplanation,
        handleTokenClickLocal,
        isTokenClickable,
        data.previousNode,
        navigateToPreviousNode,
        data.tokenColors,
        data.myColor,
        data.isLoading,
    ]);

    return (
        <div
            className="draggable-editable-node"
            style={{
                background: data.myColor,
                color: data.myColor ? getContrastColor(data.myColor) : "",
                border: data.myColor
                    ? `2px solid ${darkenColor(data.myColor, 20)}`
                    : "",
            }}
        >
            <div className="node-content">{renderContent}</div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
            />
            <Handle type="target" position={Position.Top} id="top-target" />
            <Handle type="source" position={Position.Left} id="left-source" />
            <Handle type="target" position={Position.Left} id="left-target" />
            <Handle type="source" position={Position.Right} id="right-source" />
            <Handle type="target" position={Position.Right} id="right-target" />
        </div>
    );
}

export default DraggableEditableNode;
