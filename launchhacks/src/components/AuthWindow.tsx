import { useState } from "react";
import { auth } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { ERROR_MESSAGES } from "../utils/constants";

function AuthWindow() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            // Validate inputs
            if (!email || !password) {
                throw new Error("Please fill in all fields");
            }

            // Enhanced email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
            }

            if (password.length < 6) {
                throw new Error(ERROR_MESSAGES.WEAK_PASSWORD);
            }
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            console.log("User created successfully:", userCredential.user.uid);
        } catch (error: any) {
            let errorMessage = "Failed to create account";
            if (error.code === "auth/email-already-in-use") {
                errorMessage = ERROR_MESSAGES.EMAIL_IN_USE;
            } else if (error.code === "auth/invalid-email") {
                errorMessage = ERROR_MESSAGES.INVALID_EMAIL;
            } else if (error.code === "auth/weak-password") {
                errorMessage = ERROR_MESSAGES.WEAK_PASSWORD;
            } else if (error.code === "auth/operation-not-allowed") {
                errorMessage =
                    "Email/password accounts are not enabled. Please contact support.";
            } else if (error.message) {
                errorMessage = error.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            // Validate inputs
            if (!email || !password) {
                throw new Error("Please fill in all fields");
            }

            // Enhanced email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
            }
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
            console.log(
                "User signed in successfully:",
                userCredential.user.uid
            );
        } catch (error: any) {
            let errorMessage = "Failed to sign in";
            if (error.code === "auth/user-not-found") {
                errorMessage = ERROR_MESSAGES.USER_NOT_FOUND;
            } else if (error.code === "auth/wrong-password") {
                errorMessage = ERROR_MESSAGES.WRONG_PASSWORD;
            } else if (error.code === "auth/invalid-email") {
                errorMessage = ERROR_MESSAGES.INVALID_EMAIL;
            } else if (error.code === "auth/user-disabled") {
                errorMessage =
                    "This account has been disabled. Please contact support.";
            } else if (error.code === "auth/too-many-requests") {
                errorMessage = ERROR_MESSAGES.TOO_MANY_REQUESTS;
            } else if (error.message) {
                errorMessage = error.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#1a1a1d]/90 dark:bg-[#1a1a1d]/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full p-8 bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-indigo-900/95 rounded-3xl shadow-2xl border-2 border-indigo-700/60 dark:border-purple-700/60 backdrop-blur-sm animate-fade-in hover:shadow-3xl hover:shadow-indigo-500/10 transition-all duration-500">
                {/* Header */}
                <div className="text-center mb-8 animate-slide-in">
                    <div className="inline-block p-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full mb-4 border border-indigo-500/30 animate-pulse-glow">
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                                T
                            </span>
                        </div>
                    </div>
                    <h2 className="text-4xl font-bold text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text mb-3">
                        {isSignUp ? "Join TinkFlow" : "Welcome Back"}
                    </h2>
                    <p className="text-[#b0b3b8] dark:text-[#b0b3b8] text-sm leading-relaxed">
                        {isSignUp
                            ? "Start your AI-powered learning journey"
                            : "Continue exploring concepts with AI"}
                    </p>
                </div>

                <form
                    onSubmit={isSignUp ? handleSignUp : handleSignIn}
                    className="space-y-6"
                >
                    {/* Email Field */}
                    <div className="space-y-2">
                        <label
                            htmlFor="email"
                            className="text-sm font-semibold text-indigo-300 dark:text-purple-300 flex items-center gap-2"
                        >
                            <svg
                                className="w-4 h-4 text-indigo-400 dark:text-purple-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            aria-describedby="email-hint"
                            className="w-full px-4 py-3 bg-[#2a2a2e] dark:bg-[#2a2a2e] border border-indigo-600/30 dark:border-purple-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/50 dark:focus:ring-purple-400/50 focus:border-indigo-400/50 dark:focus:border-purple-400/50 text-white placeholder-indigo-400 dark:placeholder-purple-400 transition-all duration-300 backdrop-blur-sm shadow-inner hover:border-indigo-500/80 dark:hover:border-purple-500/80 focus:scale-[1.02] active:scale-[0.98]"
                            placeholder="Enter your email address"
                        />
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label
                            htmlFor="password"
                            className="text-sm font-semibold text-indigo-300 dark:text-purple-300 flex items-center gap-2"
                        >
                            <svg
                                className="w-4 h-4 text-indigo-400 dark:text-purple-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            aria-describedby="password-hint"
                            className="w-full px-4 py-3 bg-[#2a2a2e] dark:bg-[#2a2a2e] border border-indigo-600/30 dark:border-purple-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/50 dark:focus:ring-purple-400/50 focus:border-indigo-400/50 dark:focus:border-purple-400/50 text-white placeholder-indigo-400 dark:placeholder-purple-400 transition-all duration-300 backdrop-blur-sm shadow-inner hover:border-indigo-500/80 dark:hover:border-purple-500/80 focus:scale-[1.02] active:scale-[0.98]"
                            placeholder="Enter your password"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div
                            className="bg-red-900/20 dark:bg-red-900/30 border border-red-500/30 dark:border-red-500/40 rounded-xl p-4 backdrop-blur-sm animate-fade-in"
                            role="alert"
                            aria-live="polite"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-red-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg
                                        className="w-4 h-4 text-red-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                <div className="text-red-300 text-sm leading-relaxed">
                                    {error}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        aria-label={
                            isSignUp
                                ? "Create new account"
                                : "Sign in to your account"
                        }
                        className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-400/40 disabled:shadow-slate-500/25 disabled:cursor-not-allowed backdrop-blur-sm animate-float active:scale-95"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>
                                    {isSignUp
                                        ? "Creating account..."
                                        : "Signing in..."}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d={
                                            isSignUp
                                                ? "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                                : "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                                        }
                                    />
                                </svg>
                                <span>
                                    {isSignUp ? "Create Account" : "Sign In"}
                                </span>
                            </div>
                        )}
                    </button>
                </form>

                {/* Toggle Form Type */}
                <div className="mt-8 text-center">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-indigo-600/50 dark:border-purple-600/50"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-gradient-to-r from-indigo-900/95 via-purple-900/95 to-indigo-900/95 text-indigo-400 dark:text-purple-400">
                                {isSignUp
                                    ? "Already have an account?"
                                    : "New to TinkFlow?"}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        aria-label={
                            isSignUp
                                ? "Switch to sign in"
                                : "Switch to create new account"
                        }
                        className="mt-4 w-full py-3 px-6 bg-[#2a2a2e] dark:bg-[#2a2a2e] hover:bg-indigo-700/90 dark:hover:bg-purple-700/90 text-indigo-300 dark:text-purple-300 hover:text-white font-semibold rounded-xl transition-all duration-300 border border-indigo-600/60 dark:border-purple-600/60 hover:border-indigo-500/80 dark:hover:border-purple-500/80 backdrop-blur-sm transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                                />
                            </svg>
                            <span>
                                {isSignUp
                                    ? "Sign In Instead"
                                    : "Create New Account"}
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AuthWindow;
