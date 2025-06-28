import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useCallback,
    useMemo,
} from "react";

export type AppMode = "word" | "concept";

interface ModeContextType {
    mode: AppMode;
    toggleMode: () => void;
    setMode: (mode: AppMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

interface ModeProviderProps {
    children: ReactNode;
}

export const ModeProvider: React.FC<ModeProviderProps> = ({ children }) => {
    const [mode, setModeState] = useState<AppMode>("word");

    const toggleMode = useCallback(() => {
        setModeState((prevMode) => (prevMode === "word" ? "concept" : "word"));
    }, []);

    const setMode = useCallback((newMode: AppMode) => {
        setModeState(newMode);
    }, []);

    const value = useMemo(
        () => ({
            mode,
            toggleMode,
            setMode,
        }),
        [mode, toggleMode, setMode]
    );

    return (
        <ModeContext.Provider value={value}>{children}</ModeContext.Provider>
    );
};

export const useMode = (): ModeContextType => {
    const context = useContext(ModeContext);
    if (context === undefined) {
        throw new Error("useMode must be used within a ModeProvider");
    }
    return context;
};
