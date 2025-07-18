// ========================================================================
// Prompt generators for AI educational platform
// Modes: "default" | "deep" | "argue" | "answer"
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
        • Use different tags to make the reading experience diverse and engaging
        • If you have a long text, break it into multiple textblocks.
        • Only include tags that genuinely help explain the concept. Don't add tags unnecessarily or just to fill space.
        • Tone: encouraging, professional
        • You need to have textblocks or lists separating each visual tag, e.g. img, vid, gif, codeblock, diagram, htmlCanvas, table.
        • Make sure to put the concept over the context, not focusing on the context but rather on what actually needs to be explained.

        OUTPUT
        VALID JSON array only — no comments, or extra text. All the braces must be properly closed.`;

    //---------------------------------------------------------------------
    // Mode‑specific templates
    //---------------------------------------------------------------------
    if (inputMode === "default") {
        return `${COMMON_RULES}
    REQUIREMENTS:
    • Include exactly ONE {quiz} with 3‑5 questions.
    • Include ≥1 of {codeblock | diagram | htmlCanvas | table}.
    • Include ≥2 of {img | vid | gif}.
    • Include ≥5 of {textblock | ul | ol}.
    • Include exactly ONE of {tip | note | warning | quote | link}.
    • Cover: definition → explanation → worked example → real‑world analogy → what to explore next.
    • Break long texts into multiple textblocks.
    • Avoid filler tags.
    • Only include tags that genuinely help explain the concept. Don't add tags unnecessarily or just to fill space. A code snippet should be used only if the concept is relevant to the code it and helps explain it better
  
    OUTPUT VALID JSON ARRAY ONLY.
    SCHEMA = ${JSON.stringify(SCHEMA)}
    CONTEXT = ${context}
    CONCEPT = ${message}
    REMEMBER: THIS IS REALLY IMPORTANT TO FOCUS ON THE TOPIC AND NOT ON THE CONTEXT. THE CONTEXT MAY BE USED TO CLARIFY THE TOPIC OR TO PROVIDE A CONCRETE EXAMPLE, BUT NOT TO FOCUS ON IT. IF IT IS NOT POSSIBLE TO FOCUS ON THE TOPIC, THEN DO COMPLETELY IGNORE THE CONTEXT.`;
    }

    if (inputMode === "deep") {
        return `${COMMON_RULES}
    DEEP MODE REQUIREMENTS (layer‑by‑layer dive)
    • Exactly ONE {quiz} with ≥5 challenging questions (conceptual + applied).
    • Include ≥2 of {codeblock | diagram | htmlCanvas | table}.
    • Include ≥3 of {img | vid | gif} for abstract ↔ concrete bridges.
    • Include ≥8 of {textblock | ul | ol}, organised as: Definition → Foundation → Mechanics → Edge‑cases → Misconceptions → Applications.
    • Exactly ONE of {tip | note | warning | quote | link}.
    • Highlight at least two common misconceptions explicitly.
  
    OUTPUT VALID JSON ARRAY ONLY.
    SCHEMA = ${JSON.stringify(SCHEMA)}
    CONTEXT = ${context}
    CONCEPT = ${message}
    REMEMBER: THIS IS REALLY IMPORTANT TO FOCUS ON THE TOPIC AND NOT ON THE CONTEXT. THE CONTEXT MAY BE USED TO CLARIFY THE TOPIC OR TO PROVIDE A CONCRETE EXAMPLE, BUT NOT TO FOCUS ON IT. IF IT IS NOT POSSIBLE TO FOCUS ON THE TOPIC, THEN DO COMPLETELY IGNORE THE CONTEXT.`;
    }

    if (inputMode === "argue") {
        return `${COMMON_RULES}
    YOU SHOULD STRICTLY EVALUATE THE CONCEPT FROM MULTIPLE ANGLES
    • Include AT LEAST ONE {codeblock | diagram | htmlCanvas | table} to clarify the opinion.
    • Include AT LEAST ONE of {img | vid | gif} to illustrate the IDEA.
    • Include exactly ONE {quiz} with 3‑5 questions to test understanding.
    • Include AS MANY of {textblock | ul | ol} AS NEEDED TO COVER THE OPINION
    • Keep total objects 8-12.
  
    OUTPUT VALID JSON ARRAY ONLY.
    SCHEMA = ${JSON.stringify(SCHEMA)}
    CONTEXT = ${context}
    CONCEPT = ${message}
    REMEMBER: THIS IS REALLY IMPORTANT TO FOCUS ON THE TOPIC AND NOT ON THE CONTEXT. THE CONTEXT MAY BE USED TO CLARIFY THE TOPIC OR TO PROVIDE A CONCRETE EXAMPLE, BUT NOT TO FOCUS ON IT. IF IT IS NOT POSSIBLE TO FOCUS ON THE TOPIC, THEN DO COMPLETELY IGNORE THE CONTEXT.`;
    }

    if (inputMode === "answer") {
        return `${COMMON_RULES}
    YOU SHOULD ANSWER THE USER'S QUESTION DIRECTLY
    • Focus on answering the user's question directly.
    • Include exactly ONE {quiz} with 2‑3 questions.
    • Include exactly ONE of {codeblock | diagram | htmlCanvas | table} ONLY IF it clarifies the answer.
    • Include exactly ONE of {img | vid | gif} ONLY IF it clarifies the answer.
    • Include AT LEAST TWO of {textblock | ul | ol}
    • Keep it concise and focused on the question.
    • Total objects: 5‑8.
  
    OUTPUT VALID JSON ARRAY ONLY.
    SCHEMA = ${JSON.stringify(SCHEMA)}
    CONTEXT = ${context}
    CONCEPT = ${message}
    REMEMBER: THIS IS REALLY IMPORTANT TO FOCUS ON THE TOPIC AND NOT ON THE CONTEXT. THE CONTEXT MAY BE USED TO CLARIFY THE TOPIC OR TO PROVIDE A CONCRETE EXAMPLE, BUT NOT TO FOCUS ON IT. IF IT IS NOT POSSIBLE TO FOCUS ON THE TOPIC, THEN DO COMPLETELY IGNORE THE CONTEXT.`;
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
        case "deep":
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
        - Each topic ≤5 words, double‑quoted.
        - No explanation or extra text.
  
    Concept: ${message}`;

    switch (inputMode) {
        case "deep":
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
            "very short image description(e.g. funny cats)",
            "The image shows a group of cats doing something amusing.",
        ],
    },
    {
        vid: [
            "very short video description(e.g. playing footbal)",
            "This video shows a group of people playing football in a park.",
        ],
    },
    {
        gif: [
            "very short gif description(e.g. frogs jumping)",
            "This gif shows frogs jumping around in a pond.",
        ],
    },
    { textblock: "text, **text**, (text)[text.com]" },
    { ol: ["Heyyo", "Nice", "That's a list"] },
    { codeblock: "console.log('Hello World');" },
    { quote: "This is a quote" },
    { link: "https://example.com" },
    {
        table: [
            ["Header1", "Header2"],
            ["Row1Col1", "Row1Col2"],
            ["Row2Col1", "Row2Col2"],
        ],
    },
    { diagram: "graph TD; A-->B; A-->C; B-->D; C-->D;" },
    { note: "This is a note." },
    { warning: "This is a warning note." },
    { tip: "This is a tip note." },
    {
        htmlCanvas: `
  function draw(ctx) {
    // Drawing a simple circle (example)
    ctx.beginPath();
    ctx.arc(50, 50, 30, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.closePath();
  }`,
    },
];
