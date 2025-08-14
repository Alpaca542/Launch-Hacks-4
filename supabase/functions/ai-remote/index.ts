// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// Workspace type hint only; Deno exists at runtime in Edge Functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any

async function callOpenAI(params: any) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let errorDetail = `${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorDetail = errorData.error?.message || JSON.stringify(errorData);
    } catch {
      // Fallback to status text if can't parse JSON
    }
    throw new Error(`OpenAI API error: ${errorDetail}`);
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
    const { message, messages, model, tools, tool_choice, acceptsStreaming } = body || {}

    // Handle both single message and messages array
    let inputMessages: any[] = []
    if (messages && Array.isArray(messages)) {
      inputMessages = messages
    } else if (message && typeof message === "string") {
      inputMessages = [{ role: "user", content: message }]
    } else {
      return new Response(JSON.stringify({ error: "Either 'message' (string) or 'messages' (array) is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const wantsStream =
      acceptsStreaming === true ||
      req.headers.get("accept")?.toLowerCase().includes("text/event-stream") === true ||
      new URL(req.url).searchParams.get("stream") === "true"

    // Require authenticated user; pass their JWT to Supabase client so auth.uid() works in RPC
    const authorization = req.headers.get("authorization") || req.headers.get("Authorization")
    if (!authorization) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Server not configured (SUPABASE_URL/ANON_KEY)" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const callRpc = async (fn: string, body?: any) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: authorization,
        },
        body: body ? JSON.stringify(body) : "{}",
      })
      const text = await res.text()
      let data: any = null
      try { data = text ? JSON.parse(text) : null } catch { /* ignore */ }
      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || text || `RPC ${fn} failed`
        throw new Error(msg)
      }
      return data
    }

    if (wantsStream) {
      const encoder = new TextEncoder()

      const streamBody = new ReadableStream({
        start: async (controller) => {
          const send = (obj: unknown) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
          }

          try {
			  // Increment usage first; enforce limits
			  if (false) {
				              try {
              await callRpc("increment_ai_usage")
            } catch (usageErr: any) {
              const msg = String(usageErr?.message || usageErr || "Usage error")
              const status = msg.includes("limit_exceeded") ? 429 : (msg.includes("not_authenticated") ? 401 : 500)
              send({ type: "error", message: msg, status })
              controller.close()
              return
            }

			  }

            const params: any = {
              model: model || "gpt-4o",
              input: inputMessages,
              stream: true,
            }
            if (Array.isArray(tools)) {
              // Transform tools format for Responses API
              params.tools = tools.map((tool: any) => {
                if (tool.type === "function" && tool.function) {
                  return {
                    type: "function",
                    name: tool.function.name,
                    description: tool.function.description,
                    parameters: tool.function.parameters
                  }
                }
                return tool
              })
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
            const toolCallsInProgress: Map<string, {
              id: string
              name: string
              input: string
            }> = new Map()

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  if (data === '[DONE]') continue
                  
                  console.log("Raw streaming line:", data)
                  
                  try {
                    const parsed = JSON.parse(data)
                    
                    console.log("Parsed streaming event:", JSON.stringify(parsed, null, 2))
                    
                    // Handle Responses API streaming events
                    if (parsed.type === "response.output_text.delta" && parsed.delta) {
                      const content = parsed.delta
                      fullResponse += content
                      send({ type: "chunk", content })
                    }
                    
                    // Handle tool call start event
                    else if (parsed.type === "response.tool_call.start") {
                      const itemId = parsed.item_id
                      console.log("Tool call start:", itemId, parsed.name)
                      toolCallsInProgress.set(itemId, {
                        id: itemId,
                        name: parsed.name || "",
                        input: ""
                      })
                    }
                    
                    // Handle tool call input deltas
                    else if (parsed.type === "response.custom_tool_call_input.delta") {
                      const itemId = parsed.item_id
                      const toolCall = toolCallsInProgress.get(itemId)
                      if (toolCall) {
                        toolCall.input += parsed.delta || ""
                      }
                    }
                    
                    // Handle completed tool call input
                    else if (parsed.type === "response.custom_tool_call_input.done") {
                      const itemId = parsed.item_id
                      const toolCall = toolCallsInProgress.get(itemId)
                      console.log("Tool call done:", itemId, toolCall)
                      if (toolCall) {
                        toolCall.input = parsed.input || toolCall.input
                        // Tool call is complete, add to final array and send immediately
                        const completedToolCall = {
                          id: toolCall.id,
                          type: "function" as const,
                          function: {
                            name: toolCall.name,
                            arguments: toolCall.input
                          }
                        }
                        toolCalls.push(completedToolCall)
                        
                        console.log("Sending tool call event:", completedToolCall)
                        // Send the tool call immediately for streaming execution
                        send({ 
                          type: "tool_call", 
                          tool_call: completedToolCall 
                        })
                        
                        toolCallsInProgress.delete(itemId)
                      }
                    }

                      // If OpenAI emits a completed output item that itself is a function_call (some models use
                      // response.output_item.done with item.arguments containing the full JSON string),
                      // forward it as a tool_call event so clients can handle it uniformly.
                      else if (parsed.type === "response.output_item.done" || parsed.type === "response.output_item") {
                        try {
                          const item = parsed.item || parsed.output_item || null
                          if (item && item.type === "function_call") {
                            const itemId = item.id || parsed.item_id || parsed.id || `fc_${Math.random().toString(36).slice(2)}`
                            const rawArgs = item.arguments || item.input || parsed.arguments || null
                            const argsStr = typeof rawArgs === 'string' ? rawArgs : (rawArgs ? JSON.stringify(rawArgs) : "")

                            const completedToolCall = {
                              id: itemId,
                              type: "function" as const,
                              function: {
                                name: item.name || item.tool_name || parsed.name || "function",
                                arguments: argsStr
                              }
                            }

                            toolCalls.push(completedToolCall)
                            console.log("Forwarding output_item as tool_call:", completedToolCall)
                            send({ type: "tool_call", tool_call: completedToolCall })
                          }
                        } catch (e) {
                          // ignore parse errors here
                        }
                      }
                    
                    // Legacy handling for other possible formats
                    else {
                      console.log("Unhandled event type:", parsed.type, parsed)
                      
                      // Handle Responses API streaming format - multiple possible structures
                      let content = null
                      
                      // Try different streaming event structures
                      if (parsed.delta) {
                        content = parsed.delta
                      } else if (parsed.content) {
                        content = parsed.content
                      } else if (parsed.output && Array.isArray(parsed.output)) {
                        // Handle output array format
                        for (const outputItem of parsed.output) {
                          if (outputItem.type === "message" && outputItem.content) {
                            for (const contentItem of outputItem.content) {
                              if (contentItem.type === "output_text" && contentItem.delta) {
                                content = contentItem.delta
                                break
                              }
                            }
                          }
                        }
                      } else if (parsed.choices && parsed.choices[0]?.delta?.content) {
                        // Fallback for chat completions format
                        content = parsed.choices[0].delta.content
                      }
                      
                      if (content) {
                        fullResponse += content
                        send({ type: "chunk", content })
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
		// Increment usage first; enforce limits
		if (false) {
			      try {
        await callRpc("increment_ai_usage")
      } catch (usageErr: any) {
        const msg = String(usageErr?.message || usageErr || "Usage error")
        const status = msg.includes("limit_exceeded") ? 429 : (msg.includes("not_authenticated") ? 401 : 500)
        return new Response(JSON.stringify({ error: msg }), {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
		}


      const params: any = {
        model: model || "gpt-4o",
        input: inputMessages,
        reasoning: {
          effort: "minimal"
        },
        stream: false,
      }
      if (Array.isArray(tools)) {
        // Transform tools format for Responses API
        params.tools = tools.map((tool: any) => {
          if (tool.type === "function" && tool.function) {
            return {
              type: "function",
              name: tool.function.name,
              description: tool.function.description,
              parameters: tool.function.parameters
            }
          }
          return tool
        })
        if (tool_choice) params.tool_choice = tool_choice
      }

  const response = await callOpenAI(params)
      const data = await response.json()
      
      // Debug: Log the full response structure
      console.log("Full OpenAI Response:", JSON.stringify(data, null, 2))
      
      // Handle Responses API format - extract text from output array
      let responseText = ""
      let toolCalls: any[] = []
      
      if (data.output && Array.isArray(data.output)) {
        console.log("Processing output array:", data.output)
        for (const outputItem of data.output) {
          console.log("Processing output item:", outputItem)
          if (outputItem.type === "message" && outputItem.content) {
            for (const contentItem of outputItem.content) {
              console.log("Processing content item:", contentItem)
              if (contentItem.type === "output_text") {
                responseText += contentItem.text || ""
              } else if (contentItem.type === "tool_call") {
                // Handle tool calls in content array
                console.log("Found tool call in content:", contentItem)
                toolCalls.push({
                  id: contentItem.id || "",
                  type: "function" as const,
                  function: {
                    name: contentItem.name || "",
                    arguments: contentItem.input ? JSON.stringify(contentItem.input) : ""
                  }
                })
              }
            }
          }
          // Also check for tool calls at the output item level
          if (outputItem.type === "tool_call") {
            console.log("Found tool call at output level:", outputItem)
            toolCalls.push({
              id: outputItem.id || "",
              type: "function" as const, 
              function: {
                name: outputItem.name || "",
                arguments: outputItem.input ? JSON.stringify(outputItem.input) : ""
              }
            })
          }
        }
      }

      console.log("Final responseText:", responseText)
      console.log("Final toolCalls:", toolCalls)

      if (!responseText && !toolCalls.length) {
        return new Response(JSON.stringify({ error: "No response from OpenAI" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

  return new Response(
        JSON.stringify({
          response: responseText,
          tool_calls: toolCalls,
          finish_reason: data.status || "complete",
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