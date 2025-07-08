import React, { useState, useEffect } from "react";
import { parseJsonToHtml } from "./htmlParser";

interface QuizData {
    question: string;
    answers: Array<{ [key: string]: string }>;
    correctAnswer: number;
}

interface SchemaItem {
    large_header?: string;
    small_header?: string;
    ul?: string[];
    ol?: string[];
    quiz?: QuizData[];
    img?: [string, string];
    vid?: [string, string];
    gif?: [string, string];
    textblock?: string;
    codeblock?: string;
    quote?: string;
    link?: string;
    table?: string[][];
    purehtml?: string;
    sidecontainer?: string;
    diagram?: string;
    note?: string;
    warning?: string;
    tip?: string;
    htmlCanvas?: string;
}

const testSchema: SchemaItem[] = [
    {
        large_header: "HTML Parser Test Suite",
    },
    {
        small_header: "Testing All Features",
    },
    {
        textblock:
            "This is a comprehensive test of our **HTML parser** with (markdown-style)[https://example.com] formatting.",
    },
    {
        note: "This is a note callout to highlight important information.",
    },
    {
        warning:
            "This is a warning callout to alert users of potential issues.",
    },
    {
        tip: "This is a tip callout to provide helpful advice.",
    },
    {
        ul: [
            "First unordered list item",
            "Second unordered list item",
            "Third unordered list item",
        ],
    },
    {
        ol: [
            "First ordered list item",
            "Second ordered list item",
            "Third ordered list item",
        ],
    },
    {
        codeblock:
            "// Example JavaScript code\nfunction greet(name) {\n    return `Hello, ${name}!`;\n}\n\nconsole.log(greet('World'));",
    },
    {
        quote: "The best way to predict the future is to create it. - Peter Drucker",
    },
    {
        table: [
            ["Feature", "Status", "Description"],
            ["Headers", "✅ Working", "Large and small headers"],
            ["Lists", "✅ Working", "Ordered and unordered lists"],
            ["Quizzes", "✅ Working", "Multi-question interactive quizzes"],
            ["Diagrams", "✅ Working", "Mermaid.js diagram support"],
            ["Canvas", "✅ Working", "Interactive HTML5 Canvas code execution"],
        ],
    },
    {
        quiz: [
            {
                question: "What is the capital of France?",
                answers: [
                    { Berlin: "That's the capital of Germany!" },
                    { Madrid: "That's the capital of Spain!" },
                    { Paris: "Correct! Paris is the capital of France." },
                    { Rome: "That's the capital of Italy!" },
                ],
                correctAnswer: 2,
            },
            {
                question:
                    "Which programming language is this parser written in?",
                answers: [
                    { Python: "Nope, try again!" },
                    {
                        "JavaScript/TypeScript":
                            "Exactly! This is written in TypeScript.",
                    },
                    { Java: "Not quite!" },
                    { "C++": "Not this time!" },
                ],
                correctAnswer: 1,
            },
            {
                question: "What does HTML stand for?",
                answers: [
                    {
                        "Hyper Text Markup Language":
                            "Perfect! You know your web technologies.",
                    },
                    {
                        "High Tech Modern Language":
                            "Not quite, but creative guess!",
                    },
                    { "Home Tool Markup Language": "Nope, try again!" },
                ],
                correctAnswer: 0,
            },
        ],
    },
    {
        diagram:
            "graph TD;\n    A[Start] --> B{Is it working?};\n    B -->|Yes| C[Great!];\n    B -->|No| D[Debug];\n    D --> B;\n    C --> E[Deploy];\n    E --> F[Success!];",
    },
    {
        small_header: "Interactive Canvas Demo",
    },
    {
        htmlCanvas:
            "// Draw a colorful gradient circle\nctx.clearRect(0, 0, canvas.width, canvas.height);\n\n// Create gradient\nconst gradient = ctx.createRadialGradient(200, 150, 0, 200, 150, 100);\ngradient.addColorStop(0, '#ff6b6b');\ngradient.addColorStop(0.5, '#4ecdc4');\ngradient.addColorStop(1, '#45b7d1');\n\n// Draw circle\nctx.beginPath();\nctx.arc(200, 150, 80, 0, 2 * Math.PI);\nctx.fillStyle = gradient;\nctx.fill();\n\n// Add text\nctx.fillStyle = 'white';\nctx.font = 'bold 20px Arial';\nctx.textAlign = 'center';\nctx.fillText('Canvas Test!', 200, 160);\n\n// Draw some animated stars\nfor (let i = 0; i < 5; i++) {\n    const x = Math.random() * canvas.width;\n    const y = Math.random() * canvas.height;\n    const size = Math.random() * 10 + 5;\n    \n    ctx.fillStyle = '#ffd93d';\n    ctx.beginPath();\n    ctx.arc(x, y, size, 0, 2 * Math.PI);\n    ctx.fill();\n}",
    },
    {
        htmlCanvas:
            "// Interactive Drawing Demo\nlet isDrawing = false;\nlet lastX = 0;\nlet lastY = 0;\n\n// Set up drawing\nctx.strokeStyle = '#2196F3';\nctx.lineWidth = 3;\nctx.lineCap = 'round';\n\n// Clear canvas\nctx.clearRect(0, 0, canvas.width, canvas.height);\n\n// Add instructions\nctx.fillStyle = '#666';\nctx.font = '16px Arial';\nctx.textAlign = 'center';\nctx.fillText('Click and drag to draw!', canvas.width/2, 30);\n\n// Mouse event handlers\ncanvas.addEventListener('mousedown', (e) => {\n    isDrawing = true;\n    const rect = canvas.getBoundingClientRect();\n    lastX = e.clientX - rect.left;\n    lastY = e.clientY - rect.top;\n});\n\ncanvas.addEventListener('mousemove', (e) => {\n    if (!isDrawing) return;\n    \n    const rect = canvas.getBoundingClientRect();\n    const currentX = e.clientX - rect.left;\n    const currentY = e.clientY - rect.top;\n    \n    ctx.beginPath();\n    ctx.moveTo(lastX, lastY);\n    ctx.lineTo(currentX, currentY);\n    ctx.stroke();\n    \n    lastX = currentX;\n    lastY = currentY;\n});\n\ncanvas.addEventListener('mouseup', () => {\n    isDrawing = false;\n});\n\ncanvas.addEventListener('mouseout', () => {\n    isDrawing = false;\n});",
    },
    {
        img: [
            "https://picsum.photos/300/200?random=1",
            "A placeholder test image",
        ],
    },
    {
        link: "https://github.com",
    },
    {
        purehtml:
            "<div style='background: linear-gradient(45deg, #ff6b6b, #4ecdc4); padding: 20px; border-radius: 10px; color: white; text-align: center;'><h3>Pure HTML Content</h3><p>This is raw HTML content that gets rendered directly!</p></div>",
    },
    {
        sidecontainer:
            "This is a side container with some additional information that stands out from the main content.",
    },
];

