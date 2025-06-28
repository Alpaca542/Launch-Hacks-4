import { useCallback, useState } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import "./App.css";
import StaticEditableNode from "./components/StaticEditableNode";
import DraggableEditableNode from "./components/DraggableEditableNode";

// Define custom node types outside the component to prevent re-creation
const nodeTypes = {
    staticEditable: StaticEditableNode,
    draggableEditable: DraggableEditableNode,
};

function App() {
    const [connectionNodeId, setConnectionNodeId] = useState(null);
    const [connectionHandleId, setConnectionHandleId] = useState(null);
    const [connectionHandleType, setConnectionHandleType] = useState(null);

    const initialNodes = [
        {
            id: "1",
            type: "staticEditable",
            data: {
                label: "Node A",
            },
            position: { x: 100, y: 100 },
            draggable: false,
        },
        {
            id: "2",
            type: "draggableEditable",
            data: {
                label: "Node B",
            },
            position: { x: 400, y: 100 },
            draggable: true,
        },
        {
            id: "3",
            type: "staticEditable",
            data: {
                label: "Node C",
            },
            position: { x: 700, y: 100 },
            draggable: false,
        },
        {
            id: "4",
            type: "draggableEditable",
            data: {
                label: "Node D",
            },
            position: { x: 250, y: 300 },
            draggable: true,
        },
        {
            id: "5",
            type: "staticEditable",
            data: {
                label: "Node E",
            },
            position: { x: 550, y: 300 },
            draggable: false,
        },
    ];

    const initialEdges = [
        {
            id: "e1-2",
            source: "1",
            target: "2",
            sourceHandle: "right-source",
            targetHandle: "left",
        },
        {
            id: "e2-3",
            source: "2",
            target: "3",
            sourceHandle: "right-source",
            targetHandle: "left",
        },
        {
            id: "e1-4",
            source: "1",
            target: "4",
            sourceHandle: "bottom-source",
            targetHandle: "top",
        },
        {
            id: "e4-5",
            source: "4",
            target: "5",
            sourceHandle: "right-source",
            targetHandle: "left",
        },
        {
            id: "e2-5",
            source: "2",
            target: "5",
            sourceHandle: "bottom-source",
            targetHandle: "top",
        },
    ];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onConnectStart = useCallback(
        (_, { nodeId, handleId, handleType }) => {
            setConnectionNodeId(nodeId);
            setConnectionHandleId(handleId);
            setConnectionHandleType(handleType);
        },
        []
    );

    const onConnectEnd = useCallback(() => {
        setConnectionNodeId(null);
        setConnectionHandleId(null);
        setConnectionHandleType(null);
    }, []);

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                nodeTypes={nodeTypes}
                connectionMode={ConnectionMode.Loose}
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
