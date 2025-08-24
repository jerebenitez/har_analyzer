export const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300)
    return "bg-green-100 text-green-800 border-green-200";
  if (status >= 300 && status < 400)
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (status >= 400 && status < 500)
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (status >= 500) return "bg-red-100 text-red-800 border-red-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

export const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "POST":
      return "bg-green-100 text-green-800 border-green-200";
    case "PUT":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "DELETE":
      return "bg-red-100 text-red-800 border-red-200";
    case "PATCH":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export type UrlInfo = {
  domain: string;
  path: string;
  full: string;
};

export const formatUrl = (url: string): UrlInfo => {
  try {
    const urlObj = new URL(url);
    return {
      domain: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      full: url,
    };
  } catch {
    return {
      domain: "",
      path: url,
      full: url,
    };
  }
};

export const formatTime = (time: number) => {
  if (time < 1000) return `${Math.round(time)} ms`;
  return `${(time / 1000).toFixed(2)} s`;
};

export const formatSize = (size: number) => {
  if (Number.isNaN(size) || size === undefined) return "N/A";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatJson = (text: string) => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

type NetKind =
  | "html"
  | "js"
  | "images"
  | "fonts"
  | "xhr"
  | "css"
  | "media"
  | "ws"
  | "other";

export function categorizeMimeType(
  mimeType: string | null | undefined,
): NetKind {
  if (!mimeType) return "other";

  const base = String(mimeType).toLowerCase().split(";", 1)[0].trim();

  if (base.startsWith("image/")) return "images";
  if (base.startsWith("font/")) return "fonts";
  if (base.startsWith("audio/") || base.startsWith("video/")) return "media";

  switch (base) {
    case "text/html":
    case "application/xhtml+xml":
      return "html";

    case "text/css":
      return "css";

    case "application/javascript":
    case "text/javascript":
    case "application/x-javascript":
    case "application/ecmascript":
    case "text/ecmascript":
    case "application/mjs":
    case "text/jsx":
    case "text/tsx":
      return "js";

    case "application/font-woff":
    case "application/font-woff2":
    case "application/x-font-ttf":
    case "application/x-font-otf":
    case "application/font-sfnt":
    case "application/vnd.ms-fontobject":
      return "fonts";

    case "application/ogg":
    case "application/x-mpegurl": // HLS (older)
    case "application/vnd.apple.mpegurl": // HLS
    case "application/dash+xml": // MPEG-DASH
    case "application/vnd.ms-sstr+xml": // Smooth Streaming
    case "application/x-shockwave-flash": // Legacy
      return "media";

    // WebSocket (rarely advertised via MIME; scheme-based in practice)
    case "application/websocket":
    case "application/x-websocket":
      return "ws";
  }

  // JS modules sometimes come as application/*+javascript or text/*+javascript (rare)
  if (/\+javascript$/.test(base)) return "js";

  // JSON / XML / plain / form often indicate XHR/Fetch payloads
  if (
    base === "application/json" ||
    base === "text/json" ||
    base.endsWith("+json") ||
    base === "application/xml" ||
    base === "text/xml" ||
    base.endsWith("+xml") ||
    base === "text/plain" ||
    base === "application/x-www-form-urlencoded" ||
    base === "multipart/form-data" ||
    base === "text/event-stream" // SSE; closest bucket in your list is 'xhr'
  ) {
    return "xhr";
  }

  // SVG sometimes appears under application/svg+xml (image/svg+xml is caught above)
  if (base === "application/svg+xml") return "images";

  return "other";
}
