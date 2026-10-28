import { FallAnalysis } from "../types";
export const analyzeFallReport = async (
  images: string[],
): Promise<FallAnalysis> => {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw Error(data.error || `分析失敗 (${response.status})`);
  }
  const result = await response.json();
  if (
    typeof result.handoverNote !== "string" ||
    typeof result.detectedTextSummary !== "string" ||
    !Array.isArray(result.possibleCauses) ||
    !result.possibleCauses.every((x: unknown) => typeof x === "string") ||
    !Array.isArray(result.preventionStrategies) ||
    !result.preventionStrategies.every(
      (x: any) =>
        x &&
        typeof x.measure === "string" &&
        typeof x.rationale === "string" &&
        typeof x.category === "string",
    )
  )
    throw Error("未能讀取完整分析結果，請重試。");
  return result;
};
