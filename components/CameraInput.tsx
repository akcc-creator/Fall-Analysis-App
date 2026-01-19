import React, { useRef, useState, useEffect } from 'react';

interface CameraInputProps {
  onAnalyze: (images: string[]) => void;
  disabled: boolean;
}

const CameraInput: React.FC<CameraInputProps> = ({ onAnalyze, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const startCamera = async () => {
    try {
      stopCamera();
      const constraints = {
        video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      alert("無法開啟相機，請嘗試從相簿選擇。");
    }
  };

  const processImage = (source: HTMLVideoElement | HTMLImageElement): string => {
    const canvas = document.createElement('canvas');
    // Reduced to 1024px to prevent Vercel Payload Too Large errors with multiple images
    // This is the sweet spot for stability vs OCR quality on mobile networks
    const MAX_SIZE = 1024; 
    let w = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    let h = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

    if (w > h && w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; }
    else if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(source, 0, 0, w, h);
    // Quality 0.7 retains good text detail while dropping file size
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const base64 = processImage(videoRef.current);
      setCapturedImages(prev => [...prev, base64]);
      stopCamera();
    }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsProcessing(true);
    Promise.all(Array.from(files).map((file: File) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (re) => {
          const img = new Image();
          img.onload = () => resolve(processImage(img));
          const result = re.target?.result;
          if (typeof result === 'string') {
            img.src = result;
          } else {
            resolve('');
          }
        };
        reader.readAsDataURL(file);
      });
    })).then(imgs => {
      setCapturedImages(prev => [...prev, ...imgs.filter(img => img !== '')]);
      setIsProcessing(false);
    });
  };

  return (
    <div className="w-full space-y-4">
      <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFiles} />
      {isCameraOpen ? (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-10 flex gap-6">
            <button onClick={stopCamera} className="bg-white/20 text-white px-6 py-2 rounded-full">取消</button>
            <button onClick={handleCapture} className="w-16 h-16 bg-white rounded-full border-4 border-white/50" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button onClick={startCamera} className="p-6 border-2 border-teal-500 bg-teal-50 rounded-xl font-bold text-teal-700">拍攝報告</button>
            <button onClick={() => fileInputRef.current?.click()} className="p-6 border-2 border-dashed border-gray-300 rounded-xl font-bold text-gray-600">上傳相片</button>
          </div>
          {capturedImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {capturedImages.map((img, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img src={`data:image/jpeg;base64,${img}`} className="w-full h-full object-cover rounded shadow" />
                  <button onClick={() => setCapturedImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">✕</button>
                </div>
              ))}
            </div>
          )}
          {capturedImages.length > 0 && (
            <button 
              disabled={isProcessing || disabled}
              onClick={() => onAnalyze(capturedImages)} 
              className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold shadow-lg"
            >
              {isProcessing ? '處理中...' : `開始分析 (${capturedImages.length} 張)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraInput;