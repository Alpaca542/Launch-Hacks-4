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
            // Authentication state is now handled by useAuth hook
            console.log("User created successfully:", userCredential.user.uid);
        } catch (error: any) {
            console.error("Sign up error:", error);

            // Handle specific Firebase auth errors
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
            // Authentication state is now handled by useAuth hook
            console.log(
                "User signed in successfully:",
                userCredential.user.uid
            );
        } catch (error: any) {
            console.error("Sign in error:", error);

            // Handle specific Firebase auth errors
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
            <div
                className="bg-[#222226] dark:bg-[#222226] rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.7),0_10px_20px_rgba(0,0,0,0.5)] 
                          p-8 w-full max-w-md border border-white/12 dark:border-white/12"
            >
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                                T
                            </span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-[#f8faff] dark:text-[#f8faff] mb-2">
                        {isSignUp ? "Join TinkFlow" : "Welcome Back"}
                    </h2>
                    <p className="text-[#b0b3b8] dark:text-[#b0b3b8] text-sm">
                        {isSignUp
                            ? "Start your AI-powered learning journey"
                            : "Continue exploring concepts with AI"}
                    </p>
                </div>

                <form
                    onSubmit={isSignUp ? handleSignUp : handleSignIn}
                    className="space-y-6"
                >
                    <div>
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-[#2a2a2e] dark:bg-[#2a2a2e] border border-white/15 dark:border-white/15 
                                     rounded-lg text-[#f8faff] dark:text-[#f8faff] placeholder-[#8b949e] dark:placeholder-[#8b949e] 
                                     focus:outline-none focus:border-[#5a9cf8] dark:focus:border-[#5a9cf8] focus:shadow-[0_0_0_3px_rgba(90,156,248,0.25)]
                                     transition-all duration-200"
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-[#2a2a2e] dark:bg-[#2a2a2e] border border-white/15 dark:border-white/15 
                                     rounded-lg text-[#f8faff] dark:text-[#f8faff] placeholder-[#8b949e] dark:placeholder-[#8b949e] 
                                     focus:outline-none focus:border-[#5a9cf8] dark:focus:border-[#5a9cf8] focus:shadow-[0_0_0_3px_rgba(90,156,248,0.25)]
                                     transition-all duration-200"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 
                                   ${
                                       loading
                                           ? "bg-[#3a3a3e] dark:bg-[#3a3a3e] cursor-not-allowed opacity-60"
                                           : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:from-indigo-700 active:to-purple-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                   }
                                   focus:outline-none focus:shadow-[0_0_0_3px_rgba(99,102,241,0.4)]`}
                    >
                        {loading ? (
                            <div className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : isSignUp ? (
                            "Create Account"
                        ) : (
                            "Sign In"
                        )}
                    </button>

                    {error && (
                        <div
                            className="bg-red-900/20 dark:bg-red-900/30 border border-red-500/30 dark:border-red-500/40 
                                       rounded-lg p-3 text-red-400 dark:text-red-400 text-sm"
                        >
                            {error}
                        </div>
                    )}
                </form>

                <div className="auth-switch text-center mt-6">
                    <span className="auth-switch-text text-gray-400 dark:text-gray-400 text-sm">
                        {isSignUp
                            ? "Already have an account?"
                            : "Don't have an account?"}
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="auth-switch-btn ml-2 text-blue-400 dark:text-blue-400 hover:text-blue-300 dark:hover:text-blue-300 
                                 text-sm font-medium transition-colors duration-200 bg-transparent border-none cursor-pointer"
                    >
                        {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AuthWindow;
