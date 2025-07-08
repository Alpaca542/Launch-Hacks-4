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
        <div
            className="explanation-sidebar bg-gray-900 dark:bg-gray-950 border-l border-gray-700 dark:border-gray-800 
                       h-full flex flex-col shadow-2xl"
        >
            <div className="explanation-sidebar-header flex justify-between items-center p-4 border-b border-gray-700 dark:border-gray-800">
                <h3 className="explanation-title text-lg font-semibold text-white dark:text-white flex items-center gap-2">
                    📄 Explanation
                </h3>
                <button
                    className="explanation-close-btn bg-transparent border-none text-gray-400 dark:text-gray-400 
                             hover:text-white dark:hover:text-white cursor-pointer text-xl p-1 rounded 
                             transition-colors duration-150 hover:bg-gray-700 dark:hover:bg-gray-800"
                    onClick={onClose}
                    title="Close explanation"
                    aria-label="Close explanation sidebar"
                >
                    ×
                </button>
            </div>
            <div className="explanation-content p-4 overflow-y-auto flex-1">
                {explanation ? (
                    <>
                        <div className="explanation-header mb-4">
                            <h3 className="text-xl font-bold text-white dark:text-white leading-tight">
                                {explanation.title}
                            </h3>
                        </div>
                        <div
                            className="explanation-text prose prose-invert dark:prose-invert prose-gray max-w-none
                                      [&>h1]:text-white [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6
                                      [&>h2]:text-white [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mb-3 [&>h2]:mt-5
                                      [&>h3]:text-white [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-2 [&>h3]:mt-4
                                      [&>h4]:text-gray-200 [&>h4]:text-base [&>h4]:font-medium [&>h4]:mb-2 [&>h4]:mt-3
                                      [&>h5]:text-gray-300 [&>h5]:text-sm [&>h5]:font-medium [&>h5]:mb-2 [&>h5]:mt-3
                                      [&>h6]:text-gray-400 [&>h6]:text-sm [&>h6]:font-medium [&>h6]:mb-2 [&>h6]:mt-3
                                      [&>p]:text-gray-300 [&>p]:leading-relaxed [&>p]:mb-4
                                      [&>strong]:text-blue-400 [&>strong]:font-semibold
                                      [&>em]:text-gray-200 [&>em]:italic
                                      [&>code]:bg-gray-800 [&>code]:text-blue-300 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm
                                      [&>pre]:bg-gray-800 [&>pre]:border [&>pre]:border-gray-700 [&>pre]:rounded-lg [&>pre]:p-4 [&>pre]:mb-4 [&>pre]:overflow-x-auto
                                      [&>pre>code]:bg-transparent [&>pre>code]:text-gray-200 [&>pre>code]:p-0 [&>pre>code]:text-sm [&>pre>code]:font-mono
                                      [&>ul]:text-gray-300 [&>ul]:mb-4 [&>ul]:pl-6
                                      [&>ol]:text-gray-300 [&>ol]:mb-4 [&>ol]:pl-6
                                      [&>li]:mb-1 [&>li]:leading-relaxed
                                      [&>ul>li]:list-disc [&>ol>li]:list-decimal
                                      [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:bg-gray-800/50 [&>blockquote]:p-4 [&>blockquote]:mb-4 [&>blockquote]:italic
                                      [&>blockquote>p]:text-gray-200 [&>blockquote>p]:mb-0
                                      [&>a]:text-blue-400 [&>a]:underline [&>a]:transition-colors [&>a]:duration-150
                                      [&>a:hover]:text-blue-300"
                        >
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                {explanation.text.replace(/_/g, "")}
                            </ReactMarkdown>
                        </div>
                    </>
                ) : (
                    <div className="explanation-placeholder text-center py-8">
                        <p className="text-gray-400 dark:text-gray-400 mb-4">
                            💡 Click on a node's explanation button (📄) to view
                            its detailed information here.
                        </p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm opacity-70">
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