const HtmlParserTest: React.FC = () => {
    const [parsedHtml, setParsedHtml] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // Parse the test schema
        try {
            const html = parseJsonToHtml(testSchema);
            setParsedHtml(html);
        } catch (error) {
            console.error("Error parsing schema:", error);
            setParsedHtml(
                '<div style="color: red;">Error parsing schema</div>'
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Auto-trigger canvas and diagram initialization after HTML is rendered
        if (!isLoading && parsedHtml) {
            setTimeout(() => {
                // Trigger auto-run for canvas elements
                const canvasContainers = document.querySelectorAll(
                    ".parsed-html-canvas"
                );
                canvasContainers.forEach((container) => {
                    const autoBtn = Array.from(
                        container.querySelectorAll("button")
                    ).find((btn) =>
                        btn.textContent?.includes("Auto Run")
                    ) as HTMLButtonElement;
                    if (autoBtn) autoBtn.click();
                });

                const diagramContainers =
                    document.querySelectorAll(".parsed-diagram");
                diagramContainers.forEach((container) => {
                    const autoBtn = Array.from(
                        container.querySelectorAll("button")
                    ).find((btn) =>
                        btn.textContent?.includes("Auto Render")
                    ) as HTMLButtonElement;
                    if (autoBtn) autoBtn.click();
                });
            }, 100);
        }
    }, [isLoading, parsedHtml]);

    if (isLoading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "200px",
                    fontSize: "18px",
                    color: "#666",
                }}
            >
                Loading HTML Parser Test...
            </div>
        );
    }

    return (
        <div
            style={{
                maxWidth: "800px",
                margin: "0 auto",
                padding: "20px",
                fontFamily: "Arial, sans-serif",
            }}
        >
            <div
                style={{
                    background: "#f8f9fa",
                    padding: "20px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    border: "1px solid #e9ecef",
                }}
            >
                <h2 style={{ margin: "0 0 10px 0", color: "#495057" }}>
                    🧪 HTML Parser Test Component
                </h2>
                <p style={{ margin: "0", color: "#6c757d" }}>
                    This component tests all features of our HTML parser
                    including headers, lists, quizzes, diagrams (Mermaid.js),
                    interactive canvas, and more!
                </p>
            </div>

            <div
                dangerouslySetInnerHTML={{ __html: parsedHtml }}
                style={{
                    lineHeight: "1.6",
                    color: "#333",
                }}
            />

            <div
                style={{
                    marginTop: "40px",
                    padding: "20px",
                    background: "#e8f5e8",
                    borderRadius: "8px",
                    border: "1px solid #c3e6c3",
                }}
            >
                <h3 style={{ color: "#155724", margin: "0 0 10px 0" }}>
                    ✅ Test Complete!
                </h3>
                <p style={{ margin: "0", color: "#155724" }}>
                    All parser features have been successfully rendered. Check
                    the console for any errors and interact with the quizzes,
                    diagrams, and canvas elements above.
                </p>
            </div>
        </div>
    );
};

export default HtmlParserTest;
