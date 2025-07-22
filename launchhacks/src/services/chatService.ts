import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    Timestamp,
    where,
    limit,
    getDocs,
    updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export interface ChatMessage {
    id?: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Timestamp;
    userId?: string;
    boardId: string; // Changed from sessionId to boardId
}

export interface ChatSession {
    id?: string;
    userId?: string;
    boardId: string; // Added boardId to associate sessions with boards
    title: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    messageCount: number;
}

/**
 * Save a chat conversation to Firestore
 * This should be called only when the AI stream is complete
 */
export const saveChatConversation = async (
    userMessage: string,
    assistantResponse: string,
    boardId: string, // Changed from sessionId to boardId
    userId?: string
): Promise<void> => {
    try {
        const messagesRef = collection(db, "chatMessages");

        // Save user message
        await addDoc(messagesRef, {
            role: "user",
            content: userMessage,
            timestamp: Timestamp.now(),
            userId: userId || null,
            boardId: boardId, // Changed from sessionId to boardId
        });

        // Save assistant response
        await addDoc(messagesRef, {
            role: "assistant",
            content: assistantResponse,
            timestamp: Timestamp.now(),
            userId: userId || null,
            boardId: boardId, // Changed from sessionId to boardId
        });

        // Update or create chat session for this board
        await updateChatSession(boardId, userMessage, userId);

        console.log("Chat conversation saved successfully for board:", boardId);
    } catch (error) {
        console.error("Error saving chat conversation:", error);
        throw error;
    }
};

/**
 * Update chat session metadata
 */
const updateChatSession = async (
    boardId: string, // Changed from sessionId to boardId
    lastMessage: string,
    userId?: string
): Promise<void> => {
    try {
        const sessionsRef = collection(db, "chatSessions");

        // Check if session exists for this board
        const sessionQuery = query(
            sessionsRef,
            where("boardId", "==", boardId)
        );

        const sessionSnapshot = await getDocs(sessionQuery);

        if (sessionSnapshot.empty) {
            // Create new session for this board
            await addDoc(sessionsRef, {
                boardId: boardId,
                userId: userId || null,
                title:
                    lastMessage.substring(0, 50) +
                    (lastMessage.length > 50 ? "..." : ""),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                messageCount: 2, // user + assistant
            });
        } else {
            // Update existing session
            const sessionDoc = sessionSnapshot.docs[0];
            const currentData = sessionDoc.data();

            await updateDoc(sessionDoc.ref, {
                updatedAt: Timestamp.now(),
                messageCount: (currentData.messageCount || 0) + 2,
            });
        }
    } catch (error) {
        console.error("Error updating chat session:", error);
        throw error;
    }
};

/**
 * Get chat history for a board
 */
export const getChatHistory = async (
    boardId: string, // Changed from sessionId to boardId
    limitCount: number = 50
): Promise<ChatMessage[]> => {
    try {
        const messagesRef = collection(db, "chatMessages");
        const q = query(
            messagesRef,
            where("boardId", "==", boardId), // Changed from sessionId to boardId
            orderBy("timestamp", "asc"),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(
            (doc) =>
                ({
                    id: doc.id,
                    ...doc.data(),
                } as ChatMessage)
        );
    } catch (error) {
        console.error("Error getting chat history:", error);
        return [];
    }
};

/**
 * Get recent chat sessions for a user
 */
export const getChatSessions = async (
    userId?: string,
    limitCount: number = 20
): Promise<ChatSession[]> => {
    try {
        const sessionsRef = collection(db, "chatSessions");
        let q;

        if (userId) {
            q = query(
                sessionsRef,
                where("userId", "==", userId),
                orderBy("updatedAt", "desc"),
                limit(limitCount)
            );
        } else {
            q = query(
                sessionsRef,
                orderBy("updatedAt", "desc"),
                limit(limitCount)
            );
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(
            (doc) =>
                ({
                    id: doc.id,
                    ...doc.data(),
                } as ChatSession)
        );
    } catch (error) {
        console.error("Error getting chat sessions:", error);
        return [];
    }
};

/**
 * Subscribe to real-time chat updates for a board
 */
export const subscribeToChatUpdates = (
    boardId: string, // Changed from sessionId to boardId
    callback: (messages: ChatMessage[]) => void
): (() => void) => {
    const messagesRef = collection(db, "chatMessages");
    const q = query(
        messagesRef,
        where("boardId", "==", boardId), // Changed from sessionId to boardId
        orderBy("timestamp", "asc")
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(
            (doc) =>
                ({
                    id: doc.id,
                    ...doc.data(),
                } as ChatMessage)
        );
        callback(messages);
    });
};
