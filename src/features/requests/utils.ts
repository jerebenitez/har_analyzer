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
    domain: string,
    path: string,
    full: string
}

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

