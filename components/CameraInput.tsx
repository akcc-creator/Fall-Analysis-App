
import React, { useRef, useState, useEffect } from 'react';

interface CameraInputProps {
  onImageSelected: (base64: string) => void;
  disabled: boolean;
}

const CameraInput: React.FC<CameraInputProps> = ({ onImageSelected, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const startCamera = async () => {
    try {
      stopCamera(); // Stop any existing stream first

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("你的瀏覽器不支援即時相機功能，請使用「從相簿選擇」。(注意：相機功能需要 HTTPS 連線)");
        return;
      }

      const constraints = {
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = stream;
      setIsCameraOpen(true);
      
      // Wait a tick for the video element to be rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Error playing video:", e));
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Detailed error for debugging
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        alert("無法開啟相機：請允許瀏覽器使用相機權限。");
      } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        alert("無法開啟相機：瀏覽器限制相機功能必須在 HTTPS 安全連線下使用。請將網站部署至 Vercel (HTTPS) 後測試。");
      } else {
        alert("無法開啟相機，請嘗試使用「從相簿選擇」。");
      }
    }
  };

  // Re-start camera when facing mode changes
  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const processImageToBase64 = (source: CanvasImageSource, width: number, height: number): string => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1600;
      const MAX_HEIGHT = 1600;

      let newWidth = width;
      let newHeight = height;

      if (newWidth > newHeight) {
        if (newWidth > MAX_WIDTH) {
          newHeight *= MAX_WIDTH / newWidth;
          newWidth = MAX_WIDTH;
        }
      } else {
        if (newHeight > MAX_HEIGHT) {
          newWidth *= MAX_HEIGHT / newHeight;
          newHeight = MAX_HEIGHT;
        }
      }

      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      
      // Mirror the image if using front camera
      if (facingMode === 'user') {
        ctx.translate(newWidth, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(source, 0, 0, newWidth, newHeight);
      
      // Quality 0.8
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      return dataUrl.split(',')[1];
  };

  const handleCapture = () => {
    if (videoRef.current) {
      try {
        setIsProcessing(true);
        const video = videoRef.current;
        // Check if video is actually ready
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          alert("相機尚未準備好，請稍後再試。");
          setIsProcessing(false);
          return;
        }
        
        const base64 = processImageToBase64(video, video.videoWidth, video.videoHeight);
        stopCamera();
        onImageSelected(base64);
      } catch (error) {
        console.error("Capture error:", error);
        alert("拍攝失敗，請重試。");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          try {
            const base64 = processImageToBase64(img, img.width, img.height);
            onImageSelected(base64);
          } catch (error) {
            console.error("File processing error:", error);
            alert("圖片處理失敗。");
          } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };
      };
    }
  };

  const triggerFileSelect = () => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  // Render Camera View
  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center sm:relative sm:bg-transparent sm:h-[500px] sm:w-full sm:rounded-2xl sm:overflow-hidden sm:border-2 sm:border-gray-800">
        <video 
          ref={videoRef} 
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
          muted 
          playsInline 
          autoPlay
        />
        
        {/* Camera Controls Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-end">
           <button 
             onClick={toggleCamera}
             className="bg-black/30 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/50"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
             </svg>
           </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent">
          <button 
            onClick={stopCamera}
            className="text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <span className="text-sm font-medium">取消</span>
          </button>
          
          <button 
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center hover:bg-white/40 active:scale-95 transition-all shadow-lg"
          >
            <div className="w-16 h-16 bg-white rounded-full"></div>
          </button>
          
          <div className="w-12"></div> {/* Spacer for alignment */}
        </div>
      </div>
    );
  }

  // Render Selection View
  return (
    <div className="w-full space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Button 1: Instant Camera */}
        <button
          onClick={startCamera}
          disabled={disabled || isProcessing}
          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${
            disabled || isProcessing
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              : 'border-teal-500 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:shadow-md active:scale-95'
          }`}
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </div>
          <span className="font-bold text-lg">即時拍攝</span>
          <span className="text-xs opacity-70 mt-1">開啟相機鏡頭</span>
        </button>

        {/* Button 2: Upload */}
        <button
          onClick={triggerFileSelect}
          disabled={disabled || isProcessing}
          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all duration-300 ${
            disabled || isProcessing
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 bg-white text-gray-600 hover:border-teal-400 hover:bg-gray-50 hover:text-teal-600 active:scale-95'
          }`}
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
             {isProcessing ? (
                <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
             )}
          </div>
          <span className="font-bold text-lg">從相簿選擇</span>
          <span className="text-xs opacity-70 mt-1">{isProcessing ? '處理中...' : '支援圖片上載'}</span>
        </button>
      </div>
    </div>
  );
};

export default CameraInput;
