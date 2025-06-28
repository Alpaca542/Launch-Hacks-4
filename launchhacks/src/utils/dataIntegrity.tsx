// Type definitions
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface DataIntegrityResult {
    isHealthy: boolean;
    issues: string[];
}

// Interface definitions (should match the ones in hooks/services)
interface Position {
    x: number;
    y: number;
}

interface NodeData {
    [key: string]: any;
}

interface BoardData {
    id: string;
    userId: string;
    name: string;
    createdAt: any; // Firestore Timestamp or Date
    isOpen: boolean;
    isFallback?: boolean;
}

interface Node {
    id: string;
    type: string;
    position: Position;
    data: NodeData;
}

interface Edge {
    id: string;
    source: string;
    target: string;
}

/**
 * Validates board data structure
 */
export const validateBoardData = (board: any): ValidationResult => {
    const errors: string[] = [];

    if (!board) {
        errors.push("Board data is null or undefined");
        return { isValid: false, errors };
    }

    if (!board.id || typeof board.id !== "string") {
        errors.push("Board must have a valid ID");
    }

    if (!board.userId || typeof board.userId !== "string") {
        errors.push("Board must have a valid user ID");
    }

    if (!board.name || typeof board.name !== "string") {
        errors.push("Board must have a valid name");
    }

    if (
        board.createdAt &&
        !(board.createdAt.toDate || board.createdAt instanceof Date)
    ) {
        errors.push(
            "Board createdAt must be a valid date or Firestore Timestamp"
        );
    }

    if (typeof board.isOpen !== "boolean") {
        errors.push("Board isOpen must be a boolean");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validates node data structure
 */
export const validateNodeData = (node: any): ValidationResult => {
    const errors: string[] = [];

    if (!node) {
        errors.push("Node data is null or undefined");
        return { isValid: false, errors };
    }

    if (!node.id || typeof node.id !== "string") {
        errors.push("Node must have a valid ID");
    }

    if (!node.type || typeof node.type !== "string") {
        errors.push("Node must have a valid type");
    }

    if (
        !node.position ||
        typeof node.position.x !== "number" ||
        typeof node.position.y !== "number"
    ) {
        errors.push("Node must have valid position coordinates");
    }

    if (!node.data || typeof node.data !== "object") {
        errors.push("Node must have valid data object");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validates edge data structure
 */
export const validateEdgeData = (edge: any): ValidationResult => {
    const errors: string[] = [];

    if (!edge) {
        errors.push("Edge data is null or undefined");
        return { isValid: false, errors };
    }

    if (!edge.id || typeof edge.id !== "string") {
        errors.push("Edge must have a valid ID");
    }

    if (!edge.source || typeof edge.source !== "string") {
        errors.push("Edge must have a valid source");
    }

    if (!edge.target || typeof edge.target !== "string") {
        errors.push("Edge must have a valid target");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Sanitizes board data for Firestore
 */
export const sanitizeBoardData = (board: any): BoardData => {
    return {
        id: String(board.id),
        userId: String(board.userId),
        name: String(board.name).trim(),
        createdAt: board.createdAt,
        isOpen: Boolean(board.isOpen),
        ...(board.isFallback && { isFallback: true }),
    };
};

/**
 * Checks data consistency across the application
 */
export const performDataIntegrityCheck = (
    allBoards: BoardData[],
    currentBoard: BoardData | null,
    nodes: Node[],
    edges: Edge[]
): DataIntegrityResult => {
    const issues: string[] = [];

    // Check if current board exists in allBoards
    if (currentBoard && !allBoards.find((b) => b.id === currentBoard.id)) {
        issues.push("Current board not found in boards list");
    }

    // Check if there's exactly one open board
    const openBoards = allBoards.filter((b) => b.isOpen);
    if (openBoards.length === 0) {
        issues.push("No board is marked as open");
    } else if (openBoards.length > 1) {
        issues.push("Multiple boards are marked as open");
    }

    // Validate all board data
    allBoards.forEach((board, index) => {
        const validation = validateBoardData(board);
        if (!validation.isValid) {
            issues.push(
                `Board ${index} has validation errors: ${validation.errors.join(
                    ", "
                )}`
            );
        }
    });

    // Validate nodes
    nodes.forEach((node, index) => {
        const validation = validateNodeData(node);
        if (!validation.isValid) {
            issues.push(
                `Node ${index} has validation errors: ${validation.errors.join(
                    ", "
                )}`
            );
        }
    });

    // Validate edges
    edges.forEach((edge, index) => {
        const validation = validateEdgeData(edge);
        if (!validation.isValid) {
            issues.push(
                `Edge ${index} has validation errors: ${validation.errors.join(
                    ", "
                )}`
            );
        }
    });

    // Check if edge nodes exist
    edges.forEach((edge) => {
        const sourceExists = nodes.find((n) => n.id === edge.source);
        const targetExists = nodes.find((n) => n.id === edge.target);

        if (!sourceExists) {
            issues.push(
                `Edge ${edge.id} references non-existent source node ${edge.source}`
            );
        }
        if (!targetExists) {
            issues.push(
                `Edge ${edge.id} references non-existent target node ${edge.target}`
            );
        }
    });

    return {
        isHealthy: issues.length === 0,
        issues,
    };
};
