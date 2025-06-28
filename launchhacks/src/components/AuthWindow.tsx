import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
} from "firebase/auth";

function AuthWindow({ onAuthed }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                onAuthed(auth.currentUser);
                setUser(user);
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, [onAuthed]);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            onAuthed(auth.currentUser);
        } catch (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            onAuthed(auth.currentUser);
        } catch (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            setError(error.message);
        }
    };

    if (isAuthenticated) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                    fontFamily: "Arial, sans-serif",
                }}
            >
                <div
                    style={{
                        padding: "2rem",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        backgroundColor: "#f9f9f9",
                        textAlign: "center",
                    }}
                >
                    <p style={{ marginBottom: "1rem" }}>
                        Welcome, {user?.email}!
                    </p>
                    <button
                        onClick={handleSignOut}
                        style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

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
