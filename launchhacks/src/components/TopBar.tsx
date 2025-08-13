import { useState, useEffect, memo } from "react";
import ThemeToggle from "./ThemeToggle";
import { getUsage, startCheckout } from "../services/billing";

interface User {
    isAnonymous?: boolean;
    email?: string | null;
}

interface TopBarProps {
    name: string;
    onSetName: (name: string) => void;
    user: User | null;
    isSaving: boolean;
}

function TopBar({ name, onSetName, user, isSaving }: TopBarProps) {
    const [edit, setEdit] = useState(false);
    const [editedName, setEditedName] = useState(name || "");
    const [usage, setUsage] = useState<number | null>(null);
    const [limit, setLimit] = useState<number | null>(null);
    const [isPlus, setIsPlus] = useState<boolean>(false);
    const [usageLoading, setUsageLoading] = useState(false);
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    // Access Vite env safely (type cast to any to satisfy TS in isolated file context)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PRICE_ID =
        (import.meta as any).env?.VITE_STRIPE_PLUS_PRICE_ID ||
        "price_PLUS_PLAN"; // replace with real price id

    // Update editedName when name prop changes
    useEffect(() => {
        setEditedName(name || "");
    }, [name]);

    // Fetch usage whenever authenticated user changes
    useEffect(() => {
        let active = true;
        if (!user) {
            setUsage(null);
            setLimit(null);
            setIsPlus(false);
            return;
        }
        setUsageLoading(true);
        getUsage()
            .then((u) => {
                if (!active) return;
                setUsage(u.usage_this_month);
                setLimit(u.limit_this_month);
                setIsPlus(u.is_plus);
            })
            .catch(() => {
                if (!active) return;
                setUsage(null);
            })
            .finally(() => active && setUsageLoading(false));
        return () => {
            active = false;
        };
    }, [user]);

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            onSetName(editedName);
            setEdit(false);
        }
    };

    const handleClick = () => {
        setEdit(true);
        setEditedName(name || "");
    };

    const usagePercent =
        usage != null && limit
            ? Math.min(100, Math.round((usage / limit) * 100))
            : 0;

    const handleUpgrade = async () => {
        if (upgradeLoading) return;
        setUpgradeLoading(true);
        try {
            const successUrl =
                window.location.origin +
                window.location.pathname +
                "?upgrade=success";
            const cancelUrl = window.location.href;
            const session = await startCheckout(
                PRICE_ID,
                successUrl,
                cancelUrl
            );
            if (session.url) window.location.href = session.url;
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Upgrade failed", e);
        } finally {
            setUpgradeLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-none mx-auto px-4">
                <header className="flex justify-between items-center py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    T
                                </span>
                            </div>
                            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                TinkFlow
                            </h1>
                        </div>
                        <span className="text-gray-400 dark:text-gray-500 text-sm">
                            •
                        </span>
                        {!edit ? (
                            <button
                                onClick={handleClick}
                                className="bg-transparent border-none text-gray-600 dark:text-gray-400 text-sm cursor-pointer 
                                         px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                {name || "Untitled Board"}
                            </button>
                        ) : (
                            <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                                         rounded-md px-2 py-1 text-gray-900 dark:text-gray-100 text-sm min-w-[120px]
                                         focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                                autoFocus
                                onKeyDown={handleKeyPress}
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {user && (
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col min-w-[140px]">
                                    <div className="flex items-center justify-between text-[11px] font-medium text-gray-600 dark:text-gray-400">
                                        <span>{isPlus ? "Plus" : "Usage"}</span>
                                        <span>
                                            {usageLoading ||
                                            usage == null ||
                                            limit == null
                                                ? "--/--"
                                                : `${usage}/${limit}`}
                                        </span>
                                    </div>
                                    <div className="h-1.5 mt-1 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                        <div
                                            className={`h-full transition-all ${
                                                isPlus
                                                    ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500"
                                                    : "bg-blue-500"
                                            }`}
                                            style={{
                                                width: `${usagePercent}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                                {!isPlus && (
                                    <button
                                        onClick={handleUpgrade}
                                        disabled={upgradeLoading}
                                        className="text-xs px-3 py-1.5 rounded-md font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white shadow-sm"
                                    >
                                        {upgradeLoading ? "..." : "Upgrade"}
                                    </button>
                                )}
                                {isPlus && (
                                    <span className="text-xs px-2 py-1 rounded-md font-semibold bg-yellow-400/20 text-yellow-700 dark:text-yellow-300 border border-yellow-400/30">
                                        PLUS
                                    </span>
                                )}
                            </div>
                        )}
                        {isSaving && (
                            <div
                                className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2 
                                           bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full"
                            >
                                <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                                <span className="font-medium">Saving...</span>
                            </div>
                        )}
                        <ThemeToggle />
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-xs">
                                    {user?.isAnonymous
                                        ? "G"
                                        : user?.email
                                              ?.charAt(0)
                                              .toUpperCase() || "U"}
                                </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                {user?.isAnonymous
                                    ? "Guest"
                                    : user?.email?.split("@")[0] || "User"}
                            </p>
                        </div>
                    </div>
                </header>
            </div>
        </div>
    );
}

const areEqualTopBar = (prev: TopBarProps, next: TopBarProps) => {
    return (
        prev.name === next.name &&
        prev.onSetName === next.onSetName &&
        prev.user?.isAnonymous === next.user?.isAnonymous &&
        prev.user?.email === next.user?.email &&
        prev.isSaving === next.isSaving
    );
};

export default memo(TopBar, areEqualTopBar);
