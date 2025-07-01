/* eslint-disable */
import * as v2 from "firebase-functions/v2";
import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI("AIzaSyBNVsITc9ceoJEdKu5dIUZYehPT_7i2MMM");

const askAI = async (message: string): Promise<any> => {
    try {
        const model = ai.getGenerativeModel({ model: "gemini-2.5-pro" });
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();
        return { response: text };
    } catch (err) {
        console.error("Fetch error:", err);
        throw err;
    }
};

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

            const aiResponse = await askAI(message);
            res.json(aiResponse);
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);
