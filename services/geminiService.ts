
import { FallAnalysis } from "../types";

// Dynamic Backend URL selection:
// 1. If running on Localhost, assume you are running 'node server.js' on port 3000.
// 2. If running on Vercel (Production), use the Vercel Serverless Function '/api/analyze'.
const getBackendUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000/analyze';
  }
  return '/api/analyze';
};

export const analyzeFallReport = async (base64Image: string): Promise<FallAnalysis> => {
  const BACKEND_URL = getBackendUrl();
  console.log("Using Backend:", BACKEND_URL);

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      // Try to parse error JSON
      const errorData = await response.json().catch(() => ({}));
      
      // Special Handling for 404 (Endpoint not found)
      if (response.status === 404) {
         if (BACKEND_URL.includes('localhost')) {
           throw new Error("找不到本地伺服器。請確保已執行 'node server.js'。");
         } else {
           throw new Error("找不到 API 伺服器 (404)。請檢查 Vercel 是否已正確部署 'api/analyze.js'。");
         }
      }

      if (response.status === 429) {
         throw new Error("⚠️ 免費版 API 用量已達上限，請稍後再試。");
      }
      
      if (response.status === 500 && errorData.error?.includes("API_KEY")) {
         throw new Error("伺服器 API Key 設定錯誤。請檢查 Vercel 環境變數。");
      }

      throw new Error(errorData.error || `伺服器錯誤 (${response.status})`);
    }

    const data = await response.json();
    return data as FallAnalysis;

  } catch (error: any) {
    console.error("Analysis Request Error:", error);
    
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
       if (BACKEND_URL.includes('localhost')) {
         throw new Error("無法連接本地伺服器。\n請開啟終端機執行 'node server.js'。");
       } else {
         throw new Error("無法連接雲端伺服器。\n請檢查網絡連接。");
       }
    }

    throw error;
  }
};
