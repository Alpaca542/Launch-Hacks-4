import { useState } from "react";
import supabase from "../supabase-client";
import {
    EnvelopeIcon,
    LockClosedIcon,
    EyeIcon,
    EyeSlashIcon,
    ArrowRightOnRectangleIcon,
    UserPlusIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { ERROR_MESSAGES } from "../utils/constants";

/**
 * AuthWindow – polished authentication modal with light & dark themes
 * – clean minimal styling (Tailwind + dark: variants)
 * – one‑tap visibility toggle for passwords
 * – animated cross‑fade / slide when switching between Sign‑In & Sign‑Up
 */
export default function AuthWindow() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // 🔐 ────── handlers
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (!email || !password)
                throw new Error("Please fill in all fields");
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email))
                throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
            if (password.length < 6)
                throw new Error(ERROR_MESSAGES.WEAK_PASSWORD);

            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message || "Authentication error");
        } finally {
            setLoading(false);
        }
    };

    // 🎨 ────── shared input styles
    const inputClass =
        "w-full px-4 py-3 rounded-lg border bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 dark:bg-gray-950/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-md rounded-3xl shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
                {/* ─── header ───────────────────────────────────────── */}
                <div className="px-8 pt-8 pb-4 text-center">
                    <AnimatePresence mode="wait">
                        <motion.h2
                            key={isSignUp ? "signup-header" : "signin-header"}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className="text-3xl font-semibold text-gray-900 dark:text-gray-100"
                        >
                            {isSignUp ? "Create an account" : "Welcome back"}
                        </motion.h2>
                    </AnimatePresence>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {isSignUp
                            ? "Start your AI‑powered journey."
                            : "Sign in to continue."}
                    </p>
                </div>

                {/* ─── form ─────────────────────────────────────────── */}
                <form onSubmit={handleAuth} className="px-8 pb-8 space-y-6">
                    {/* email */}
                    <div>
                        <label htmlFor="email" className="sr-only">
                            Email
                        </label>
                        <div className="relative">
                            <EnvelopeIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className={`${inputClass} pl-11`}
                            />
                        </div>
                    </div>

                    {/* password */}
                    <div>
                        <label htmlFor="password" className="sr-only">
                            Password
                        </label>
                        <div className="relative">
                            <LockClosedIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                id="password"
                                type={passwordVisible ? "text" : "password"}
                                autoComplete={
                                    isSignUp
                                        ? "new-password"
                                        : "current-password"
                                }
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`${inputClass} pl-11 pr-11`}
                            />
                            <button
                                type="button"
                                onClick={() => setPasswordVisible((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                aria-label={
                                    passwordVisible
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {passwordVisible ? (
                                    <EyeSlashIcon className="h-5 w-5" />
                                ) : (
                                    <EyeIcon className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                key="error"
                                initial={{ y: -6, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -6, opacity: 0 }}
                                className="flex items-start gap-3 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300"
                                role="alert"
                            >
                                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                        {loading ? (
                            <svg
                                className="h-5 w-5 animate-spin text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8H4z"
                                ></path>
                            </svg>
                        ) : isSignUp ? (
                            <UserPlusIcon className="h-5 w-5" />
                        ) : (
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        )}
                        <span>
                            {loading
                                ? isSignUp
                                    ? "Creating account…"
                                    : "Signing in…"
                                : isSignUp
                                ? "Sign Up"
                                : "Sign In"}
                        </span>
                    </button>
                </form>

                {/* ─── footer ───────────────────────────────────────── */}
                <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isSignUp
                            ? "Already have an account?"
                            : "New to TinkFlow?"}
                    </p>
                    <button
                        onClick={() => setIsSignUp((s) => !s)}
                        type="button"
                        className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                        {isSignUp ? "Sign In" : "Create an account"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
