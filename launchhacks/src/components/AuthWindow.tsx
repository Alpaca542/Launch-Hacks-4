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

            await createUserWithEmailAndPassword(auth, email, password);
            // Authentication state is now handled by useAuth hook
        } catch (error: any) {
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

            await signInWithEmailAndPassword(auth, email, password);
            // Authentication state is now handled by useAuth hook
        } catch (error: any) {
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
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                fontFamily: "Arial, sans-serif",
                backgroundColor: "#f5f5f5",
            }}
        >
            <div
                style={{
                    padding: "2rem",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    minWidth: "300px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
            >
                <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    {isSignUp ? "Sign Up" : "Sign In"}
                </h2>
                <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            marginBottom: "1rem",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            fontSize: "1rem",
                            boxSizing: "border-box",
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            marginBottom: "1rem",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            fontSize: "1rem",
                            boxSizing: "border-box",
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            backgroundColor: loading ? "#ccc" : "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "1rem",
                            cursor: loading ? "not-allowed" : "pointer",
                            marginBottom: "1rem",
                        }}
                    >
                        {loading
                            ? "Loading..."
                            : isSignUp
                            ? "Sign Up"
                            : "Sign In"}
                    </button>
                    {error && (
                        <p
                            style={{
                                color: "red",
                                textAlign: "center",
                                marginBottom: "1rem",
                                fontSize: "0.9rem",
                            }}
                        >
                            {error}
                        </p>
                    )}
                </form>
                <p style={{ textAlign: "center", margin: 0 }}>
                    {isSignUp
                        ? "Already have an account?"
                        : "Don't have an account?"}
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#007bff",
                            textDecoration: "underline",
                            cursor: "pointer",
                            marginLeft: "0.5rem",
                            fontSize: "1rem",
                        }}
                    >
                        {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default AuthWindow;
