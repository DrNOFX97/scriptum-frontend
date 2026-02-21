import type { Handler, HandlerEvent } from "@netlify/functions";

export const handler: Handler = async (event: HandlerEvent) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Range",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // Get target URL from query parameter
  const url = event.queryStringParameters?.url;
  if (!url) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing 'url' parameter" }),
    };
  }

  try {
    console.log(`Proxying HLS request: ${url}`);

    // Forward the request with appropriate headers
    const requestHeaders: HeadersInit = {
      "User-Agent": "Mozilla/5.0 (compatible; HLS Proxy)",
    };

    // Forward Range header if present (for seeking)
    const rangeHeader = event.headers?.range || event.headers?.Range;
    if (rangeHeader) {
      requestHeaders["Range"] = rangeHeader;
    }

    const response = await fetch(url, {
      headers: requestHeaders,
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `Upstream error: ${response.status} ${response.statusText}`,
        }),
      };
    }

    // Get the response body
    const body = await response.arrayBuffer();

    // Forward relevant headers
    const responseHeaders = {
      ...headers,
      "Content-Type": response.headers.get("Content-Type") || "application/vnd.apple.mpegurl",
      "Content-Length": response.headers.get("Content-Length") || String(body.byteLength),
      "Cache-Control": response.headers.get("Cache-Control") || "public, max-age=3600",
    };

    // Forward range-related headers if present
    const contentRange = response.headers.get("Content-Range");
    if (contentRange) {
      responseHeaders["Content-Range"] = contentRange;
    }
    const acceptRanges = response.headers.get("Accept-Ranges");
    if (acceptRanges) {
      responseHeaders["Accept-Ranges"] = acceptRanges;
    }

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: Buffer.from(body).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("Proxy error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Proxy error",
      }),
    };
  }
};
