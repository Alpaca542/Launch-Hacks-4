import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface ExplanationSidebarProps {
    explanation?: {
        title: string;
        text: string;
    } | null;
    onClose: () => void;
    isVisible: boolean;
}

function ExplanationSidebar({
    explanation,
    onClose,
    isVisible,
}: ExplanationSidebarProps) {
    if (!isVisible) return null;

    return (
        <div className="explanation-sidebar">
            <div className="explanation-sidebar-header">
                <h3 className="explanation-title">📄 Explanation</h3>
                <button
                    className="explanation-close-btn"
                    onClick={onClose}
                    title="Close explanation"
                    aria-label="Close explanation sidebar"
                >
                    ×
                </button>
            </div>
            <div className="explanation-content">
                {explanation ? (
                    <>
                        <div className="explanation-header">
                            <h3>{explanation.title}</h3>
                        </div>
                        <div className="explanation-text">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                {explanation.text.replace(/_/g, "")}
                            </ReactMarkdown>
                        </div>
                    </>
                ) : (
                    <div className="explanation-placeholder">
                        <p>
                            💡 Click on a node's explanation button (📄) to view
                            its detailed information here.
                        </p>
                        <p
                            style={{
                                marginTop: "16px",
                                fontSize: "0.9em",
                                opacity: 0.7,
                            }}
                        >
                            This panel provides in-depth explanations and
                            documentation for your workflow components.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ExplanationSidebar;
