import supabase from "../supabase-client";

export interface ChatMessage {
    id?: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    user_id?: string;
    board_id: string;
    created_at?: string;
    updated_at?: string;
}

export interface ChatSession {
    id?: string;
    user_id?: string;
    board_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    message_count: number;
}

/**
 * Save a chat conversation to Supabase
 * This should be called only when the AI stream is complete
 */
export const saveChatConversation = async (
    userMessage: string,
    assistantResponse: string,
    boardId: string,
    userId?: string
): Promise<void> => {
    try {
        const now = new Date().toISOString();

        // Save user message
        const { error: userError } = await supabase
            .from("chat_messages")
            .insert({
                role: "user",
                content: userMessage,
                timestamp: now,
                user_id: userId || null,
                board_id: boardId,
            });

        if (userError) throw userError;

        // Save assistant response
        const { error: assistantError } = await supabase
            .from("chat_messages")
            .insert({
                role: "assistant",
                content: assistantResponse,
                timestamp: now,
                user_id: userId || null,
                board_id: boardId,
            });

        if (assistantError) throw assistantError;

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
    boardId: string,
    lastMessage: string,
    userId?: string
): Promise<void> => {
    try {
        // Check if session exists for this board
        const { data: existingSessions, error: queryError } = await supabase
            .from("chat_sessions")
            .select("*")
            .eq("board_id", boardId)
            .limit(1);

        if (queryError) throw queryError;

        const now = new Date().toISOString();

        if (!existingSessions || existingSessions.length === 0) {
            // Create new session for this board
            const { error: insertError } = await supabase
                .from("chat_sessions")
                .insert({
                    board_id: boardId,
                    user_id: userId || null,
                    title:
                        lastMessage.substring(0, 50) +
                        (lastMessage.length > 50 ? "..." : ""),
                    created_at: now,
                    updated_at: now,
                    message_count: 2, // user + assistant
                });

            if (insertError) throw insertError;
        } else {
            // Update existing session
            const session = existingSessions[0];
            const { error: updateError } = await supabase
                .from("chat_sessions")
                .update({
                    updated_at: now,
                    message_count: (session.message_count || 0) + 2,
                })
                .eq("id", session.id);

            if (updateError) throw updateError;
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
    boardId: string,
    limitCount: number = 50
): Promise<ChatMessage[]> => {
    try {
        const { data, error } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("board_id", boardId)
            .order("timestamp", { ascending: true })
            .limit(limitCount);

        if (error) throw error;

        return data || [];
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
        let query = supabase
            .from("chat_sessions")
            .select("*")
            .order("updated_at", { ascending: false })
            .limit(limitCount);

        if (userId) {
            query = query.eq("user_id", userId);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error("Error getting chat sessions:", error);
        return [];
    }
};

/**
 * Clear chat history for a board
 */
export const clearChatHistory = async (boardId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from("chat_messages")
            .delete()
            .eq("board_id", boardId);

        if (error) throw error;

        console.log("Chat history cleared for board:", boardId);
    } catch (error) {
        console.error("Error clearing chat history:", error);
        throw error;
    }
};
