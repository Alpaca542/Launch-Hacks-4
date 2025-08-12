// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

async function callOpenAI(params: any) {
  const apiKey = Deno.env.get("OPENAI_API_KEY") || "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";
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  return response;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}))
    const { message, model, tools, tool_choice, acceptsStreaming } = body || {}

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required and must be a string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const wantsStream =
      acceptsStreaming === true ||
      req.headers.get("accept")?.toLowerCase().includes("text/event-stream") === true ||
      new URL(req.url).searchParams.get("stream") === "true"

    if (wantsStream) {
      const encoder = new TextEncoder()

      const streamBody = new ReadableStream({
        start: async (controller) => {
          const send = (obj: unknown) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
          }

          try {
            const params: any = {
              model: model || "gpt-4",
              messages: [{ role: "user", content: message }],
              max_tokens: 1000,
              temperature: 0.7,
              stream: true,
            }
            if (Array.isArray(tools)) {
              params.tools = tools
              if (tool_choice) params.tool_choice = tool_choice
            }

            const response = await callOpenAI(params)
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
              throw new Error("No response stream available")
            }

            let fullResponse = ""
            const toolCalls: Array<{
              id: string
              type: "function"
              function: { name: string; arguments: string }
            }> = []

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  if (data === '[DONE]') continue
                  
                  try {
                    const parsed = JSON.parse(data)
                    const choice = parsed.choices?.[0]

                    if (choice?.delta?.content) {
                      const content = choice.delta.content
                      fullResponse += content
                      send({ type: "chunk", content })
                    }

                    if (choice?.delta?.tool_calls) {
                      for (const t of choice.delta.tool_calls) {
                        if (typeof t.index === "number") {
                          if (!toolCalls[t.index]) {
                            toolCalls[t.index] = {
                              id: t.id || "",
                              type: "function",
                              function: {
                                name: t.function?.name || "",
                                arguments: t.function?.arguments || "",
                              },
                            }
                          } else if (t.function?.arguments) {
                            toolCalls[t.index].function.arguments += t.function.arguments
                          }
                        }
                      }
                    }
                  } catch (e) {
                    // Skip invalid JSON chunks
                  }
                }
              }
            }

            send({ type: "complete", response: fullResponse, tool_calls: toolCalls })
          } catch (err: any) {
            send({ type: "error", message: err?.message || "Stream error" })
          } finally {
            controller.close()
          }
        },
      })

      return new Response(streamBody, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      })
    } else {
      const params: any = {
        model: model || "gpt-4",
        messages: [{ role: "user", content: message }],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false,
      }
      if (Array.isArray(tools)) {
        params.tools = tools
        if (tool_choice) params.tool_choice = tool_choice
      }

      const response = await callOpenAI(params)
      const data = await response.json()
      const choice = data.choices?.[0]

      if (!choice) {
        return new Response(JSON.stringify({ error: "No response from OpenAI" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      return new Response(
        JSON.stringify({
          response: choice.message?.content || "",
          tool_calls: choice.message?.tool_calls || [],
          finish_reason: choice.finish_reason,
          type: "complete",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})