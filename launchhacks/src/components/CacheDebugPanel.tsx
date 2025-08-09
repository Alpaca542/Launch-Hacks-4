interface Props {
    isVisible: boolean;
    onToggle: () => void;
}

export default function CacheDebugPanel({ isVisible, onToggle }: Props) {
    if (!isVisible) return null;
    return (
        <div className="fixed bottom-4 right-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow p-3 text-sm">
            <div className="flex items-center justify-between gap-4">
                <span className="text-gray-700 dark:text-gray-300">Debug</span>
                <button
                    onClick={onToggle}
                    className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
