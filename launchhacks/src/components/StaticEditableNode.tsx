import { useState, useEffect, useMemo } from "react";
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
                    className={`inline-block px-2 py-1 m-0.5 rounded-lg font-medium transition-all duration-300 ease-out
                              ${
                                  isClickable
                                      ? "cursor-pointer hover:bg-blue-500/20 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
                                      : "cursor-not-allowed opacity-70"
                              } 
                              ${
                                  token.myConcept
                                      ? "bg-blue-500/10 border border-blue-500/30 shadow-md"
                                      : "border border-transparent hover:border-blue-500/30"
                              }`}
                    style={{
                        backgroundColor: tokenColor || "transparent",
                        color: tokenColor
                            ? data.myColor || "#ffffff"
                            : "inherit",
                        border: tokenColor ? `1px solid ${tokenColor}` : "",
                        boxShadow: tokenColor
                            ? `0 0 0 1px ${tokenColor}25`
                            : "",
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
                <div className="flex items-center justify-center gap-2 py-8">
                    <LoadingSpinner
                        size="small"
                        color={data.myColor || "#6366f1"}
                    />
                    <span className="text-slate-400 text-sm">
                        Loading concept...
                    </span>
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
                    className="w-full bg-gray-700/50 border border-white/15 rounded-lg px-4 py-3 text-gray-100 
                             placeholder-gray-500 focus:outline-none focus:border-blue-500/60 focus:bg-gray-600/50 
                             focus:ring-2 focus:ring-blue-500/25 transition-all duration-200 nodrag"
                    placeholder="Enter node content..."
                    autoFocus
                />
            );
        }

        return (
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <div className="text-base font-semibold text-gray-100">
                        {data.title || "Node"}
                    </div>
                    <div className="flex gap-2">
                        {data.previousNode && (
                            <button
                                className="w-8 h-8 bg-gray-500/25 text-gray-400 border border-gray-500/35 rounded-lg 
                                         hover:bg-gray-500/35 hover:border-gray-500/55 hover:-translate-y-0.5 
                                         transition-all duration-150 flex items-center justify-center text-sm font-semibold"
                                onClick={navigateToPreviousNode}
                                title="Go to previous node"
                            >
                                ←
                            </button>
                        )}
                        {tokens.length > 5 && (
                            <button
                                className="w-8 h-8 bg-blue-500/25 text-blue-400 border border-blue-500/35 rounded-lg 
                                         hover:bg-blue-500/35 hover:border-blue-500/55 hover:-translate-y-0.5 
                                         transition-all duration-150 flex items-center justify-center text-sm font-semibold"
                                onClick={toggleExpansion}
                                title={isExpanded ? "Show less" : "Show more"}
                            >
                                {isExpanded ? "−" : "+"}
                            </button>
                        )}
                        <button
                            className="w-8 h-8 bg-blue-500/25 text-blue-400 border border-blue-500/35 rounded-lg 
                                     hover:bg-blue-500/35 hover:border-blue-500/55 hover:-translate-y-0.5 
                                     transition-all duration-150 flex items-center justify-center text-sm"
                            onClick={handleShowExplanation}
                            title="Show full text"
                        >
                            📄
                        </button>
                    </div>
                </div>
                <div className="flex-1">
                    <div
                        className="cursor-text leading-relaxed break-words text-lg font-medium"
                        onClick={handleClick}
                    >
                        {tokenElements}
                        {tokens.length > 5 && !isExpanded && (
                            <span className="text-slate-500 font-normal">
                                ...
                            </span>
                        )}
                    </div>
                </div>
                <div className="mt-2">
                    <div className="text-sm font-semibold text-slate-400 mb-1.5">
                        Suggestions
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {data.suggestions && data.suggestions.length > 0 ? (
                            data.suggestions.map((suggestion, index) => {
                                const tokenColors = data.tokenColors || {};
                                const tokenColor = tokenColors[suggestion];
                                const isClickable = !tokenColor;

                                return (
                                    <span
                                        key={index}
                                        className={`inline-block px-2 py-1 m-0.5 rounded-md text-sm 
                                                  bg-white/5 border border-white/10 transition-all duration-200 
                                                  ${
                                                      isClickable
                                                          ? "cursor-pointer hover:bg-blue-500/20 hover:border-blue-500/40"
                                                          : "cursor-not-allowed opacity-70"
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
                            <div className="text-slate-500 italic text-sm">
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
            className="bg-[#1a1a1d] border border-white/[0.1] rounded-[20px] p-7 min-w-[320px] max-w-[500px] 
                       shadow-[0_14px_36px_rgba(0,0,0,0.6),0_2px_6px_rgba(0,0,0,0.8)] 
                       transition-all duration-150 ease-in-out cursor-pointer select-none overflow-hidden
                       opacity-[0.98] border-b-[3px] border-b-white/[0.06]
                       hover:opacity-100 hover:bg-[#28282c] hover:border-white/[0.2] 
                       hover:transform hover:scale-[1.03] hover:shadow-[0_14px_36px_rgba(0,0,0,0.6),0_4px_8px_rgba(0,0,0,0.8)]"
            style={{
                backgroundColor: data.myColor,
                color: data.myColor
                    ? getContrastColor(data.myColor)
                    : "#f8faff",
                border: data.myColor
                    ? `1px solid ${darkenColor(data.myColor, 20)}`
                    : "1px solid rgba(255, 255, 255, 0.1)",
            }}
        >
            <div className="relative pointer-events-auto text-[#f8faff] text-[18px] leading-[1.7] font-semibold">
                {renderContent}
            </div>
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
