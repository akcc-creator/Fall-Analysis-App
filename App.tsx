
import React, { useState } from 'react';
import { analyzeFallReport } from './services/geminiService';
import CameraInput from './components/CameraInput';
import AnalysisResult from './components/AnalysisResult';
import { AppState, FallAnalysis } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysis, setAnalysis] = useState<FallAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const handleImageSelected = async (base64: string) => {
    setAppState(AppState.ANALYZING);
    setCurrentImage(base64);
    setErrorMsg('');
    
    try {
      const result = await analyzeFallReport(base64);
      setAnalysis(result);
      setAppState(AppState.SUCCESS);
    } catch (error: any) {
      console.error(error);
      setAppState(AppState.ERROR);
      // Display the actual error message
      const message = error instanceof Error ? error.message : "未知錯誤";
      setErrorMsg(message || '分析失敗，請檢查網絡或照片清晰度，然後重試。');
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setAnalysis(null);
    setCurrentImage(null);
    setErrorMsg('');
  };

  const isRateLimit = errorMsg.includes("用量已達上限") || errorMsg.includes("RESOURCE_EXHAUSTED");
  // Check specifically for server connection issues
  const isConnectionError = errorMsg.includes("無法連接") || errorMsg.includes("找不到");
  // Check specifically for Vercel Env Var issues
  const isEnvError = errorMsg.includes("Vercel 環境變數") || errorMsg.includes("API_KEY");

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-center relative">
          <div className="flex items-center gap-2">
            <div className="bg-teal-500 text-white p-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">FallGuard <span className="text-teal-600">AI</span></h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {/* State: IDLE */}
        {appState === AppState.IDLE && (
          <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in mt-8">
            <div className="text-center space-y-2 max-w-md">
              <h2 className="text-2xl font-bold text-gray-900">跌倒意外智能分析</h2>
              <p className="text-gray-500">
                拍攝院舍跌倒意外報告，AI 將自動分析原因、建議預防措施，並生成交更簿記錄。
              </p>
            </div>
            
            <div className="w-full max-w-sm">
              <CameraInput onImageSelected={handleImageSelected} disabled={false} />
            </div>

            <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2 max-w-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>為保障私隱，系統不會儲存任何照片，所有分析均即時處理。</span>
            </div>
          </div>
        )}

        {/* State: ANALYZING */}
        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-800">正在連接雲端分析...</h3>
            <p className="text-gray-500 mt-2">請稍候，這可能需要幾秒鐘</p>
          </div>
        )}

        {/* State: ERROR */}
        {appState === AppState.ERROR && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4 w-full">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isRateLimit ? 'bg-amber-100 text-amber-500' : 'bg-red-100 text-red-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                {isRateLimit ? (
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                )}
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{isRateLimit ? '分析請求過於頻繁' : '分析失敗'}</h3>
            <div className={`mt-4 p-4 rounded-lg max-w-md w-full ${isRateLimit ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-100'}`}>
              <p className={`${isRateLimit ? 'text-amber-800' : 'text-red-800'} font-medium text-sm break-words whitespace-pre-line`}>{errorMsg}</p>
            </div>
            
            {isEnvError && (
              <div className="mt-6 max-w-md text-left bg-blue-50 p-5 rounded-lg border border-blue-200 shadow-sm">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  如何在 Vercel 修正此錯誤：
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>進入你的 Vercel 專案頁面 (Dashboard)。</li>
                  <li>點擊上方 <strong>Settings</strong> (設定)。</li>
                  <li>點擊左側 <strong>Environment Variables</strong>。</li>
                  <li>
                    新增變數：
                    <ul className="list-disc list-inside ml-5 mt-1 text-blue-700 bg-blue-100/50 p-2 rounded">
                      <li>Key: <code>API_KEY</code></li>
                      <li>Value: <code>貼上你的 Google Gemini API Key</code></li>
                    </ul>
                  </li>
                  <li>按 <strong>Save</strong> 儲存。</li>
                  <li><strong>重要：</strong>回到 Deployments 頁面，點擊最新的部署右側的三點選單，選擇 <strong>Redeploy</strong>，設定才會生效。</li>
                </ol>
              </div>
            )}

            {isConnectionError && (
              <div className="mt-4 text-xs text-gray-500 bg-gray-100 p-3 rounded text-left">
                <strong>本地開發提示 (Localhost):</strong>
                <ul className="list-disc ml-4 mt-1">
                  <li>請確保已開啟新的終端機並執行 <code>node server.js</code></li>
                </ul>
                <strong className="block mt-2">Vercel 部署提示:</strong>
                <ul className="list-disc ml-4 mt-1">
                  <li>請檢查是否已成功部署 <code>api/analyze.js</code></li>
                </ul>
              </div>
            )}

            <button 
              onClick={handleReset}
              className={`mt-6 px-8 py-2.5 rounded-lg text-white font-medium transition-colors ${isRateLimit ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-600 hover:bg-teal-700'}`}
            >
              重試
            </button>
          </div>
        )}

        {/* State: SUCCESS */}
        {appState === AppState.SUCCESS && analysis && (
          <AnalysisResult 
            analysis={analysis} 
            onReset={handleReset} 
            imageUrl={currentImage || ''}
          />
        )}

      </main>
    </div>
  );
};

export default App;
