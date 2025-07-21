import { LAYOUT_TYPES } from "./layouts";
//        REMEMBER: THIS IS REALLY IMPORTANT 🚨: Focus strictly on the main topic. The provided context should be used only to clarify the topic or provide concrete examples — not as the focus of the explanation. If the context is irrelevant or distracting, ignore it entirely
export const contentPrompt = (
    context: string,
    message: string,
    explanation_mode: string,
    LAYOUT_SCHEMA: string
): string => {
    return `You are an expert educational designer who creates comprehensive, visually-enhanced learning content.
    Return ONLY a valid array. Do not include markdown formatting, code blocks, or any text before or after the array.
        
        EDUCATIONAL CONTENT RULES:
        • COMPREHENSIVE: Each node should contain 100+ words of educational content total
        • WELL-STRUCTURED: Use proper paragraphs, clear explanations, and logical flow
        • VISUAL BALANCE: Combine substantial text with compelling visuals
        • EDUCATIONAL DEPTH: Explain concepts thoroughly with examples, context, and details
        • ENGAGING WRITING: Use clear, engaging language that teaches effectively
        
        TEXT GUIDELINES:
        • Titles: Clear, educational (3-8 words)
        • Paragraphs: Full explanations (3-5 sentences each, 20-40 words per sentence)
        • Descriptions: Detailed and informative (2-3 sentences minimum)
        • Content should flow logically and build understanding progressively
        
        IMAGE PROMPTS:
        • Educational and specific: "Detailed diagram of photosynthesis process in plant cells"
        • Include visual style: "realistic scientific illustration", "clean educational diagram"
        • Support the educational content meaningfully
        
        CONTENT BALANCE:
        • 70% substantial educational text
        • 30% compelling visuals that enhance learning
        • Ensure minimum 100 words total per node
        • Use markdown formatting in text (headings, bold, italics where appropriate)
        
        OUTPUT FORMAT:
        Return ONLY a valid array based on the SCHEMA. Follow the exact structure.
        NO markdown code blocks, NO extra text.
        RETURN AN ARRAY [] - NOT AN OBJECT!

        CONCEPT: ${message}
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
    return `RETURN ONLY THE FA ICON CORRESPONDING TO THE CONCEPT: "${message}". EXAMPLE: <i class="fas fa-check"></i>`;
};

export const layoutPrompt = (message: string, inputMode: string) => {
    return `Choose the best educational layout for "${message}" - prioritize comprehensive learning with visual appeal.
        
        SELECTION CRITERIA:
        • Educational Depth: Which layout allows for most comprehensive explanation?
        • Visual Learning: Which format combines visuals and text most effectively?
        • Information Architecture: Which layout organizes information most clearly?
        • Engagement: Which layout maintains interest while providing substantial content?
        
        LAYOUT PRIORITIES:
        • Use diagrams (3-6) for processes, systems, or data that need visual explanation
        • Use hero layouts (1, 7, 8) for major concepts needing detailed explanation with strong visual
        • Use story layouts (2, 14, 15) for step-by-step or chronological concepts
        • Use comprehensive layouts (12, 13, 16) for multi-faceted topics
        • Use media layouts (9, 13) for topics that benefit from video explanation
        
        Return ONLY the layout number as an integer.
        
        LAYOUT TYPES:
        ${JSON.stringify(LAYOUT_TYPES)}`;
};
