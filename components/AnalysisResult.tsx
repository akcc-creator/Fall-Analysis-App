
import React, { useState } from 'react';
import { FallAnalysis, PreventionMeasure } from '../types';

interface AnalysisResultProps {
  analysis: FallAnalysis;
  onReset: () => void;
  imageUrls: string[];
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, onReset, imageUrls }) => {
  const [copied, setCopied] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(analysis.handoverNote);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Environment': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Physical': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Medication': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto pb-20">
      
      {/* Image Gallery */}
      {imageUrls.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-4 px-2 snap-x">
          {imageUrls.map((img, idx) => (
            <div 
              key={idx}
              className="flex-shrink-0 w-32 h-32 relative group cursor-zoom-in snap-center"
              onClick={() => setZoomedImage(img)}
            >
              <div className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200 shadow-md bg-gray-100">
                <img 
                  src={`data:image/jpeg;base64,${img}`} 
                  alt={`Input ${idx + 1}`} 
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/50 text-white p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                  </svg>
                </div>
              </div>
              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 rounded-sm">
                {idx + 1}/{imageUrls.length}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <img 
            src={`data:image/jpeg;base64,${zoomedImage}`} 
            alt="Full Size" 
            className="max-w-full max-h-full object-contain rounded shadow-2xl"
          />
          <button className="absolute top-6 right-6 text-white/80 hover:text-white bg-black/20 p-2 rounded-full backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Handover Note - Sticky or prominent */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-teal-500 overflow-hidden">
        <div className="bg-teal-600 px-4 py-3 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
            </svg>
            交更簿記錄 (專業評估)
          </h2>
          <button 
            onClick={handleCopy}
            className="text-xs bg-white text-teal-700 px-3 py-1 rounded-full font-bold shadow hover:bg-teal-50 active:scale-95 transition-all"
          >
            {copied ? '已複製！' : '複製內容'}
          </button>
        </div>
        <div className="p-5 bg-teal-50">
          <p className="text-gray-800 text-lg leading-relaxed font-medium whitespace-pre-wrap">
            {analysis.handoverNote}
          </p>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-gray-900 font-bold text-lg mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          風險因素 / 意外成因
        </h3>
        <ul className="space-y-2">
          {analysis.possibleCauses.map((cause, idx) => (
            <li key={idx} className="flex items-start gap-3 text-gray-700">
              <span className="mt-1.5 w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
              {cause}
            </li>
          ))}
        </ul>
      </div>

      {/* Prevention Strategies */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-gray-900 font-bold text-lg mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          預防及改善建議
        </h3>
        <div className="grid gap-4 sm:grid-cols-1">
          {analysis.preventionStrategies.map((item, idx) => (
            <div key={idx} className="flex flex-col p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getCategoryColor(item.category)}`}>
                  {item.category === 'Environment' ? '環境' : 
                   item.category === 'Physical' ? '身體機能' : 
                   item.category === 'Medication' ? '藥物' : 
                   item.category === 'Care' ? '護理' : '其他'}
                </span>
              </div>
              <h4 className="font-bold text-gray-800 mb-1">{item.measure}</h4>
              <p className="text-sm text-gray-600">{item.rationale}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 text-center text-teal-600 font-semibold hover:bg-teal-50 rounded-lg transition-colors"
      >
        掃描另一份報告或相片
      </button>
    </div>
  );
};

export default AnalysisResult;
