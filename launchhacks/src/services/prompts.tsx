// ========================================================================
// Prompt generators for AI educational platform
// Modes: "default" | "explain" | "argue" | "answer"
// Core principles (apply to EVERY mode):
//   1. Concept‑first — CONTEXT may appear ONLY if it clarifies the term or can be woven into a single concrete example.
//   2. Valid JSON array output, no stray text or comments.
//   3. Stick STRICTLY to SCHEMA tags; never invent new ones.
// ========================================================================

export const detailedExplanationPrompt = (
    context: string,
    message: string,
    SCHEMA: any[],
    inputMode: string
): string => {
    //---------------------------------------------------------------------
    // Helper: shared heading for instructions
    //---------------------------------------------------------------------
    const COMMON_RULES = `Return ONLY a valid JSON array.
        RULES
        • Each object = exactly one tag from SCHEMA; no new tags.
        • Include:
        • You should educate the user about the concept and then ask the quiz about the material you taught.
        • Use tags to make the reading experience diverse and engaging
        • If you have a long text, break it into multiple textblocks.
        • Only include tags that genuinely help explain the concept. Don't add tags unnecessarily or just to fill space. Code snippets should BE USED IF AND ONLY IF THE CONCEPT IS TECHNICAL
        • Tone: encouraging, professional
        • You need to have textblocks or lists separating each visual tag, e.g. img, vid, gif, codeblock, diagram, mindmap, table.
        • Make sure to put the concept over the context, not focusing on the context but rather on what actually needs to be explained.

        OUTPUT
        VALID JSON array only — no comments, or extra text. All the braces must be properly closed.`;

    //---------------------------------------------------------------------
    // Mode‑specific templates
    //---------------------------------------------------------------------
    if (inputMode === "default") {
        return `${COMMON_RULES}
    REQUIREMENTS:
    • Include exactly ONE {quiz} with 2-3 questions.
    • Include at least one of either {diagram | mindmap | table}.
    • Include at least one of either {img | vid | gif}.
    • Include at least five of either {textblock | ul | ol}.
    • Include exactly ONE of {tip | note | warning | quote | link}.
    • Cover: definition → explanation → worked example → real‑world analogy → what to explore next.
    • Break long texts into multiple textblocks.
    • Avoid filler tags.
  
    OUTPUT VALID JSON ARRAY ONLY.
    SCHEMA = ${JSON.stringify(SCHEMA)}
    CONTEXT = ${context}
    CONCEPT = ${message}
    REMEMBER: THIS IS REALLY IMPORTANT 🚨: Focus strictly on the main topic. The provided context should be used only to clarify the topic or provide concrete examples — not as the focus of the explanation. If the context is irrelevant or distracting, ignore it entirely.`;
    }

    if (inputMode === "explain") {
        return `${COMMON_RULES}
    DEEP MODE REQUIREMENTS (layer‑by‑layer dive)
    • Exactly ONE {quiz} with 2-3 challenging questions (conceptual/applied).
    • Include at least one of either {diagram | mindmap | table}.
    • Include at least three of {img | vid | gif} for visual clarity
    • Include at least eight of {textblock | ul | ol}, organised as: Definition → Foundation → Mechanics → Edge‑cases → Misconceptions → Applications.
    • Exactly ONE of {tip | note | warning | quote | link}.
    • Total objects: 12-16.
  
    OUTPUT VALID JSON ARRAY ONLY.
    SCHEMA = ${JSON.stringify(SCHEMA)}
    CONTEXT = ${context}
    CONCEPT = ${message}
    REMEMBER: THIS IS REALLY IMPORTANT 🚨: Focus strictly on the main topic. The provided context should be used only to clarify the topic or provide concrete examples — not as the focus of the explanation. If the context is irrelevant or distracting, ignore it entirely.`;
    }

    if (inputMode === "argue") {
        return `${COMMON_RULES}
    YOU SHOULD STRICTLY EVALUATE THE CONCEPT FROM MULTIPLE ANGLES providing PROS AND CONS
    • Include AT LEAST ONE {diagram | mindmap | table} to clarify the opinion.
    • Include AT LEAST ONE of {img | vid | gif} to illustrate the IDEA.
    • Include exactly ONE {quiz} with 2-3 questions to test understanding.
    • Include AS MANY of {textblock | ul | ol} AS NEEDED TO COVER THE OPINION
    • Keep total objects 8-12.
  
    OUTPUT VALID JSON ARRAY ONLY.
    SCHEMA = ${JSON.stringify(SCHEMA)}
    CONTEXT = ${context}
    CONCEPT = ${message}
    REMEMBER: THIS IS REALLY IMPORTANT 🚨: Focus strictly on the main topic. The provided context should be used only to clarify the topic or provide concrete examples — not as the focus of the explanation. If the context is irrelevant or distracting, ignore it entirely.`;
    }

    if (inputMode === "answer") {
        return `${COMMON_RULES}
    YOU SHOULD ANSWER THE USER'S QUESTION DIRECTLY
    • Focus on answering the user's question directly.
    • Include exactly ONE {quiz} with 2‑3 questions.
    • Include exactly ONE of {diagram | mindmap | table} ONLY IF it clarifies the answer.
    • Include exactly ONE of {img | vid | gif} ONLY IF it clarifies the answer.
    • Include AT LEAST TWO of {textblock | ul | ol}
    • Keep it concise and focused on the question.
    • Total objects: 5‑8.
  
    OUTPUT VALID JSON ARRAY ONLY.
    SCHEMA = ${JSON.stringify(SCHEMA)}
    CONTEXT = ${context}
    CONCEPT = ${message}
    REMEMBER: THIS IS REALLY IMPORTANT 🚨: Focus strictly on the main topic. The provided context should be used only to clarify the topic or provide concrete examples — not as the focus of the explanation. If the context is irrelevant or distracting, ignore it entirely.`;
    }
    return "";
};

