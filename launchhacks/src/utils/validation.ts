import { UI_CONSTANTS } from "./constants";
import { User } from "firebase/auth";
import { BoardData, NodeData, EdgeData } from "../services/boardService";

// Type definitions
export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export const validateBoardName = (name: string): ValidationResult => {
    if (!name || name.trim().length === 0) {
        return { isValid: false, error: "Board name cannot be empty" };
    }

    if (name.trim().length > UI_CONSTANTS.MAX_BOARD_NAME_LENGTH) {
        return {
            isValid: false,
            error: `Board name must be less than ${UI_CONSTANTS.MAX_BOARD_NAME_LENGTH} characters`,
        };
    }

    return { isValid: true };
};

export const validateUser = (user: User | null | { uid?: string }): boolean => {
    return !!(user && user.uid);
};

export const validateBoard = (board: BoardData | null): boolean => {
    return !!(board && board.id && board.userId);
};

export const validateNode = (node: NodeData | null): boolean => {
    return !!(node && node.id && node.type && node.position);
};

export const validateEdge = (edge: EdgeData | null): boolean => {
    return !!(edge && edge.id && edge.source && edge.target);
};

export const sanitizeBoardName = (name: string | undefined | null): string => {
    return name?.trim()?.substring(0, UI_CONSTANTS.MAX_BOARD_NAME_LENGTH) || "";
};
