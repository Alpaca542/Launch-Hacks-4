import { useState, useMemo, useCallback } from "react";
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
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [showExplanation, setShowExplanation] = useState<boolean>(false);

    const { handleTokenClick } = useTokenInteraction();

    // Parse text into tokens
    const tokens = useMemo(() => parseTextIntoTokens(summary), [summary]);

    // Token click handler - optimized to avoid repeated getNodes() calls
    const handleTokenClickLocal = useCallback(
        (token: Token, e: React.MouseEvent) => {
            e.stopPropagation();

            console.log("Static Token clicked:", token);

            // Use the context handler with minimal node info
            // We don't need to get all nodes just for position and type
            handleTokenClick(
                token,
                id,
                { x: 0, y: 0 }, // Position will be updated by the context handler
                "staticEditable",
                data.myColor
            );
        },
        [id, handleTokenClick, data.myColor]
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

    // Memoize token rendering separately for better performance
    const tokenElements = useMemo(() => {
        return tokens.map((token, index) => {
            const isClickable = true; // All tokens are clickable

            return (
                <span
                    key={index}
                    className={`word-token ${!isClickable ? "disabled" : ""} ${
                        token.myConcept ? "concept-highlight" : ""
                    }`}
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
    }, [tokens, handleTokenClickLocal]);

    // Memoize node buttons separately
    const nodeButtons = useMemo(
        () => (
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
        ),
        [tokens.length, toggleExpansion, isExpanded, handleShowExplanation]
    );

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
                    {tokenElements}
                    {tokens.length > 5 && !isExpanded && (
                        <span className="token-truncation">...</span>
                    )}
                </div>
                {nodeButtons}
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
