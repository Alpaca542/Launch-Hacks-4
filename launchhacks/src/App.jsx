import { useState, useCallback } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
} from "reactflow";
import "reactflow/dist/style.css";
import "./App.css";

function App() {
    const initialNodes = [
        {
            id: "1",
            type: "input",
            data: { label: "Start Here" },
            position: { x: 250, y: 25 },
            draggable: true,
        },
        {
            id: "2",
            data: {
                label: (
                    <div
                        style={{
                            padding: "10px",
                            backgroundColor: "#f0f0f0",
                            transition: "background-color 0.3s",
                        }}
                        onMouseEnter={(e) =>
                            (e.target.style.backgroundColor = "red")
                        }
                        onMouseLeave={(e) =>
                            (e.target.style.backgroundColor = "#f0f0f0")
                        }
                    >
                        <div>Process Data</div>
                        <button onClick={() => console.log("Button clicked!")}>
                            Click Me
                        </button>
                    </div>
                ),
            },
            position: { x: 100, y: 125 },
            draggable: true,
        },
        {
            id: "3",
            type: "output",
            data: { label: "Final Result" },
            position: { x: 250, y: 250 },
            draggable: true,
        },
    ];

    const initialEdges = [
        {
            id: "e1-2",
            source: "1",
            target: "2",
            animated: true,
        },
        {
            id: "e2-3",
            source: "2",
            target: "3",
            animated: true,
        },
    ];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
            >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />
            </ReactFlow>
        </div>
    );
}

export default App;
