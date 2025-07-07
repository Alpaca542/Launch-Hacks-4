import { useState, useEffect, useMemo } from "react";
import "./EditableNode.css";
import { useTokenInteraction } from "../contexts/TokenInteractionContext";
import LoadingSpinner from "./LoadingSpinner";
import { useReactFlow, Handle, Position } from "reactflow";
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
    isLoading?: boolean;
    tokenColors?: { [key: string]: string };
    previousNode?: string; // ID of the node that created this one
}

interface StaticEditableNodeProps {
    data: NodeData;
    id: string;
}

function StaticEditableNode({ data, id }: StaticEditableNodeProps) {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [summary, setSummary] = useState<string>(
        data.summary || data.label || "Static Node"
    );
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const { handleTokenClick, showExplanation } = useTokenInteraction();
    const { getNode, setViewport } = useReactFlow();

    // Sync local state with prop changes (e.g., when AI response updates data)
    useEffect(() => {
        if (!isEditing) {
            setSummary(data.summary || data.label || "Static Node");
        }
    }, [data.summary, data.label, isEditing]);

    // Parse text into tokens
    const tokens = parseTextIntoTokens(summary);

    // Token click handler - optimized to avoid repeated getNodes() calls
    const handleTokenClickLocal = (token: Token, e: React.MouseEvent) => {
        e.stopPropagation();

        console.log("Static Token clicked:", token);

        // Use the context handler with minimal node info
        // We don't need to get all nodes just for position and type
        handleTokenClick(
            token,
            id,
            { x: 0, y: 0 }, // Position will be updated by the context handler
            "staticEditable",
            data.myColor,
            data.summary || data.label || "Draggable Node",
            token.suggestionId
        );
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleSave = () => {
        setIsEditing(false);
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
            setSummary(data.summary || data.label || "Static Node");
            setIsEditing(false);
        }
    };

    const toggleExpansion = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleShowExplanation = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (showExplanation) {
            showExplanation(
                data.title || "Explanation",
                data.full_text || "No detailed information available."
            );
        }
    };

    // Navigate to previous node
    const navigateToPreviousNode = (e: React.MouseEvent) => {
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
    };

    // Memoize token rendering separately for better performance
    const tokenElements = (() => {
        const tokenColors = data.tokenColors || {};

        return tokens.map((token, index) => {
            const tokenKey = token.myConcept || token.word;
            const tokenColor = tokenColors[tokenKey];
            const isClickable = !tokenColor; // Not clickable if already colored

            return (
                <span
                    key={index}
                    className={`word-token ${!isClickable ? "disabled" : ""} ${
                        token.myConcept ? "concept-highlight" : ""
                    }`}
                    style={{
                        backgroundColor: tokenColor || "transparent",
                        color: tokenColor
                            ? data.myColor || "#ffffff"
                            : "inherit",
                        border: tokenColor ? `1px solid ${tokenColor}` : "",
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
        });
    })();

    // Memoize node buttons separately
    const nodeButtons = (
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
    );

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
                            {tokenElements}
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
                                const isClickable = !tokenColor;

                                return (
                                    <span
                                        key={index}
                                        className={`word-token ${
                                            !isClickable ? "disabled" : ""
                                        }`}
                                        style={{
                                            backgroundColor:
                                                tokenColor || "transparent",
                                            color: tokenColor
                                                ? data.myColor || "#ffffff"
                                                : "inherit",
                                            border: tokenColor
                                                ? `1px solid ${tokenColor}`
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
                                        {index < data.suggestions!.length - 1
                                            ? " "
                                            : ""}
                                        <Handle
                                            type="source"
                                            position={Position.Right}
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
        isExpanded,
        tokens.length,
        handleClick,
        handleSave,
        handleKeyPress,
        handleInputClick,
        tokenElements,
        nodeButtons,
    ]);

    return (
        <div
            className="static-editable-node nodrag"
            style={{
                backgroundColor: data.myColor,
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
            <Handle
                type="target"
                position={Position.Bottom}
                id="bottom-target"
            />
        </div>
    );
}

export default StaticEditableNode;
