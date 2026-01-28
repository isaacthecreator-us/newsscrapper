import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: query }],
            },
          ],
          tools: [
            {
              googleSearch: {},
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch from Gemini API", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    let textContent = "";
    if (data.candidates && data.candidates[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.text) {
          textContent += part.text;
        }
      }
    }

    // Extract grounding metadata (sources) if available
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
    
    return NextResponse.json({ 
      text: textContent,
      groundingMetadata: groundingMetadata,
      raw: data 
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
