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
        <div className="auth-window-container fixed inset-0 bg-gray-900/80 dark:bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="auth-window bg-gray-800 dark:bg-gray-900 rounded-lg shadow-2xl p-8 w-full max-w-md border border-gray-700 dark:border-gray-600">
                <div className="auth-window-header text-center mb-8">
                    <h2 className="auth-window-title text-2xl font-bold text-white dark:text-white mb-2">
                        {isSignUp ? "Create Account" : "Welcome Back"}
                    </h2>
                    <p className="auth-window-subtitle text-gray-400 dark:text-gray-400 text-sm">
                        {isSignUp
                            ? "Join the platform to start building your boards"
                            : "Sign in to access your boards and continue your work"}
                    </p>
                </div>

                <form
                    onSubmit={isSignUp ? handleSignUp : handleSignIn}
                    className="auth-form space-y-6"
                >
                    <div className="auth-input-group">
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="auth-input w-full px-4 py-3 bg-gray-700 dark:bg-gray-800 border border-gray-600 dark:border-gray-700 
                                     rounded-lg text-white dark:text-white placeholder-gray-400 dark:placeholder-gray-400 
                                     focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 
                                     transition-all duration-200"
                        />
                    </div>

                    <div className="auth-input-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="auth-input w-full px-4 py-3 bg-gray-700 dark:bg-gray-800 border border-gray-600 dark:border-gray-700 
                                     rounded-lg text-white dark:text-white placeholder-gray-400 dark:placeholder-gray-400 
                                     focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 
                                     transition-all duration-200"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`auth-submit-btn w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 
                                   ${
                                       loading
                                           ? "bg-gray-600 dark:bg-gray-700 cursor-not-allowed"
                                           : "bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 dark:active:bg-blue-700"
                                   }
                                   focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20
                                   ${loading ? "loading" : ""}`}
                    >
                        {loading ? (
                            <div className="loading-spinner inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : isSignUp ? (
                            "Create Account"
                        ) : (
                            "Sign In"
                        )}
                    </button>

                    {error && (
                        <div
                            className="auth-error bg-red-900/20 dark:bg-red-900/30 border border-red-500/30 dark:border-red-500/40 
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
