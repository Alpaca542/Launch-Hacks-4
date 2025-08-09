import React from "react";

interface BoardDebugPanelProps {
    boardManagement: {
        allBoards: any[];
        currentBoard: any;
        isLoading: boolean;
        isSwitchingBoard: boolean;
        isSaving: boolean;
        nodes: any[];
        edges: any[];
        forceRefreshBoards: () => Promise<void>;
    };
}

export const BoardDebugPanel: React.FC<BoardDebugPanelProps> = ({
    boardManagement,
}) => {
    const {
        allBoards,
        currentBoard,
        isLoading,
        isSwitchingBoard,
        isSaving,
        nodes,
        edges,
        forceRefreshBoards,
    } = boardManagement;

    return (
        <div
            style={{
                position: "fixed",
                bottom: "10px",
                right: "10px",
                background: "rgba(0,0,0,0.8)",
                color: "white",
                padding: "10px",
                borderRadius: "5px",
                fontSize: "12px",
                zIndex: 9999,
                maxWidth: "300px",
            }}
        >
            <h4>Board Debug Info</h4>
            <div>
                <strong>States:</strong>
                <div>Loading: {isLoading.toString()}</div>
                <div>Switching: {isSwitchingBoard.toString()}</div>
                <div>Saving: {isSaving.toString()}</div>
            </div>
            <div>
                <strong>Data:</strong>
                <div>All Boards: {allBoards.length}</div>
                <div>Current Board: {currentBoard?.name || "None"}</div>
                <div>Nodes: {nodes.length}</div>
                <div>Edges: {edges.length}</div>
            </div>
            <button
                onClick={forceRefreshBoards}
                style={{
                    marginTop: "5px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    background: "#007acc",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                }}
            >
                Force Refresh
            </button>
        </div>
    );
};
