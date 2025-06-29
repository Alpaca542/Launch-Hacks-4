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
        <div className="auth-window-container">
            <div className="auth-window">
                <div className="auth-window-header">
                    <h2 className="auth-window-title">
                        {isSignUp ? "Create Account" : "Welcome Back"}
                    </h2>
                    <p className="auth-window-subtitle">
                        {isSignUp
                            ? "Join the platform to start building your boards"
                            : "Sign in to access your boards and continue your work"}
                    </p>
                </div>

                <form
                    onSubmit={isSignUp ? handleSignUp : handleSignIn}
                    className="auth-form"
                >
                    <div className="auth-input-group">
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="auth-input"
                        />
                    </div>

                    <div className="auth-input-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="auth-input"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`auth-submit-btn ${
                            loading ? "loading" : ""
                        }`}
                    >
                        {loading ? (
                            <div className="loading-spinner"></div>
                        ) : isSignUp ? (
                            "Create Account"
                        ) : (
                            "Sign In"
                        )}
                    </button>

                    {error && <div className="auth-error">{error}</div>}
                </form>

                <div className="auth-switch">
                    <span className="auth-switch-text">
                        {isSignUp
                            ? "Already have an account?"
                            : "Don't have an account?"}
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="auth-switch-btn"
                    >
                        {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AuthWindow;
