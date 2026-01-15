
import { FallAnalysis } from "../types";

// The URL of your backend server. 
// When developing locally: http://localhost:3000/analyze
// When deployed (e.g. Vercel): /api/analyze (or your full domain)
const BACKEND_URL = 'http://localhost:3000/analyze';

export const analyzeFallReport = async (base64Image: string): Promise<FallAnalysis> => {
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
         throw new Error("⚠️ 免費版 API 用量已達上限，請稍後再試。");
      }
      
      if (response.status === 500 && errorData.error?.includes("API_KEY")) {
         throw new Error("伺服器 API Key 設定錯誤。請檢查 backend 環境變數。");
      }

      throw new Error(errorData.error || `伺服器錯誤 (${response.status})`);
    }

    const data = await response.json();
    return data as FallAnalysis;

  } catch (error: any) {
    console.error("Analysis Request Error:", error);
    
    // Friendly error message for connection failure
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      throw new Error("無法連接後端伺服器。\n請確保已執行 'node server.js'，並且無需 VPN 即可連接。");
    }

    throw error;
  }
};
