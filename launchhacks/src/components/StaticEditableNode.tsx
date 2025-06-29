import { useState, useMemo, useCallback } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import "./EditableNode.css";
import { useTokenInteraction } from "../contexts/TokenInteractionContext";
import ExplanationWindow from "./ExplanationWindow";
import {
    getContrastColor,
    darkenColor,
    parseTextIntoTokens,
    Token,
} from "../utils/nodeHelpers";

interface NodeData {
    label?: string;
    myColor?: string;
    summary?: string;
    full_text?: string;
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
    const [showTooltip, setShowTooltip] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [showExplanation, setShowExplanation] = useState<boolean>(false);

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
                setSummary(data.summary || data.label || "Static Node");
                setIsEditing(false);
            }
        },
        [handleSave, data.summary, data.label]
    );

    const toggleExpansion = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
        },
        [isExpanded]
    );

    const handleShowExplanation = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setShowExplanation(true);
    }, []);

    const handleHideExplanation = useCallback(() => {
        setShowExplanation(false);
    }, []);

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
                <div className="node-buttons">
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
                        className="node-expand-btn"
                        onClick={handleShowExplanation}
                        title="Show full text"
                        style={{ marginLeft: tokens.length > 5 ? "5px" : "0" }}
                    >
                        📄
                    </button>
                </div>
            </div>
        );
    }, [
        isEditing,
        summary,
        isExpanded,
        tokens,
        handleClick,
        handleSave,
        handleKeyPress,
        handleInputClick,
        toggleExpansion,
        handleShowExplanation,
        handleTokenClickLocal,
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
            {renderContent}

            {showExplanation && (
                <ExplanationWindow
                    show={showExplanation}
                    title={summary}
                    text={
                        data.full_text || "No detailed information available."
                    }
                    onHide={handleHideExplanation}
                />
            )}
        </div>
    );
}

export default StaticEditableNode;
