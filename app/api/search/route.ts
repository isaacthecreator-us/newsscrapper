import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { keywords, startDate, endDate } = await request.json();

    if (!keywords) {
      return NextResponse.json({ error: "Keywords required" }, { status: 400 });
    }

    const apiKey = process.env.GNEWS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "GNews API key not configured" }, { status: 500 });
    }

    // Build the GNews API URL
    const params = new URLSearchParams({
      q: keywords,
      token: apiKey,
      lang: "en",
      max: "50",
    });

    // Add date filters if provided (GNews uses from/to format)
    if (startDate) {
      params.append("from", `${startDate}T00:00:00Z`);
    }
    if (endDate) {
      params.append("to", `${endDate}T23:59:59Z`);
    }

    const response = await fetch(
      `https://gnews.io/api/v4/search?${params.toString()}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("GNews API error:", data);
      return NextResponse.json(
        { error: data.errors?.[0] || "Failed to fetch news" },
        { status: response.status }
      );
    }

    // Transform GNews response to our format
    const articles = (data.articles || []).map((article: any, index: number) => ({
      id: index + 1,
      title: article.title || "Untitled",
      publisher: article.source?.name || "Unknown Source",
      publishedDate: article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Recent",
      publishedTime: article.publishedAt
        ? new Date(article.publishedAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      summary: article.description || "Click to read more",
      url: article.url || "#",
      imageUrl: article.image || null,
    }));

    return NextResponse.json({
      articles,
      totalResults: data.totalArticles || articles.length,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
