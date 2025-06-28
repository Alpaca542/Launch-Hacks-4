import { useEffect } from "react";

interface BoardData {
    id: string;
    userId: string;
    name: string;
    createdAt: any;
    isOpen: boolean;
    isFallback?: boolean;
}

interface UseKeyboardShortcutsProps {
    allBoards: BoardData[];
    currentBoard: BoardData | null;
    createNewBoard: () => void;
    switchToBoard: (boardId: string) => void;
}

export const useKeyboardShortcuts = ({
    allBoards,
    currentBoard,
    createNewBoard,
    switchToBoard,
}: UseKeyboardShortcutsProps): void => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl/Cmd + N: Create new board
            if ((event.ctrlKey || event.metaKey) && event.key === "n") {
                event.preventDefault();
                createNewBoard();
            }

            // Ctrl/Cmd + 1-9: Switch to board by number
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key >= "1" &&
                event.key <= "9"
            ) {
                event.preventDefault();
                const boardIndex = parseInt(event.key) - 1;
                if (
                    allBoards[boardIndex] &&
                    allBoards[boardIndex].id !== currentBoard?.id
                ) {
                    switchToBoard(allBoards[boardIndex].id);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [allBoards, currentBoard, createNewBoard, switchToBoard]);
};
