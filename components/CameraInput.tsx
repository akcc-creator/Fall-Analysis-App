import React, { useRef, useState } from 'react';

interface CameraInputProps {
  onImageSelected: (base64: string) => void;
  disabled: boolean;
}

const CameraInput: React.FC<CameraInputProps> = ({ onImageSelected, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // BALANCE: 1600px is sufficient for A4 text OCR, but keeps file size < 1MB
          // Previous 1024px might be too blurry for small handwriting.
          const MAX_WIDTH = 1600;
          const MAX_HEIGHT = 1600;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Quality 0.8 (Good for text)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64 = dataUrl.split(',')[1];
          resolve(base64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        const base64 = await compressImage(file);
        onImageSelected(base64);
      } catch (error) {
        console.error("Compression error:", error);
        alert("圖片處理失敗，請重試。");
      } finally {
        setIsCompressing(false);
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const triggerSelect = () => {
    if (!disabled && !isCompressing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/*"
        capture="environment" // Prefers rear camera on mobile
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />
      
      <button
        onClick={triggerSelect}
        disabled={disabled || isCompressing}
        className={`w-full group relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${
          disabled || isCompressing
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-50' 
            : 'border-teal-400 bg-teal-50 hover:bg-teal-100 hover:border-teal-600 active:scale-95'
        }`}
      >
        <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:shadow-md transition-shadow">
          {isCompressing ? (
             <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-teal-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          )}
        </div>
        <span className="text-lg font-semibold text-teal-900">
          {isCompressing ? '處理圖片中...' : '拍攝 / 上載跌倒報告'}
        </span>
        <span className="text-sm text-teal-600 mt-1">
          {isCompressing ? '系統會自動優化圖片清晰度' : '支援手寫表格識別'}
        </span>
      </button>
    </div>
  );
};

export default CameraInput;
