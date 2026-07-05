import axios from "axios";

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

// Create Axios instance
const client = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper to get WebSocket URL from HTTP base URL
const getWebSocketUrl = () => {
  const httpUrl = getBaseUrl();
  const wsUrl = httpUrl.replace(/^http/, "ws");
  return `${wsUrl}/stream-logs`;
};

// Singleton API service class matching the exact signatures used in components
const api = {
  client,

  /**
   * Fetch smart search autocompletion suggestions
   */
  async getQuerySuggestions(
    partialQuery: string,
    schemaInfo: any = null,
    filePath: string | null = null
  ): Promise<string[]> {
    try {
      const response = await client.post("/query-suggestions", {
        partial_query: partialQuery,
        schema_info: schemaInfo,
        file_path: filePath,
      });
      return response.data?.suggestions || [];
    } catch (e) {
      console.error("Failed to fetch query suggestions:", e);
      return [];
    }
  },

  /**
   * Submit query to the multi-agent swarm for data cleaning, execution, and plotting
   */
  async analyze(query: string, filePath?: string): Promise<any> {
    const response = await client.post("/analyze", {
      query,
      file_path: filePath,
    });
    return response.data;
  },

  /**
   * Chat directly with the RAG assistant about dataset schemas or specific rows
   */
  async agentChat(message: string, filePath: string | null = null, history: any[] = []): Promise<any> {
    const response = await client.post("/agent-chat", {
      message,
      file_path: filePath,
      history,
    });
    return response.data;
  },

  /**
   * Retrieve list of previously uploaded datasets
   */
  async getUploadedFiles(): Promise<any[]> {
    const response = await client.get("/files");
    return response.data?.files || [];
  },

  /**
   * Upload dataset (CSV, Excel, JSON, etc.) to backend storage
   */
  async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await client.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Trigger the RAG indexing pipeline on the backend for the uploaded dataset
   */
  async ragIndex(filePath: string): Promise<any> {
    const response = await client.post("/rag-index", {
      file_path: filePath,
    });
    return response.data;
  },

  /**
   * Connect to WebSocket thought streaming for real-time manager/developer/QA logs
   */
  connectWebSocket(onLogReceived: (log: any) => void): () => void {
    const wsUrl = getWebSocketUrl();
    console.log("Connecting to WebSocket log stream:", wsUrl);
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let shouldReconnect = true;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onLogReceived(data);
          } catch (e) {
            console.error("Error parsing WebSocket log frame:", e);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("WebSocket log stream closed");
          if (shouldReconnect) {
            reconnectTimeout = setTimeout(connect, 3000); // Auto reconnect in 3s
          }
        };
      } catch (err) {
        console.error("Failed to connect websocket:", err);
      }
    };

    connect();

    // Return cleanup/disconnect function
    return () => {
      shouldReconnect = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  },
};

export default api;
