import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");
import { ReactFlowProvider } from "reactflow";

createRoot(rootElement).render(
    <StrictMode>
        <ReactFlowProvider>
            <App />
        </ReactFlowProvider>
    </StrictMode>
);
