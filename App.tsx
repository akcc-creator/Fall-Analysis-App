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
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
      setErrorMsg('分析失敗，請檢查網絡或照片清晰度，然後重試。');
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setAnalysis(null);
    setCurrentImage(null);
  };

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
              <span>請確保照片清晰顯示報告上的手寫或打印文字，以獲得最佳分析結果。</span>
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
            <h3 className="text-xl font-bold text-gray-800">正在分析報告...</h3>
            <p className="text-gray-500 mt-2">正在識別文字及分析跌倒原因</p>
          </div>
        )}

        {/* State: ERROR */}
        {appState === AppState.ERROR && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">分析失敗</h3>
            <p className="text-gray-600 mt-2 mb-6 max-w-xs mx-auto">{errorMsg}</p>
            <button 
              onClick={handleReset}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
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
