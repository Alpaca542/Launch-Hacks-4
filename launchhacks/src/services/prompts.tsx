import { LAYOUT_TYPES } from "./layouts";

export const contentPrompt = (
    context: string,
    message: string,
    explanation_mode: string,
    LAYOUT_SCHEMA: string
): string => {
    return `Return ONLY a valid JSON array. Do not include markdown formatting, code blocks, or any text before or after the JSON.
        
        RULES
        • Each object = exactly one tag from SCHEMA; no new tags.
        • You should educate the user about the concept by filling out the SCHEMA with the tags.
        • Use tags to explain the concept in a structured way.
        • Tone: encouraging, professional
        REMEMBER: THIS IS REALLY IMPORTANT 🚨: Focus strictly on the main topic. The provided context should be used only to clarify the topic or provide concrete examples — not as the focus of the explanation. If the context is irrelevant or distracting, ignore it entirely

        OUTPUT FORMAT
        Return ONLY a valid JSON array like this: ["item1", "item2", "item3"]
        NO markdown code blocks, NO explanations, NO extra text.

        INPUT:
        MESSAGE: ${message}
        SCHEMA: ${LAYOUT_SCHEMA}`;
};

// ========================================================================
// Prompt for generating suggestions for next concepts
// ========================================================================
export const suggestionsPrompt = (message: string, inputMode: string) => {
    const template = (
        min: number,
        max: number
    ) => `Respond ONLY with a valid JSON array like ["topic1", "topic2"].
        Instructions:
        - Suggest exactly ${min}-${max} logical next topics.
        - Each topic <4 words, double‑quoted.
        - No explanation or extra text.
  
    Concept: ${message}`;

    switch (inputMode) {
        case "explain":
            return template(4, 5);
        case "argue":
            return template(3, 5);
        case "answer":
            return template(2, 3);
        default:
            return template(3, 5);
    }
};
// Generate a single icon for the concept "${message}".
//         - Use a simple, recognizable style.
//         - Ensure it visually represents the concept.
//         - Return ONLY the icon URL as a string.
export const iconPrompt = (message: string, inputMode: string) => {
    return `RETURN ONLY THE EMOJI CORRESPONDING TO THE CONCEPT "${message}".`;
};

export const layoutPrompt = (message: string, inputMode: string) => {
    return `Choose the best html layout the would explain "${message} in the most clear way. Reply with the number".
        - Ensure it visually represents the concept.
        - Return ONLY the layout number as an integer.
        LAYOUT TYPES:
        ${JSON.stringify(LAYOUT_TYPES)}`;
};
