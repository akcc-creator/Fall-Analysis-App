import React, { useRef } from 'react';

interface CameraInputProps {
  onImageSelected: (base64: string) => void;
  disabled: boolean;
}

const CameraInput: React.FC<CameraInputProps> = ({ onImageSelected, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        onImageSelected(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerSelect = () => {
    if (!disabled) {
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
        disabled={disabled}
        className={`w-full group relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${
          disabled 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-50' 
            : 'border-teal-400 bg-teal-50 hover:bg-teal-100 hover:border-teal-600 active:scale-95'
        }`}
      >
        <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:shadow-md transition-shadow">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-teal-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </div>
        <span className="text-lg font-semibold text-teal-900">
          拍攝 / 上載跌倒報告
        </span>
        <span className="text-sm text-teal-600 mt-1">
          支援手寫表格識別
        </span>
      </button>
    </div>
  );
};

export default CameraInput;
