import React, { useState } from "react";
import { FallAnalysis } from "../types";
import Icon from "./Icon";
export default function AnalysisResult({
  analysis,
  onReset,
  imageUrls,
  demo = false,
}: {
  analysis: FallAnalysis;
  onReset: () => void;
  imageUrls: string[];
  demo?: boolean;
}) {
  const [copy, setCopy] = useState("複製記錄"),
    [zoom, setZoom] = useState<string | null>(null);
  async function copyNote() {
    try {
      await navigator.clipboard.writeText(analysis.handoverNote);
      setCopy("已複製");
      setTimeout(() => setCopy("複製記錄"), 2000);
    } catch {
      setCopy("複製失敗，請手動選取");
    }
  }
  const categories: Record<string, string> = {
    Environment: "環境",
    Physical: "身體機能",
    Medication: "藥物",
    Care: "護理",
    Other: "其他",
  };
  return (
    <div className="results">
      <div className="result-top">
        <div>
          <div className="eyebrow">
            {demo ? "SAMPLE REPORT" : "ANALYSIS REPORT"}
          </div>
          <h1>{demo ? "分析結果示例" : "分析結果"}</h1>
          <p>
            {demo
              ? "以下為虛構示範內容，未執行 AI 分析。"
              : "請核對原始資料，再將建議應用於照顧計劃。"}
          </p>
        </div>
        <div className="button-row">
          <button className="secondary" onClick={() => window.print()}>
            <Icon name="print" size={18} /> 列印
          </button>
          <button className="primary" onClick={onReset}>
            新增分析 <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
      <div className="report-summary">
        <div className="summary-badge">
          <Icon name={demo ? "eye" : "check"} />
          {demo ? "示範內容" : "分析已完成"}
        </div>
        <div>
          <b>{analysis.possibleCauses.length}</b>
          <span>項可能風險</span>
        </div>
        <div>
          <b>{analysis.preventionStrategies.length}</b>
          <span>項改善建議</span>
        </div>
        <div>
          <b>{imageUrls.length}</b>
          <span>張原始相片</span>
        </div>
      </div>
      <section className="report-card">
        <div className="report-heading">
          <span className="small-icon">
            <Icon name="file" />
          </span>
          <h2>資料摘要</h2>
          <span className="badge">請核對辨識內容</span>
        </div>
        <p className="report-text">
          {analysis.detectedTextSummary || "未有資料摘要，請核對原始相片。"}
        </p>
        {imageUrls.length > 0 && (
          <div className="source-images">
            {imageUrls.map((img, i) => (
              <button
                key={i}
                onClick={() => setZoom(img)}
                aria-label={`放大原始相片 ${i + 1}`}
              >
                <img
                  src={`data:image/jpeg;base64,${img}`}
                  alt={`原始相片 ${i + 1}`}
                />
                <span>{i + 1}</span>
              </button>
            ))}
          </div>
        )}
      </section>
      <div className="result-grid">
        <section className="report-card risk-card">
          <div className="report-heading">
            <span className="small-icon peach">
              <Icon name="alert" />
            </span>
            <h2>風險因素與可能成因</h2>
          </div>
          <ol className="risk-list">
            {analysis.possibleCauses.map((c, i) => (
              <li key={i}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <p>{c}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="report-card">
          <div className="report-heading">
            <span className="small-icon">
              <Icon name="shield" />
            </span>
            <h2>預防及改善建議</h2>
          </div>
          <div className="measures">
            {analysis.preventionStrategies.map((s, i) => (
              <article key={i}>
                <span className={`category ${s.category.toLowerCase()}`}>
                  {categories[s.category] || "其他"}
                </span>
                <h3>{s.measure}</h3>
                <p>{s.rationale}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
      <section className="note-card">
        <div className="report-heading">
          <Icon name="file" />
          <h2>交更記錄草稿</h2>
          <button onClick={copyNote}>
            <Icon name="copy" size={17} />
            {copy}
          </button>
        </div>
        <p>{analysis.handoverNote}</p>
        <small>請由物理治療師核實及修訂，確認後才加入正式記錄。</small>
      </section>
      {zoom && (
        <div
          className="zoom-modal"
          role="dialog"
          aria-modal="true"
          aria-label="相片預覽"
          onClick={() => setZoom(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setZoom(null);
          }}
        >
          <button
            autoFocus
            aria-label="關閉相片預覽"
            onClick={() => setZoom(null)}
          >
            <Icon name="close" />
          </button>
          <img src={`data:image/jpeg;base64,${zoom}`} alt="放大原始相片" />
        </div>
      )}
    </div>
  );
}
