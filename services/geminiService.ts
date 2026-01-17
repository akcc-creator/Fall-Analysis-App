
import { FallAnalysis } from "../types";

const getBackendUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000/analyze';
  }
  return '/api/analyze';
};

export const analyzeFallReport = async (base64Images: string[]): Promise<FallAnalysis> => {
  const BACKEND_URL = getBackendUrl();
  
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: base64Images })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `分析失敗 (${response.status})`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Fetch Error:", error);
    throw new Error(error.message || "網絡連線出現問題，請檢查網絡後重試。");
  }
};
