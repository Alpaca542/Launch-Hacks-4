import React, { createContext, useContext, useCallback, useState } from "react";
import { Node } from "reactflow";
import {
    generateRandomColor,
    generateColorVariation,
    calculateNewNodePosition,
    createNewNode,
    createNewEdge,
} from "../utils/nodeHelpers";
import ExplanationWindow from "../components/ExplanationWindow";

export interface Token {
    word: string;
    myConcept?: string;
}

interface TokenInteractionContextType {
    handleTokenClick: (
        token: Token,
        sourceNodeId: string,
        sourceNodePosition: { x: number; y: number },
        sourceNodeType: string,
        sourceNodeColor?: string
    ) => string;
}

interface TokenInteractionProviderProps {
    children: React.ReactNode;
    nodes: Node[];
    onNodesChange: (changes: any) => void;
    onEdgesChange: (changes: any) => void;
}

interface ExtendedNodeState {
    isVisible: boolean;
    text: string;
}

const TokenInteractionContext =
    createContext<TokenInteractionContextType | null>(null);

export const TokenInteractionProvider: React.FC<
    TokenInteractionProviderProps
> = ({ children, nodes, onNodesChange, onEdgesChange }) => {
    const [extendedNode, setExtendedNode] = useState<ExtendedNodeState>({
        isVisible: false,
        text: "",
    });

    const determineNodeColor = useCallback(
        (sourceNodeType: string, sourceNodeColor?: string): string => {
            if (sourceNodeType === "staticEditable") {
                return generateRandomColor();
            }
            return sourceNodeColor
                ? generateColorVariation(sourceNodeColor)
                : generateRandomColor();
        },
        []
    );

    const handleExtendNode = useCallback(
        (nodeId: string, text: any) => {
            const extendedNodeData = nodes.find((node) => node.id === nodeId);
            if (!extendedNodeData) return;

            setExtendedNode({ isVisible: true, text });
        },
        [nodes]
    );

    const hideExtendedNode = useCallback(() => {
        setExtendedNode({ isVisible: false, text: "" });
    }, []);

    const handleTokenClick = useCallback(
        (
            token: Token,
            sourceNodeId: string,
            sourceNodePosition: { x: number; y: number },
            sourceNodeType: string,
            sourceNodeColor?: string
        ) => {
            const color = determineNodeColor(sourceNodeType, sourceNodeColor);
            const newPosition = calculateNewNodePosition(
                sourceNodePosition,
                nodes
            );
            const nodeLabel = token.myConcept || token.word;

            const newNode = createNewNode(
                newPosition,
                nodeLabel,
                color,
                sourceNodeType,
                handleExtendNode
            );

            const newEdge = createNewEdge(sourceNodeId, newNode.id, color);

            onNodesChange([{ type: "add", item: newNode }]);
            onEdgesChange([{ type: "add", item: newEdge }]);

            return color;
        },
        [
            nodes,
            onNodesChange,
            onEdgesChange,
            determineNodeColor,
            handleExtendNode,
        ]
    );

    return (
        <TokenInteractionContext.Provider value={{ handleTokenClick }}>
            <ExplanationWindow
                show={extendedNode.isVisible}
                title="Extended Node Information"
                text={extendedNode.text}
                onHide={hideExtendedNode}
            />
            {children}
        </TokenInteractionContext.Provider>
    );
};

export const useTokenInteraction = (): TokenInteractionContextType => {
    const context = useContext(TokenInteractionContext);
    if (!context) {
        throw new Error(
            "useTokenInteraction must be used within a TokenInteractionProvider"
        );
    }
    return context;
};