// ========================================================================
// Prompt for generating a summary of a concept
// ========================================================================
export const summaryPrompt = (
    message: string,
    context: string,
    inputMode: string
) => {
    const base = (
        words: number
    ) => `PROVIDE A SHORT YET DEEP EXPLANATION OF THE TOPIC STRICTLY in ${words} words or less. USE THE PROVIDED CONTEXT TO GUIDE YOUR RESPONSE.
        CRITICAL:
        - Enclose EVERY key term in [square‑braces].
        - No introductory phrases, bullet points, or extra formatting.
        - Start immediately with content.
        - ONLY the explanation text.
    
        TOPIC: ${message}
        CONTEXT: ${context}
        REMEMBER: THIS IS REALLY IMPORTANT TO FOCUS ON THE TOPIC AND NOT ON THE CONTEXT. THE CONTEXT MAY BE USED TO CLARIFY THE TOPIC OR TO PROVIDE A CONCRETE EXAMPLE, BUT NOT TO FOCUS ON IT. IF IT IS NOT POSSIBLE TO FOCUS ON THE TOPIC, THEN DO COMPLETELY IGNORE THE CONTEXT.`;

    switch (inputMode) {
        case "explain":
            return base(60);
        case "argue":
            return `Balanced abstract (≤60 words) covering pros & cons of the TOPIC. USE THE PROVIDED CONTEXT TO GUIDE YOUR RESPONSE.
                    CRITICAL:
                    - Enclose key terms in [square‑braces].
                    - No introductory phrases.
                    - ONLY the abstract.
                
                    TOPIC: ${message}
                    CONTEXT: ${message}
                    REMEMBER: THIS IS REALLY IMPORTANT TO FOCUS ON THE TOPIC AND NOT ON THE CONTEXT. THE CONTEXT MAY BE USED TO CLARIFY THE TOPIC OR TO PROVIDE A CONCRETE EXAMPLE, BUT NOT TO FOCUS ON IT. IF IT IS NOT POSSIBLE TO FOCUS ON THE TOPIC, THEN DO COMPLETELY IGNORE THE CONTEXT.`;
        case "answer":
            return base(30);
        default:
            return base(50);
    }
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

// ========================================================================
// SCHEMA (unchanged)
// ========================================================================
export const SCHEMA = [
    { large_header: "Large Header Text" },
    { small_header: "Small Header Text" },
    { ul: ["Item one", "Item 2", "Item 3"] },
    {
        quiz: [
            {
                question: "What is the capital of France?",
                answers: [
                    { Berlin: "It's germany!" },
                    { Madrid: "It is spain :(" },
                    { Paris: "Correct! It's Paris!" },
                ],
                correctAnswer: 2,
            },
            {
                question: "What is the capital of Poland?",
                answers: [
                    { Berlin: "It's germany!" },
                    { Warshava: "Yahoo! It's Poland!" },
                    { Paris: "No!" },
                ],
                correctAnswer: 1,
            },
        ],
    },
    {
        img: [
            "very short image description(e.g. cats, play)",
            "The cats like to play with each other.",
        ],
    },
    {
        vid: [
            "video request(e.g. children playing in a football tournament)",
            "Plating football is a great way to stay active and have fun.",
        ],
    },
    {
        gif: [
            "very short gif description(e.g. frogs, jump)",
            "Frogs are amazing creatures that can jump really high.",
        ],
    },
    { textblock: "text, **text**, (text)[text.com]" },
    { ol: ["Heyyo", "Nice", "That's a list"] },
    { codeblock: "console.log('Hello World');" },
    { quote: "This is a quote" },
    { link: "https://en.wikipedia.org/wiki/example" },
    {
        table: [
            ["Header1", "Header2"],
            ["Row1Col1", "Row1Col2"],
            ["Row2Col1", "Row2Col2"],
        ],
    },
    {
        diagram: `flowchart TD
        A[Christmas] -->|Get money| B(Go shopping)
        B --> C{Let me think}
        C -->|One| D[Laptop]
        C -->|Two| E[iPhone]
        C -->|Three| F[fa:fa-car Car]`,
    },
    {
        mindmap: `
mindmap
  root((mindmapname))
    Branch1
      id((Sub1))
      Sub2
      ::icon(fa fa-book)
    Branch2
      id)Sub3(
      Sub4
    `,
    },
    { note: "This is a note." },
    { warning: "This is a warning note." },
    { tip: "This is a tip note." },
];
