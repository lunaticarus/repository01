import React, { useRef } from 'react';
import { Camera, ImagePlus, Images } from 'lucide-react';

interface CameraInputProps {
  onImagesSelected: (files: File[]) => void;
  compact?: boolean;
}

const CameraInput: React.FC<CameraInputProps> = ({ onImagesSelected, compact = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onImagesSelected(Array.from(files));
    }
    // Reset value
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  if (compact) {
    return (
      <>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center w-24 h-32 rounded-2xl bg-white border-2 border-dashed border-brand-primary/30 text-brand-primary active:bg-brand-primary/5 shadow-sm transition-colors"
        >
          <ImagePlus className="w-8 h-8 mb-2" />
          <span className="text-sm font-bold">加照片</span>
        </button>
      </>
    );
  }

  return (
    <div className="w-full space-y-6">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      {/* Primary Action - Gradient Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex flex-col items-center justify-center gap-2 bg-gradient-primary text-white font-bold text-2xl py-8 rounded-[2rem] shadow-xl shadow-teal-700/20 transition-transform transform active:scale-95 touch-manipulation relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity" />
        <Camera className="w-12 h-12" />
        <span>拍照分析</span>
      </button>

      {/* Secondary Action - White Button with Brand Border */}
      <div className="text-center">
        <input 
             type="file" 
             accept="image/*" 
             multiple
             className="hidden"
             ref={galleryInputRef} 
             onChange={handleFileChange}
        />
        <button 
          onClick={() => galleryInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 bg-white text-brand-primary font-bold text-xl py-6 rounded-[2rem] shadow-md border-2 border-brand-primary/20 active:bg-brand-primary/5"
        >
          <Images className="w-8 h-8" />
          <span>從相簿選照片</span>
        </button>
      </div>
    </div>
  );
};

export default CameraInput;