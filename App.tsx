import React, { useState, useEffect } from 'react';
import CameraInput from './components/CameraInput';
import ResultCard from './components/ResultCard';
import { analyzeIngredients, fileToGenerativePart } from './services/geminiService';
import { AnalysisResult, ViewState } from './types';
import { ArrowLeft, Loader2, Sparkles, X, HeartHandshake } from 'lucide-react';

interface ImageAsset {
  id: string;
  url: string;
  data: string; // base64 without prefix
  mimeType: string;
}

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('HOME');
  const [selectedImages, setSelectedImages] = useState<ImageAsset[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [viewState]);

  const handleImagesSelect = async (files: File[]) => {
    try {
      const newImages: ImageAsset[] = [];
      
      for (const file of files) {
        const { mimeType, data } = await fileToGenerativePart(file);
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          url: URL.createObjectURL(file), // Create object URL for preview
          data,
          mimeType
        });
      }

      setSelectedImages(prev => [...prev, ...newImages]);
      setViewState('PREVIEW');
      setError(null);
    } catch (e) {
      console.error(e);
      setError("讀取圖片失敗，請重試");
    }
  };

  const handleRemoveImage = (id: string) => {
    const newImages = selectedImages.filter(img => img.id !== id);
    setSelectedImages(newImages);
    if (newImages.length === 0) {
      setViewState('HOME');
    }
  };

  const handleAnalyze = async () => {
    if (selectedImages.length === 0) return;

    setViewState('ANALYZING');
    setError(null);

    try {
      const payload = selectedImages.map(img => ({
        mimeType: img.mimeType,
        data: img.data
      }));
      
      const data = await analyzeIngredients(payload);
      setResult(data);
      setViewState('RESULT');
    } catch (err: any) {
      setError(err.message || "分析過程中發生錯誤");
      setViewState('PREVIEW');
    }
  };

  const handleReset = () => {
    setViewState('HOME');
    setSelectedImages([]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-brand-bg pt-safe pb-safe flex flex-col relative bg-gradient-warm">
      
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-brand-bg/90 backdrop-blur-md px-4 h-20 flex items-center justify-between">
        {viewState !== 'HOME' ? (
          <button 
            onClick={handleReset}
            className="text-brand-primary flex items-center gap-2 px-3 py-2 active:opacity-60 transition-opacity bg-white rounded-xl border border-brand-primary/20 shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-lg font-bold">返回</span>
          </button>
        ) : (
          <div className="w-5" /> 
        )}
        <h1 className="font-extrabold text-2xl text-brand-dark absolute left-1/2 -translate-x-1/2 tracking-tight">
          {viewState === 'RESULT' ? '分析報告' : 'FoodDecoder'}
        </h1>
        <div className="w-5" /> 
      </div>

      {/* Main Content Area */}
      <main className="flex-1 px-5 py-6 overflow-y-auto no-scrollbar max-w-lg mx-auto w-full">
        
        {/* HOME STATE */}
        {viewState === 'HOME' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-6">
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-teal-100 inline-block mb-2 relative">
                <div className="absolute inset-0 bg-brand-primary/5 rounded-[3rem]"></div>
                <HeartHandshake className="w-24 h-24 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-brand-dark tracking-tight mb-4">
                    拍包裝，<br/><span className="text-brand-primary">看懂吃什麼</span>
                </h2>
                <p className="text-gray-500 max-w-[280px] mx-auto text-xl font-medium leading-relaxed">
                    不用擔心看不懂成份<br/>我們用白話文解釋給你聽
                </p>
              </div>
            </div>
            
            <div className="w-full">
              <CameraInput onImagesSelected={handleImagesSelect} />
            </div>

            <div className="text-center bg-white/80 p-5 rounded-2xl border border-brand-accent/20 shadow-sm">
              <p className="text-base font-bold text-brand-accent">
                💡 貼心提醒：AI 分析僅供參考<br/>有疑慮請詢問專業醫生喔！
              </p>
            </div>
          </div>
        )}

        {/* PREVIEW STATE */}
        {viewState === 'PREVIEW' && selectedImages.length > 0 && (
          <div className="flex flex-col h-full animate-in fade-in duration-300">
             
             <div className="mb-8 bg-white p-5 rounded-[2rem] border border-stone-100 shadow-xl shadow-stone-200/50">
               <h3 className="text-2xl font-bold text-brand-dark mb-2">已選取 {selectedImages.length} 張照片</h3>
               <p className="text-lg text-gray-500">請確認照片裡的字清楚嗎？</p>
             </div>

             {/* Horizontal Scroll Gallery */}
             <div className="flex gap-4 overflow-x-auto pb-8 -mx-5 px-5 no-scrollbar snap-x snap-mandatory">
               {selectedImages.map((img) => (
                 <div key={img.id} className="relative flex-shrink-0 w-72 h-96 bg-stone-900 rounded-[2rem] shadow-lg overflow-hidden snap-center border-4 border-white">
                    <img 
                      src={img.url} 
                      alt="Preview" 
                      className="w-full h-full object-contain opacity-90"
                    />
                    <button 
                      onClick={() => handleRemoveImage(img.id)}
                      className="absolute top-4 right-4 p-3 bg-brand-danger text-white rounded-full shadow-lg border-2 border-white active:scale-95"
                    >
                      <X className="w-6 h-6" />
                    </button>
                 </div>
               ))}
               
               {/* Add More Button in List */}
               <div className="flex-shrink-0 flex items-center justify-center snap-center px-2">
                  <CameraInput onImagesSelected={handleImagesSelect} compact />
               </div>
             </div>
             
             {error && (
               <div className="bg-red-50 text-red-800 p-5 rounded-2xl my-4 text-center text-lg font-bold border border-red-200">
                 ⚠️ {error}
               </div>
             )}

             <div className="mt-auto space-y-4 pt-4">
               <button
                 onClick={handleAnalyze}
                 className="w-full bg-gradient-primary text-white font-bold text-2xl py-6 rounded-[2rem] shadow-xl shadow-teal-700/20 flex items-center justify-center gap-3 active:scale-95 transition-transform"
               >
                 <Sparkles className="w-8 h-8" />
                 開始分析
               </button>
               <button
                 onClick={handleReset}
                 className="w-full text-gray-400 font-bold text-xl py-4 hover:text-gray-600"
               >
                 全部重來
               </button>
             </div>
          </div>
        )}

        {/* ANALYZING STATE */}
        {viewState === 'ANALYZING' && (
          <div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-brand-primaryLight rounded-full animate-ping opacity-75"></div>
              <div className="bg-white p-8 rounded-full shadow-xl relative z-10 border-4 border-brand-primaryLight">
                <Loader2 className="w-20 h-20 text-brand-primary animate-spin" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-brand-dark">AI 正在幫你讀...</h3>
            <p className="text-gray-500 mt-4 text-center max-w-xs text-xl font-medium leading-relaxed">
              請稍等一下<br/>我們正在把難懂的字<br/>變成白話文 😊
            </p>
          </div>
        )}

        {/* RESULT STATE */}
        {viewState === 'RESULT' && result && (
          <ResultCard result={result} />
        )}
      </main>

      {/* Sticky Bottom Action for Result View */}
      {viewState === 'RESULT' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-stone-200 p-4 pb-safe z-40 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
           <div className="max-w-lg mx-auto">
             <button
               onClick={handleReset}
               className="w-full bg-brand-dark active:bg-gray-800 text-white font-bold text-xl py-5 rounded-2xl shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
             >
               <HeartHandshake className="w-6 h-6 text-brand-primary" />
               掃描下一個產品
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;