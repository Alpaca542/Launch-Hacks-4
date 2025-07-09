import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { useState, useEffect } from "react";

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
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRender, setShouldRender] = useState(isVisible);

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            // Small delay to ensure DOM element is rendered before animation starts
            setTimeout(() => setIsAnimating(true), 10);
        } else {
            setIsAnimating(false);
            // Wait for animation to complete before removing from DOM
            setTimeout(() => setShouldRender(false), 300);
        }
    }, [isVisible]);

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(() => onClose(), 300);
    };

    if (!shouldRender) return null;

    return (
        <div
            className={`h-full flex flex-col transition-all duration-300 ease-out ${
                isAnimating
                    ? "transform translate-x-0 opacity-100"
                    : "transform translate-x-full opacity-0"
            }`}
        >
            <div
                className={`flex justify-between items-center p-6 border-b border-gray-200/50 dark:border-gray-700/50 
                           transition-all duration-400 ease-out ${
                               isAnimating
                                   ? "transform translate-y-0 opacity-100"
                                   : "transform -translate-y-4 opacity-0"
                           }`}
                style={{ transitionDelay: "50ms" }}
            >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <span className="text-blue-500">📄</span>
                    Explanation
                </h3>
                <button
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 
                             p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 
                             transition-all duration-200 transform hover:scale-105"
                    onClick={handleClose}
                    title="Close explanation"
                    aria-label="Close explanation sidebar"
                >
                    <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
                {explanation ? (
                    <>
                        <div
                            className={`mb-6 transition-all duration-500 ease-out ${
                                isAnimating
                                    ? "transform translate-y-0 opacity-100"
                                    : "transform translate-y-4 opacity-0"
                            }`}
                            style={{ transitionDelay: "100ms" }}
                        >
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                {explanation.title}
                            </h3>
                        </div>
                        <div
                            className={`prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-gray-300
                                      [&>h1]:text-gray-900 [&>h1]:dark:text-gray-100 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6
                                      [&>h2]:text-gray-900 [&>h2]:dark:text-gray-100 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mb-3 [&>h2]:mt-5
                                      [&>h3]:text-gray-900 [&>h3]:dark:text-gray-100 [&>h3]:text-lg [&>h3]:font-medium [&>h3]:mb-2 [&>h3]:mt-4
                                      [&>p]:text-gray-700 [&>p]:dark:text-gray-300 [&>p]:leading-relaxed [&>p]:mb-4
                                      [&>ul]:text-gray-700 [&>ul]:dark:text-gray-300 [&>ul]:mb-4 [&>ul>li]:mb-2
                                      [&>ol]:text-gray-700 [&>ol]:dark:text-gray-300 [&>ol]:mb-4 [&>ol>li]:mb-2
                                      [&>blockquote]:border-l-4 [&>blockquote]:border-blue-400 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-gray-600 [&>blockquote]:dark:text-gray-400 [&>blockquote]:bg-blue-50 [&>blockquote]:dark:bg-blue-900/20 [&>blockquote]:py-2 [&>blockquote]:rounded-r-lg
                                      [&>code]:bg-gray-100 [&>code]:dark:bg-gray-800 [&>code]:text-blue-600 [&>code]:dark:text-blue-400 [&>code]:px-2 [&>code]:py-1 [&>code]:rounded [&>code]:text-sm [&>code]:font-medium
                                      [&>pre]:bg-gray-100 [&>pre]:dark:bg-gray-800 [&>pre]:text-gray-800 [&>pre]:dark:text-gray-200 [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:mb-4 [&>pre]:border [&>pre]:border-gray-200 [&>pre]:dark:border-gray-700
                                      transition-all duration-500 ease-out ${
                                          isAnimating
                                              ? "transform translate-y-0 opacity-100"
                                              : "transform translate-y-4 opacity-0"
                                      }`}
                            style={{ transitionDelay: "200ms" }}
                        >
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                {explanation.text}
                            </ReactMarkdown>
                        </div>
                    </>
                ) : (
                    <div
                        className={`flex items-center justify-center h-full text-gray-500 dark:text-gray-400 
                                   transition-all duration-500 ease-out ${
                                       isAnimating
                                           ? "transform translate-y-0 opacity-100"
                                           : "transform translate-y-8 opacity-0"
                                   }`}
                        style={{ transitionDelay: "150ms" }}
                    >
                        <div className="text-center">
                            <div className="text-6xl mb-6 opacity-60">📄</div>
                            <p className="text-xl font-medium mb-2">
                                No explanation available
                            </p>
                            <p className="text-sm opacity-75">
                                Click on a node to see its explanation
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ExplanationSidebar;
