import { useState, useMemo, useCallback } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import "./EditableNode.css";
import { useMode } from "../contexts/ModeContext";
import { 
    generateRandomColor, 
    generateColorVariation, 
    calculateNewNodePosition,
    createNewNode,
    createNewEdge,
    getContrastColor, 
    darkenColor 
} from "../utils/nodeHelpers";

interface NodeData {
    label?: string;
    color?: string;
    tokenColors?: { [key: string]: string };
}

interface DraggableEditableNodeProps {
    data: NodeData;
    id: string;
}

function DraggableEditableNode({ data, id }: DraggableEditableNodeProps) {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [text, setText] = useState<string>(data.label || "Draggable Node");
    const [showTooltip, setShowTooltip] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const { mode } = useMode();
    const { setNodes, setEdges, getNodes, getEdges } = useReactFlow();

    // Handle token click
    const handleTokenClick = useCallback((tokenValue: string, e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Generate color
        const color = data.color ? generateColorVariation(data.color) : generateRandomColor();
        
        // Get current node position  
        const currentNodes = getNodes();
        const currentNode = currentNodes.find(node => node.id === id);
        if (!currentNode) return;
        
        // Calculate new position
        const newPosition = calculateNewNodePosition(currentNode.position, currentNodes);
        
        // Create new node
        const newNode = createNewNode(newPosition, tokenValue, color, "draggableEditable");
        
        // Create new edge
        const newEdge = createNewEdge(id, newNode.id, color);
        
        // Add to flow
        setNodes(nodes => [...nodes, newNode]);
        setEdges(edges => [...edges, newEdge]);
        
        // Update current node to mark token as colored
        setNodes(nodes => 
            nodes.map(node => 
                node.id === id 
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            tokenColors: {
                                ...node.data.tokenColors,
                                [tokenValue]: color
                            }
                        }
                    }
                    : node
            )
        );
    }, [data.color, id, setNodes, setEdges, getNodes]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    }, []);

    const handleSave = useCallback(() => {
        setIsEditing(false);
        console.log("Draggable node text changed to:", text);
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
                setText(data.label || "Draggable Node");
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
                                    backgroundColor: data.tokenColors?.[word],
                                    color: data.tokenColors?.[word] ? getContrastColor(data.tokenColors[word]) : undefined,
                                    cursor: 'pointer',
                                    padding: data.tokenColors?.[word] ? '2px 4px' : undefined,
                                    borderRadius: data.tokenColors?.[word] ? '4px' : undefined,
                                    margin: '1px',
                                    display: 'inline-block'
                                }}
                                onClick={(e) => handleTokenClick(word, e)}
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
                                        backgroundColor: data.tokenColors?.[part],
                                        color: data.tokenColors?.[part] ? getContrastColor(data.tokenColors[part]) : undefined,
                                        cursor: 'pointer',
                                        padding: data.tokenColors?.[part] ? '3px 6px' : undefined,
                                        borderRadius: data.tokenColors?.[part] ? '6px' : undefined,
                                        margin: '2px',
                                        fontWeight: 'bold',
                                        display: 'inline-block'
                                    }}
                                    onClick={(e) => handleTokenClick(part, e)}
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
    ]);

    return (
        <div
            className="draggable-editable-node"
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
            {showTooltip && (
                <div className="node-tooltip">
                    <div className="tooltip-content">
                        <span>🎯 Draggable Node</span>
                        <span>
                            Mode: {mode === "word" ? "📝 Word" : "🧠 Concept"}
                        </span>
                        <span>Drag me around!</span>
                        <span>Click to edit text</span>
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
