import { LAYOUT_TYPES } from "./layouts";
export const quizPrompt = (message: string) => {
    return `You are an expert quiz creator. Generate a quiz based on the concept: "${message}".

    - Create 4+ questions with 4 answer options each.
    - Ensure questions are clear and concise.
    - Provide one correct answer per question.
    - Format the output as a JSON array of objects, each with "question", "options", and "answer" fields.

    Example output:
    [
        {
            question: "What is React?",
            options: ["A JavaScript library", "A database", "A programming language", "A CSS framework"],
            answer: 0
        },
        {
            question: "Which company developed React?",
            options: ["Google", "Facebook", "Microsoft", "Amazon"],
            answer: 1
        },
        ...
    ]`;
};

// Build a layout‑aware prompt for the educational‑content model
export const contentPrompt = (
    message: string,
    context: string,
    LAYOUT_SCHEMA: string,
    layout: number
) => `
You are creating educational content. **Return ONLY a valid JSON _array_ — no extra text.**

════════════════════════════════════════
GLOBAL GUIDELINES
════════════════════════════════════════
• **Comprehensive** – ≥100 words per node  
• **Well‑structured** – 3–5 sentences per paragraph (20–40 words each)  
• **Visual balance** – 70% rich markdown text, 30% visuals  
• **Educational depth** – thorough explanations, concrete examples  
• **Engaging writing** – heavy markdown (**bold**, *italic*, ## headers, - lists)
USE A LOT OF MARKDOWN!!!!
════════════════════════════════════════
LAYOUT‑SPECIFIC RULES
════════════════════════════════════════
${
    layout === 12
        ? `FOR THIS LAYOUT → Return exactly ["image_prompt", ["insight1", "insight2", "insight3", "insight4"]] — each insight 40–50 words.`
        : ""
}
${
    layout === 15
        ? `FOR THIS TIMELINE → [date1, image_prompt1, description1, …] — 4–8 items, 2–3 sentences per description.`
        : ""
}
${layout === 14 ? `FOR THIS LAYOUT → Keep descriptions 2–3 sentences.` : ""}
${layout === 2 ? `FOR THIS LAYOUT  → Keep descriptions 2–3 sentences.` : ""}


IMAGE PROMPTS
• Nice and simple image prompts like "Illustration of photosynthesis" or "Diagram of the water cycle".
• No need for complex prompts, just clear and concise descriptions.

OUTPUT FORMAT (STRICT)
• Return **only** a JSON array \`[]\`.  
• Never nest objects inside the array (arrays only).  
• Absolutely no prose or code fences outside the array.

CONCEPT: ${message}
CONTEXT: ${context}
SCHEMA: ${LAYOUT_SCHEMA}
`;

// Build a layout‑aware prompt for the educational‑content model
export const diagramContentPrompt = (
    diagram: string,
    message: string,
    context: string
) => `
You are creating educational content.
════════════════════════════════════════
GLOBAL GUIDELINES
════════════════════════════════════════
• **Well‑structured** – 3–5 sentences per paragraph (20-40 words each)  
• **Educational depth** – thorough explanations, concrete examples  
• **Engaging writing** – heavy markdown (**bold**, *italic*, ## headers, - lists)
USE A LOT OF MARKDOWN!

════════════════════════════════════════
LAYOUT‑SPECIFIC RULES
════════════════════════════════════════
YOU NEED TO RETURN A DESCRIPTION TO THIS MERMAID DIAGRAM: ${diagram}
THE TOPIC IS: ${message}
THE CONTEXT IS: ${context}
OUTPUT FORMAT (STRICT)
• Return **only** an EXPLANATION OF THE DIAGRAM AS A STRING.
`;

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

export const iconPrompt = (message: string, _inputMode: string) => {
    return `RETURN ONLY THE FA ICON CORRESPONDING TO THE CONCEPT: "${message}". EXAMPLE: <i class="fas fa-check"></i>. If no icon is suitable, return the closest match or a generic icon like <i class="fas fa-lightbulb"></i>. Do not return any text or explanation, just the icon HTML.`;
};

export const layoutPrompt = (
    message: string,
    _inputMode: string,
    lastTwoLayouts: number[] = []
) => {
    const layoutHistoryText =
        lastTwoLayouts.length > 0
            ? `Last used layouts: ${lastTwoLayouts.join(", ")}`
            : "No recent layout history available.";

    return `Choose the best educational layout for "${message}" - prioritize diversity and optimal content presentation.
        
        ${layoutHistoryText}
        
        Use diverse layouts for better user experience. If multiple layouts are suitable, STRONGLY PREFER layouts that are NOT in the recent history.
        
        SELECTION CRITERIA:
        • Layout Variety - Avoid recently used layouts (${lastTwoLayouts.join(
            ", "
        )})
        • Content Type Match: Which layout best fits the specific content structure?
        • Visual Balance: Optimal text-to-visual ratio for the topic
        • Learning Effectiveness: Best presentation for comprehension
        
        PRIORITY LAYOUT SELECTION GUIDE:
        • **Technical/Programming topics**: Use layouts 17, 18 (code tutorials, API docs), 1, 8
        • **Process/systems**: Use diagram layouts 3, 4, 5(good for composition data), 6
        • **Comprehensive explanations**: Use hero layouts 1, 7, 12
        • **Step-by-step content**: Use layouts 2, 15 (timeline), 17 (code tutorial)
        • **Multi-aspect topics**: Use layouts 12, 13, 16
        • **Media-heavy content**: Use layouts 9, 13
        • **Quick concepts**: Use layouts 1, 6, 8
        • **Historical/chronological**: Use layout 15
        • **Comparison content**: Use layouts 8, 16, 14
        
        DIVERSIFICATION RULES:
        - PRIORITY #1: Prefer layouts not in recent history: ${lastTwoLayouts.join(
            ", "
        )}
        - Prioritize new code layouts (17, 18) for technical content
        - Rotate between different layout families
        - Match complexity of layout to complexity of content
        - Consider visual appeal and educational effectiveness
        
        Return ONLY the layout number as an integer (1-18).
        
        LAYOUT TYPES:
        ${JSON.stringify(LAYOUT_TYPES)}`;
};
