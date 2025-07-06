/* eslint-disable */
import * as v2 from "firebase-functions/v2";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.LLAMA_KEY,
});

export const groqChat = v2.https.onRequest(
    {
        cors: true,
        timeoutSeconds: 60,
        memory: "256MiB",
    },
    async (req, res) => {
        try {
            // Enable CORS for all origins - more comprehensive headers
            res.set("Access-Control-Allow-Origin", "*");
            res.set(
                "Access-Control-Allow-Methods",
                "GET, POST, OPTIONS, PUT, DELETE"
            );
            res.set(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Requested-With"
            );
            res.set("Access-Control-Max-Age", "3600");

            // Handle preflight requests
            if (req.method === "OPTIONS") {
                res.status(204).send("");
                return;
            }

            // Parse URL and extract message from query parameters
            const url = new URL(req.url, `http://${req.headers.host}`);
            const message =
                url.searchParams.get("message") || req.body?.message;

            if (!message) {
                res.status(400).json({ error: "Message is required" });
                return;
            }

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: message }],
                model: "llama3-8b-8192",
            });

            let responseText =
                chatCompletion.choices[0]?.message?.content ||
                "No response generated";
            if (responseText.includes(":")) {
                responseText = responseText
                    .substring(responseText.indexOf(":") + 1)
                    .trim();
            }
            res.json({
                response: responseText,
            });
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);
