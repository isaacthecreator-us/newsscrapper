"use client";

import React, { useState } from "react";
import {
  Search,
  Calendar,
  Download,
  FileText,
  FileJson,
  Loader2,
  ExternalLink,
  Newspaper,
  Clock,
  Building2,
  ChevronDown,
  X,
  Sparkles,
  RefreshCw,
} from "lucide-react";

// Google-inspired color palette
const colors = {
  blue: "#1a73e8",
  red: "#ea4335",
  yellow: "#fbbc04",
  green: "#34a853",
  gray: "#5f6368",
  lightGray: "#f8f9fa",
  border: "#dadce0",
};

interface Article {
  id: number;
  title: string;
  publisher: string;
  publishedDate: string;
  publishedTime: string;
  summary: string;
  url: string;
}

export default function NewsScraperApp() {
  const [keywords, setKeywords] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [deepResearchProgress, setDeepResearchProgress] = useState("");

  const performDeepResearch = async () => {
    if (!keywords.trim()) {
      setError("Please enter search keywords");
      return;
    }

    setIsLoading(true);
    setError("");
    setResults([]);
    setSearchPerformed(true);
    setDeepResearchProgress("Initiating deep research...");

    try {
      const allArticles: Article[] = [];

      // Build date context for the prompt
      const dateContext =
        startDate || endDate
          ? `Focus on articles ${startDate ? `from ${startDate}` : ""} ${endDate ? `to ${endDate}` : ""}.`
          : "Focus on recent articles.";

      // Search queries for comprehensive coverage
      const searchQueries = [
        `${keywords} latest news`,
        `${keywords} breaking news today`,
        `${keywords} news updates ${new Date().getFullYear()}`,
      ];

      for (let i = 0; i < searchQueries.length; i++) {
        setDeepResearchProgress(
          `Searching: "${searchQueries[i]}" (${i + 1}/${searchQueries.length})...`
        );

        try {
          const response = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `Search the web for: "${searchQueries[i]}"

${dateContext}

After searching, analyze the search results and extract ALL news articles found. For EACH article, provide:
- title: The exact headline
- publisher: The news source/publisher name (extract from the URL domain or source name)
- publishedDate: The publication date (look for date in metadata or content, use "Recent" if not found)
- publishedTime: Time if available, otherwise empty string
- summary: A 1-2 sentence summary of the article content
- url: The full URL to the article

IMPORTANT: You MUST return a valid JSON array. Return ONLY the JSON array, no other text before or after.
Format: [{"title":"...","publisher":"...","publishedDate":"...","publishedTime":"...","summary":"...","url":"..."},...]

If no news articles are found, return an empty array: []`,
            }),
          });

          const data = await response.json();

          if (data.error) {
            console.error("API error:", data.error);
            continue;
          }

          // Extract text content from response
          let textContent = "";
          if (data.content) {
            for (const block of data.content) {
              if (block.type === "text") {
                textContent += block.text;
              }
            }
          }

          // Try to parse JSON from the response
          const jsonMatch = textContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              if (Array.isArray(parsed)) {
                allArticles.push(...parsed);
              }
            } catch (parseErr) {
              console.log("JSON parse error for query", i, parseErr);
            }
          }
        } catch (queryErr) {
          console.log("Query error:", queryErr);
        }

        // Small delay between requests
        if (i < searchQueries.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      setDeepResearchProgress("Processing and deduplicating results...");

      // Deduplicate by URL and title
      const seen = new Set<string>();
      const uniqueArticles = allArticles
        .filter((article) => {
          if (!article.title || !article.url) return false;
          const key = article.url.toLowerCase();
          const titleKey = article.title.toLowerCase().substring(0, 50);
          if (seen.has(key) || seen.has(titleKey)) return false;
          seen.add(key);
          seen.add(titleKey);
          return true;
        })
        .map((article, index) => ({
          id: index + 1,
          title: article.title || "Untitled Article",
          publisher: extractPublisher(article.publisher, article.url),
          publishedDate: article.publishedDate || "Recent",
          publishedTime: article.publishedTime || "",
          summary: article.summary || "No summary available",
          url: article.url || "#",
        }));

      setDeepResearchProgress("");

      if (uniqueArticles.length === 0) {
        setError(
          "No news articles found. Try different keywords or broaden your search."
        );
      } else {
        setResults(uniqueArticles);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("An error occurred while searching. Please try again.");
      setDeepResearchProgress("");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to extract clean publisher name
  const extractPublisher = (publisher: string, url: string): string => {
    if (publisher && publisher !== "Unknown" && !publisher.includes("http")) {
      // Clean up publisher name
      return publisher
        .replace(/\s*\|.*$/, "")
        .replace(/\s*-.*$/, "")
        .replace(/\.com|\.org|\.net|\.co\.uk/gi, "")
        .trim();
    }

    // Extract from URL
    try {
      const domain = new URL(url).hostname
        .replace("www.", "")
        .replace(".com", "")
        .replace(".org", "")
        .replace(".net", "")
        .replace(".co.uk", "");

      // Capitalize first letter of each word
      return domain
        .split(".")[0]
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    } catch {
      return publisher || "Unknown Source";
    }
  };

  const exportToCSV = () => {
    const headers = ["Title", "Publisher", "Date", "Time", "Summary", "URL"];
    const csvContent = [
      headers.join(","),
      ...results.map((r) =>
        [
          `"${(r.title || "").replace(/"/g, '""')}"`,
          `"${(r.publisher || "").replace(/"/g, '""')}"`,
          `"${r.publishedDate || ""}"`,
          `"${r.publishedTime || ""}"`,
          `"${(r.summary || "").replace(/"/g, '""')}"`,
          `"${r.url || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    downloadFile(
      csvContent,
      `news-${keywords.replace(/\s+/g, "-")}.csv`,
      "text/csv"
    );
    setExportMenuOpen(false);
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(
      {
        query: keywords,
        dateRange: { start: startDate || null, end: endDate || null },
        exportedAt: new Date().toISOString(),
        totalResults: results.length,
        articles: results,
      },
      null,
      2
    );
    downloadFile(
      jsonContent,
      `news-${keywords.replace(/\s+/g, "-")}.json`,
      "application/json"
    );
    setExportMenuOpen(false);
  };

  const exportToPDF = () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>News Research: ${keywords}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #202124; line-height: 1.6; max-width: 900px; margin: 0 auto; }
    .header { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1a73e8; }
    .header h1 { font-size: 28px; color: #1a73e8; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
    .header h1::before { content: "📰"; }
    .header .query { font-size: 18px; color: #5f6368; margin-bottom: 12px; }
    .meta { display: flex; gap: 30px; font-size: 13px; color: #5f6368; flex-wrap: wrap; }
    .meta-item { display: flex; align-items: center; gap: 6px; }
    .article { margin-bottom: 24px; padding: 24px; border: 1px solid #dadce0; border-radius: 12px; page-break-inside: avoid; background: #fafafa; }
    .article:hover { border-color: #1a73e8; }
    .article-num { display: inline-block; width: 28px; height: 28px; background: #e8f0fe; color: #1a73e8; border-radius: 50%; text-align: center; line-height: 28px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
    .article h2 { font-size: 17px; color: #1a73e8; margin-bottom: 10px; line-height: 1.4; }
    .article-meta { font-size: 13px; color: #5f6368; margin-bottom: 12px; display: flex; gap: 20px; flex-wrap: wrap; }
    .article-meta span { display: flex; align-items: center; gap: 5px; }
    .article p { font-size: 14px; color: #3c4043; margin-bottom: 12px; }
    .article a { font-size: 13px; color: #1a73e8; text-decoration: none; word-break: break-all; }
    .article a:hover { text-decoration: underline; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #dadce0; font-size: 11px; color: #9aa0a6; text-align: center; }
    @media print { .article { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>News Research Results</h1>
    <div class="query">Search Query: "${keywords}"</div>
    <div class="meta">
      <span class="meta-item">📅 Date Range: ${startDate || "Any"} - ${endDate || "Present"}</span>
      <span class="meta-item">📊 Total Results: ${results.length}</span>
      <span class="meta-item">🕐 Generated: ${new Date().toLocaleString()}</span>
    </div>
  </div>
  
  ${results
    .map(
      (r, i) => `
  <div class="article">
    <span class="article-num">${i + 1}</span>
    <h2>${r.title}</h2>
    <div class="article-meta">
      <span>🏢 ${r.publisher}</span>
      <span>📅 ${r.publishedDate}${r.publishedTime ? " at " + r.publishedTime : ""}</span>
    </div>
    <p>${r.summary}</p>
    <a href="${r.url}" target="_blank">🔗 ${r.url}</a>
  </div>`
    )
    .join("")}
  
  <div class="footer">
    Generated by News Research Tool • Powered by AI Deep Research
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `news-${keywords.replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearResults = () => {
    setResults([]);
    setSearchPerformed(false);
    setKeywords("");
    setStartDate("");
    setEndDate("");
    setError("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)",
        fontFamily:
          "'Google Sans', 'Product Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "16px 32px",
          borderBottom: `1px solid ${colors.border}`,
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 3px rgba(60,64,67,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{ fontSize: "26px", fontWeight: "500", color: colors.blue }}
            >
              N
            </span>
            <span
              style={{ fontSize: "26px", fontWeight: "500", color: colors.red }}
            >
              e
            </span>
            <span
              style={{
                fontSize: "26px",
                fontWeight: "500",
                color: colors.yellow,
              }}
            >
              w
            </span>
            <span
              style={{ fontSize: "26px", fontWeight: "500", color: colors.blue }}
            >
              s
            </span>
          </div>
          <span
            style={{ fontSize: "20px", fontWeight: "400", color: colors.gray }}
          >
            Research
          </span>
          <div
            style={{
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.green})`,
              color: "white",
              fontSize: "9px",
              fontWeight: "600",
              padding: "3px 8px",
              borderRadius: "4px",
              letterSpacing: "0.5px",
            }}
          >
            <Sparkles
              size={9}
              style={{ marginRight: "3px", verticalAlign: "middle" }}
            />
            DEEP RESEARCH
          </div>
        </div>

        {results.length > 0 && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: colors.blue,
                border: "none",
                borderRadius: "24px",
                cursor: "pointer",
                fontSize: "14px",
                color: "white",
                fontWeight: "500",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 3px rgba(26,115,232,0.3)",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#1557b0")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = colors.blue)
              }
            >
              <Download size={16} />
              Export
              <ChevronDown
                size={14}
                style={{
                  transform: exportMenuOpen ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {exportMenuOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 99 }}
                  onClick={() => setExportMenuOpen(false)}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "8px",
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                    border: `1px solid ${colors.border}`,
                    overflow: "hidden",
                    zIndex: 100,
                    minWidth: "200px",
                    animation: "fadeIn 0.15s ease",
                  }}
                >
                  {[
                    {
                      fn: exportToCSV,
                      icon: FileText,
                      color: colors.green,
                      label: "CSV Spreadsheet",
                      desc: "Excel compatible",
                    },
                    {
                      fn: exportToPDF,
                      icon: FileText,
                      color: colors.red,
                      label: "PDF Document",
                      desc: "Printable report",
                    },
                    {
                      fn: exportToJSON,
                      icon: FileJson,
                      color: colors.yellow,
                      label: "JSON Data",
                      desc: "For developers",
                    },
                  ].map(({ fn, icon: Icon, color, label, desc }) => (
                    <button
                      key={label}
                      onClick={fn}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        width: "100%",
                        padding: "14px 18px",
                        border: "none",
                        background: "white",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = colors.lightGray)
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = "white")
                      }
                    >
                      <Icon size={20} color={color} />
                      <div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#202124",
                            fontWeight: "500",
                          }}
                        >
                          {label}
                        </div>
                        <div style={{ fontSize: "11px", color: colors.gray }}>
                          {desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 20px" }}>
        {/* Search Card */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "28px",
            boxShadow: "0 1px 6px rgba(60,64,67,0.1)",
            marginBottom: "28px",
          }}
        >
          {/* Search Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "14px 20px",
              background: colors.lightGray,
              borderRadius: "28px",
              marginBottom: "20px",
              transition: "box-shadow 0.2s",
              border: "1px solid transparent",
            }}
          >
            <Search size={20} color={colors.gray} />
            <input
              type="text"
              placeholder="Search for news articles..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !isLoading && performDeepResearch()
              }
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontSize: "15px",
                outline: "none",
                color: "#202124",
              }}
            />
            {keywords && (
              <button
                onClick={() => setKeywords("")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  borderRadius: "50%",
                }}
              >
                <X size={18} color={colors.gray} />
              </button>
            )}
          </div>

          {/* Date Range */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: colors.gray,
                fontSize: "14px",
              }}
            >
              <Calendar size={16} />
              <span>Date range:</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: "10px 14px",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#202124",
                  outline: "none",
                  cursor: "pointer",
                  background: "white",
                }}
              />
              <span style={{ color: colors.gray, fontSize: "13px" }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: "10px 14px",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#202124",
                  outline: "none",
                  cursor: "pointer",
                  background: "white",
                }}
              />
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={performDeepResearch}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px 28px",
              background: isLoading ? "#f1f3f4" : colors.blue,
              color: isLoading ? colors.gray : "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "500",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "all 0.2s ease",
              boxShadow: isLoading ? "none" : "0 1px 3px rgba(26,115,232,0.3)",
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>{deepResearchProgress || "Researching..."}</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Start Deep Research</span>
              </>
            )}
          </button>

          {error && (
            <div
              style={{
                marginTop: "16px",
                padding: "14px 16px",
                background: "#fce8e6",
                borderRadius: "8px",
                color: "#c5221f",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <X size={18} />
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {searchPerformed && !isLoading && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                padding: "0 4px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Newspaper size={18} color={colors.blue} />
                <span style={{ fontSize: "14px", color: colors.gray }}>
                  {results.length > 0
                    ? `${results.length} articles found for "${keywords}"`
                    : "No results"}
                </span>
              </div>
              {results.length > 0 && (
                <button
                  onClick={clearResults}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    background: "transparent",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: colors.gray,
                    transition: "all 0.15s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = colors.lightGray;
                    e.currentTarget.style.borderColor = colors.gray;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = colors.border;
                  }}
                >
                  <X size={14} />
                  Clear
                </button>
              )}
            </div>

            {/* Results Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {results.map((article, index) => (
                <article
                  key={article.id}
                  onClick={() => window.open(article.url, "_blank")}
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "20px 24px",
                    boxShadow: "0 1px 3px rgba(60,64,67,0.08)",
                    border: `1px solid ${colors.border}`,
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(60,64,67,0.12)";
                    e.currentTarget.style.borderColor = colors.blue;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 1px 3px rgba(60,64,67,0.08)";
                    e.currentTarget.style.borderColor = colors.border;
                  }}
                >
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div
                      style={{
                        minWidth: "28px",
                        height: "28px",
                        background: "#e8f0fe",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: colors.blue,
                      }}
                    >
                      {index + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "500",
                          color: "#1a0dab",
                          marginBottom: "8px",
                          lineHeight: "1.4",
                        }}
                      >
                        {article.title}
                      </h3>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          marginBottom: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            color: colors.green,
                            fontSize: "13px",
                            fontWeight: "500",
                          }}
                        >
                          <Building2 size={13} />
                          {article.publisher}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            color: colors.gray,
                            fontSize: "12px",
                          }}
                        >
                          <Calendar size={12} />
                          {article.publishedDate}
                        </span>
                        {article.publishedTime && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              color: colors.gray,
                              fontSize: "12px",
                            }}
                          >
                            <Clock size={12} />
                            {article.publishedTime}
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          fontSize: "13px",
                          color: "#545454",
                          lineHeight: "1.5",
                          marginBottom: "8px",
                        }}
                      >
                        {article.summary}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#006621",
                          fontSize: "12px",
                        }}
                      >
                        <ExternalLink size={12} />
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "400px",
                          }}
                        >
                          {article.url}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searchPerformed && !isLoading && (
          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
              color: colors.gray,
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                background: "#e8f0fe",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <Newspaper size={32} color={colors.blue} />
            </div>
            <h2
              style={{
                fontSize: "18px",
                color: "#202124",
                marginBottom: "10px",
                fontWeight: "500",
              }}
            >
              Research news from across the web
            </h2>
            <p
              style={{
                fontSize: "14px",
                maxWidth: "380px",
                margin: "0 auto 24px",
                lineHeight: "1.5",
              }}
            >
              Enter keywords to discover news articles from trusted sources.
              Filter by date range for targeted research.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {[
                "Artificial Intelligence",
                "Climate Change",
                "Tech Industry",
                "World News",
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setKeywords(tag)}
                  style={{
                    padding: "8px 16px",
                    background: "white",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "20px",
                    fontSize: "13px",
                    color: colors.gray,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e8f0fe";
                    e.currentTarget.style.borderColor = colors.blue;
                    e.currentTarget.style.color = colors.blue;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.color = colors.gray;
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
