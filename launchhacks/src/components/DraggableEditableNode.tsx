import { useState, useEffect, useMemo } from "react";
import { useReactFlow, Handle, Position } from "reactflow";
import { useTokenInteraction } from "../contexts/TokenInteractionContext";
import LoadingSpinner from "./LoadingSpinner";

import { darkenColor, parseTextIntoTokens, Token } from "../utils/nodeHelpers";

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

    const { getNodes, getNode, setViewport } = useReactFlow();
    const { handleTokenClick, showExplanation } = useTokenInteraction();

    // Sync local state with prop changes (e.g., when AI response updates data)
    useEffect(() => {
        if (!isEditing) {
            setSummary(data.summary || data.label || "Draggable Node");
        }
    }, [data.summary, data.label, isEditing]);

    // Parse text into tokens
    const tokens = parseTextIntoTokens(summary);

    // Display tokens based on expansion state
    const displayTokens = (() => {
        return tokens;
    })();

    // Check if token is clickable
    const isTokenClickable = () => {
        return true; // All tokens are clickable now
    };

    // Token click handler
    const handleTokenClickLocal = (token: Token, e: React.MouseEvent) => {
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
            setSummary(data.summary || data.label || "Draggable Node");
            setIsEditing(false);
        }
    };

    const handleShowExplanation = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (showExplanation) {
            showExplanation(
                data.title!,
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
    function getContrastTextColor(hexColor: string): "#000000" | "#ffffff" {
        // Remove leading "#" if present
        const hex = hexColor.replace(/^#/, "");

        // Parse R, G, B values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Convert to relative luminance
        const [R, G, B] = [r, g, b].map((v) => {
            const channel = v / 255;
            return channel <= 0.03928
                ? channel / 12.92
                : Math.pow((channel + 0.055) / 1.055, 2.4);
        });

        const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;

        // Return black or white depending on brightness
        return luminance > 0.179 ? "#000000" : "#ffffff";
    }

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
                    className="w-full bg-gray-700/50 border border-white/15 rounded-lg px-4 py-3 text-gray-100 
                             placeholder-gray-500 focus:outline-none focus:border-blue-500/60 focus:bg-gray-600/50 
                             focus:ring-2 focus:ring-blue-500/25 transition-all duration-200 nodrag"
                    placeholder="Enter node content..."
                    autoFocus
                />
            );
        }

        return (
            <>
                {data.isLoading && (
                    <div className="flex items-center justify-center gap-2 py-5">
                        <LoadingSpinner
                            size="small"
                            color={data.myColor || "#6366f1"}
                        />
                        <span className="text-slate-400 text-sm">
                            Loading concept...
                        </span>
                    </div>
                )}
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
                            className="cursor-text leading-relaxed break-words"
                            onClick={handleClick}
                        >
                            {displayTokens.map((token, index) => {
                                const tokenColors = data.tokenColors || {};
                                const tokenKey = token.myConcept || token.word;
                                const tokenColor = tokenColors[tokenKey];
                                const isClickable =
                                    isTokenClickable() && !tokenColor;

                                return (
                                    <span
                                        key={index}
                                        className={`inline-block px-1 py-0.5 m-0.5 rounded-lg font-medium transition-all duration-300 ease-out
                                                  ${
                                                      isClickable
                                                          ? "cursor-pointer hover:bg-blue-500/20 hover:border-blue-500/40 hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
                                                          : "cursor-not-allowed opacity-70"
                                                  } 
                                                  ${
                                                      token.myConcept
                                                          ? "bg-blue-500/10 border border-blue-500/30 shadow-md"
                                                          : "border border-transparent hover:border-blue-500/30"
                                                  }`}
                                        style={{
                                            backgroundColor:
                                                tokenColor || "transparent",
                                            color: tokenColor
                                                ? getContrastTextColor(
                                                      tokenColor
                                                  )
                                                : getContrastTextColor(
                                                      data.myColor!
                                                  ), //TODO: fix
                                            border: tokenColor
                                                ? `1px solid ${darkenColor(
                                                      tokenColor,
                                                      20
                                                  )}`
                                                : "",
                                            boxShadow: tokenColor
                                                ? `0 0 0 1px ${tokenColor}25`
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
                                    const isClickable =
                                        isTokenClickable() && !tokenColor;

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
                                                    ? getContrastTextColor(
                                                          tokenColor
                                                      )
                                                    : getContrastTextColor(
                                                          data.myColor!
                                                      ),
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
                                                              myConcept:
                                                                  suggestion,
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
                                                id={
                                                    data.label +
                                                    suggestion +
                                                    index
                                                }
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
            </>
        );
    }, [
        isEditing,
        summary,
        displayTokens,
        tokens,
        groupedTokens,
        handleClick,
        handleSave,
        handleKeyPress,
        handleInputClick,
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
            className="bg-[#202023] border border-white/[0.12] rounded-2xl p-5 min-w-[280px] max-w-[600px] 
                       transition-all duration-200 ease-in-out cursor-grab select-none overflow-hidden
                       hover:transform hover:-translate-y-[3px]
                       hover:border-white/[0.18] hover:bg-[#242427]"
            style={{
                background: data.myColor,
                color: data.myColor
                    ? getContrastTextColor(data.myColor)
                    : "#f0f4f8",
                border: data.myColor
                    ? `1px solid ${darkenColor(data.myColor, 20)}`
                    : "1px solid rgba(255, 255, 255, 0.12)",
            }}
        >
            <div className="relative pointer-events-auto text-[#f0f4f8] text-[17px] leading-[1.7] font-medium">
                {renderContent}
            </div>
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
