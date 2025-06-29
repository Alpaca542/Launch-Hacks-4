import { useState, useMemo, useCallback } from "react";
import { useReactFlow } from "reactflow";
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
    onExpand?: () => void;
    expanded?: boolean;
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
    const [showExplanation, setShowExplanation] = useState<boolean>(false);

    const { getNodes } = useReactFlow();
    const { handleTokenClick } = useTokenInteraction();

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

    const handleShowExplanation = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setShowExplanation(true);
    }, []);

    const handleHideExplanation = useCallback(() => {
        setShowExplanation(false);
    }, []);

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
                    {displayTokens.map((token, index) => {
                        const isClickable = isTokenClickable();

                        return (
                            <span
                                key={index}
                                className={`word-token ${
                                    !isClickable ? "disabled" : ""
                                } ${
                                    token.myConcept ? "concept-highlight" : ""
                                }`}
                                onClick={(e) =>
                                    isClickable
                                        ? handleTokenClickLocal(token, e)
                                        : e.stopPropagation()
                                }
                            >
                                {token.word}
                                {index < displayTokens.length - 1 ? " " : ""}
                            </span>
                        );
                    })}
                    {tokens.length > 5 && !isExpanded && (
                        <span className="token-truncation">...</span>
                    )}
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
                        className="node-expand-btn explanation-btn-icon"
                        onClick={handleShowExplanation}
                        title="Show full text"
                    >
                        📄
                    </button>
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
    ]);

    return (
        <div
            className="draggable-editable-node"
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
            <div className="node-content">{renderContent}</div>

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

export default DraggableEditableNode;
