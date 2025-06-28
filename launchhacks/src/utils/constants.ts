// UI Constants
export const UI_CONSTANTS = {
    SIDEBAR_WIDTH: 250,
    AUTO_SAVE_DELAY: 1000,
    MAX_BOARD_NAME_LENGTH: 50,
    DEBOUNCE_DELAY: 300,
};

// Firebase Collection Names
export const COLLECTIONS = {
    BOARDS: "boards",
    NODES: "nodes",
    EDGES: "edges",
};

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
    NEW_BOARD: { ctrl: true, key: 'n' },
    BOARD_SWITCH: { ctrl: true, keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
    SAVE: { ctrl: true, key: 's' },
    DELETE: { key: 'Delete' },
};

// Board States
export const BOARD_STATES = {
    LOADING: 'loading',
    LOADED: 'loaded',
    SAVING: 'saving',
    ERROR: 'error',
};

// Error Messages
export const ERROR_MESSAGES = {
    CANNOT_DELETE_LAST_BOARD: "Cannot delete the last board!",
    BOARD_NOT_FOUND: "Board not found",
    SAVE_FAILED: "Failed to save changes",
    LOAD_FAILED: "Failed to load data",
    AUTH_REQUIRED: "Authentication required",
    NETWORK_ERROR: "Network error. Please check your connection.",
    FIRESTORE_INDEX_MISSING: "Database index is missing. Please create the required index in Firebase Console.",
    INVALID_EMAIL: "Please enter a valid email address",
    WEAK_PASSWORD: "Password must be at least 6 characters long",
    EMAIL_IN_USE: "This email is already registered",
    USER_NOT_FOUND: "No account found with this email",
    WRONG_PASSWORD: "Incorrect password",
    TOO_MANY_REQUESTS: "Too many failed attempts. Please try again later.",
};

// Success Messages
export const SUCCESS_MESSAGES = {
    BOARD_CREATED: "Board created successfully!",
    BOARD_DELETED: "Board deleted successfully!",
    BOARD_RENAMED: "Board renamed successfully!",
    CHANGES_SAVED: "Changes saved successfully!",
    SIGNED_IN: "Signed in successfully!",
    SIGNED_UP: "Account created successfully!",
};
