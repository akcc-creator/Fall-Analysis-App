import React, { useState } from "react";
import CameraInput from "./components/CameraInput";
import AnalysisResult from "./components/AnalysisResult";
import Icon from "./components/Icon";
import { analyzeFallReport } from "./services/geminiService";
import { AppState, FallAnalysis } from "./types";
import "./style.css";
export default function App() {
  const [state, setState] = useState(AppState.IDLE),
    [analysis, setAnalysis] = useState<FallAnalysis | null>(null),
    [error, setError] = useState(""),
    [images, setImages] = useState<string[]>([]),
    [demo, setDemo] = useState(false);
  async function analyze(imgs: string[]) {
    setImages(imgs);
    setState(AppState.ANALYZING);
    setError("");
    setDemo(false);
    try {
      setAnalysis(await analyzeFallReport(imgs));
      setState(AppState.SUCCESS);
    } catch (e) {
      setError(e instanceof Error ? e.message : "連線失敗，請稍後重試。");
      setState(AppState.ERROR);
    }
  }
  function reset() {
    setState(AppState.IDLE);
    setAnalysis(null);
    setImages([]);
    setDemo(false);
  }
  function showDemo() {
    setDemo(true);
    setImages([]);
    setAnalysis({
      detectedTextSummary:
        "示例情境：走廊地面有電線及雜物，部分通道被阻擋。本頁為虛構示範，並非真實院友評估。",
      possibleCauses: [
        "電線橫跨通道，可能增加絆倒風險。",
        "雜物收納位置影響通道暢通，可能限制助行器通過。",
      ],
      preventionStrategies: [
        {
          category: "Environment",
          measure: "整理電線及清空通道",
          rationale:
            "將電線固定於牆邊，移除通道雜物，保持助行器及輪椅通行空間。",
        },
        {
          category: "Physical",
          measure: "按個別需要評估步行及平衡能力",
          rationale:
            "由物理治療師結合病史及實際功能評估，制訂個人化訓練與輔具建議。",
        },
      ],
      handoverNote:
        "環境巡查建議草稿：示例走廊可見電線及雜物阻塞通道，建議整理電線及移除障礙物，並由同事實地核實及跟進。",
    });
    setState(AppState.SUCCESS);
  }
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">
            <Icon name="shield" size={26} />
          </span>
          <div>
            <strong>
              FallGuard <em>AI</em>
            </strong>
            <small>跌倒風險 · 智能分析助手</small>
          </div>
        </div>
        <span className="top-tag">
          <span /> 物理治療工作工具
        </span>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <div className="side-label">工作空間</div>
          <button className="nav-item active" onClick={reset}>
            <Icon name="spark" /> 智能分析 <span>01</span>
          </button>
          <div className="side-note">
            <span className="small-icon">
              <Icon name="shield" />
            </span>
            <h3>每一步，多一份安心。</h3>
            <p>
              整理觀察、辨識風險，
              <br />
              協助制訂防跌措施。
            </p>
          </div>
          <div className="side-bottom">
            FALLGUARD AI <span>照顧，從細節開始</span>
          </div>
        </aside>
        <main>
          <div className="breadcrumb">
            工作空間 <span>/</span>{" "}
            {state === AppState.SUCCESS ? "分析結果" : "新增分析"}
          </div>
          {state === AppState.IDLE && (
            <>
              <section className="intro">
                <div>
                  <div className="eyebrow">SMARTER INSIGHTS. SAFER CARE.</div>
                  <h1>
                    看清風險，
                    <br className="mobile-break" />
                    <span>讓照顧更周全。</span>
                  </h1>
                  <p>
                    上傳跌倒報告或環境相片，
                    <br className="mobile-break" />讓 AI
                    協助整理成因及預防建議。
                  </p>
                </div>
                <div className="intro-mark">
                  <Icon name="shield" size={86} />
                  <span className="floating-mark">
                    <Icon name="spark" size={23} />
                  </span>
                </div>
              </section>
              <div className="steps">
                <div className="current">
                  <b>1</b>
                  <span>加入相片</span>
                </div>
                <i />
                <div>
                  <b>2</b>
                  <span>智能分析</span>
                </div>
                <i />
                <div>
                  <b>3</b>
                  <span>核實及應用</span>
                </div>
              </div>
              <div className="main-grid">
                <section className="upload-card">
                  <div className="section-heading">
                    <span className="small-icon">
                      <Icon name="upload" />
                    </span>
                    <div>
                      <h2>開始一次新分析</h2>
                      <p>可同時加入多頁報告或多張環境相片</p>
                    </div>
                    <span className="badge">JPEG / PNG</span>
                  </div>
                  <CameraInput onAnalyze={analyze} disabled={false} />
                </section>
                <aside className="tips">
                  <h2>可以分析甚麼？</h2>
                  <div className="tip">
                    <span className="tip-icon peach">
                      <Icon name="file" />
                    </span>
                    <div>
                      <h3>跌倒事故報告</h3>
                      <p>
                        整理事件經過、可能成因，
                        <br />
                        生成交更記錄草稿。
                      </p>
                    </div>
                  </div>
                  <div className="tip">
                    <span className="tip-icon mint">
                      <Icon name="home" />
                    </span>
                    <div>
                      <h3>環境安全相片</h3>
                      <p>
                        辨識通道、地面及障礙物等
                        <br />
                        可見環境風險。
                      </p>
                    </div>
                  </div>
                  <div className="tip-divider" />
                  <h3 className="tips-title">拍攝小提示</h3>
                  <p className="tip-copy">
                    保持光線充足、文字清晰，並拍攝完整頁面；上傳前請遮蓋非必要的個人資料。
                  </p>
                  <button className="example-button" onClick={showDemo}>
                    看看分析結果示例 <Icon name="arrow" size={18} />
                  </button>
                </aside>
              </div>
              <div className="privacy">
                <Icon name="shield" size={20} />
                <p>
                  <strong>資料處理提示</strong> 相片會傳送至伺服器及 Google
                  Gemini 進行分析；本程式不會將相片另存至應用程式資料庫。
                </p>
              </div>
            </>
          )}
          {state === AppState.ANALYZING && (
            <section className="status-card" role="status" aria-live="polite">
              <div className="spinner" />
              <div className="eyebrow">ANALYSIS IN PROGRESS</div>
              <h1>正在整理相片中的線索</h1>
              <p>正在處理 {images.length} 張相片，請保持頁面開啟。</p>
              <div className="loading-line" />
              <small>分析需時視乎圖片數量及網絡狀況而定</small>
            </section>
          )}
          {state === AppState.ERROR && (
            <section className="status-card" role="alert">
              <span className="error-icon">
                <Icon name="alert" size={30} />
              </span>
              <h1>暫時未能完成分析</h1>
              <p className="error-message">{error}</p>
              <p>已保留本次相片，你可以直接再試。</p>
              <div className="button-row">
                <button className="primary" onClick={() => analyze(images)}>
                  重新分析 <Icon name="arrow" />
                </button>
                <button className="secondary" onClick={reset}>
                  重新選擇相片
                </button>
              </div>
            </section>
          )}
          {state === AppState.SUCCESS && analysis && (
            <AnalysisResult
              analysis={analysis}
              imageUrls={images}
              onReset={reset}
              demo={demo}
            />
          )}
          <footer>
            <span>
              FallGuard AI <span className="footer-dot">·</span>{" "}
              讓防跌工作更有條理
            </span>
            <span>AI 建議須經專業人員核實</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
