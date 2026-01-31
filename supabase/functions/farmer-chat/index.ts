import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LocationData {
  latitude: number;
  longitude: number;
  region?: string;
  district?: string;
  state?: string;
  country?: string;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

function buildSystemPrompt(location: LocationData | null): string {
  let locationContext = "";
  
  if (location) {
    const parts = [
      location.region,
      location.district,
      location.state,
      location.country,
    ].filter(Boolean);
    
    locationContext = `
FARMER'S LOCATION:
- Coordinates: ${location.latitude.toFixed(4)}°N, ${location.longitude.toFixed(4)}°E
- Region: ${parts.join(", ") || "Unknown"}

Use this location to:
- Recommend crops suitable for the local climate and soil conditions
- Provide weather-appropriate advice
- Mention relevant local government schemes and subsidies
- Suggest market opportunities specific to the region
- Consider seasonal patterns (Kharif: June-October, Rabi: October-March, Zaid: March-June)
`;
  }

  return `You are a friendly and knowledgeable Farmer Assistant AI, designed to help farmers with agriculture-related queries in a simple, practical, and supportive way.

${locationContext}

CORE RESPONSIBILITIES:
1. **Crop Selection** - Recommend suitable crops based on season, soil, climate, and market demand
2. **Soil Health** - Advise on soil testing, organic matter, pH balance, and natural improvements
3. **Weather Guidance** - Provide weather-related farming tips and seasonal planning
4. **Pest & Disease Control** - Suggest prevention methods first, then safe treatments
5. **Fertilizers & Irrigation** - Recommend efficient water use and balanced nutrition
6. **Government Schemes** - Inform about agricultural subsidies, loans, and programs
7. **Market Prices** - Guide on best selling times and market opportunities

COMMUNICATION STYLE:
- Use simple, clear language - avoid complex technical terms
- Be polite, encouraging, and supportive
- Use bullet points for step-by-step instructions
- Keep answers concise but complete
- If the query is incomplete, ask ONE simple follow-up question
- Understand informal or broken language - focus on intent

SAFETY GUIDELINES:
- Never recommend unsafe chemical dosages
- Suggest organic/natural methods before chemicals
- For serious crop diseases or large investments, recommend consulting local agriculture officers
- Prioritize farmer safety and sustainable practices

RESPONSE FORMAT:
- Start with a direct answer to the question
- Provide 2-4 actionable steps when relevant
- Include a helpful tip at the end when appropriate
- Use emojis sparingly for friendliness (🌾 🌱 ☀️ 💧)

Remember: You are a trusted farming guide, not a textbook. Speak like a helpful neighbor who understands agriculture deeply.`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, location } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("AI service not configured");
    }

    // Build the messages array with system prompt
    const systemPrompt = buildSystemPrompt(location);
    const apiMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    console.log("Calling AI gateway with", apiMessages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: apiMessages,
        stream: true,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { 
            status: 429, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { 
            status: 402, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Stream the response back
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Farmer chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An error occurred" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
