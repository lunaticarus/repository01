import React from 'react';
import { AnalysisResult, IngredientCategory, ChildSuitabilityStatus } from '../types';
import { AlertTriangle, CheckCircle, Info, XCircle, Baby, Sparkles } from 'lucide-react';

interface ResultCardProps {
  result: AnalysisResult;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  
  const getChildStatusConfig = (status: ChildSuitabilityStatus) => {
    switch (status) {
      case ChildSuitabilityStatus.SAFE:
        return { color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, label: '可以吃 (適合幼童)', iconColor: 'text-emerald-600' };
      case ChildSuitabilityStatus.AVOID:
        return { color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-200', icon: XCircle, label: '少吃比較好 (不建議)', iconColor: 'text-rose-600' };
      default:
        return { color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, label: '要注意 (適量)', iconColor: 'text-amber-600' };
    }
  };

  const childConfig = getChildStatusConfig(result.childSuitability.status);
  
  const getCategoryIcon = (cat: IngredientCategory) => {
    switch (cat) {
      case IngredientCategory.HEALTHY: return <CheckCircle className="w-8 h-8 text-brand-primary shrink-0" />;
      case IngredientCategory.UNHEALTHY: return <XCircle className="w-8 h-8 text-brand-danger shrink-0" />;
      case IngredientCategory.CAUTION: return <AlertTriangle className="w-8 h-8 text-brand-accent shrink-0" />;
      default: return <Info className="w-8 h-8 text-gray-400 shrink-0" />;
    }
  };

  const getCategoryBg = (cat: IngredientCategory) => {
    switch (cat) {
      case IngredientCategory.HEALTHY: return 'bg-teal-50 border-teal-100';
      case IngredientCategory.UNHEALTHY: return 'bg-red-50 border-red-100';
      case IngredientCategory.CAUTION: return 'bg-orange-50 border-orange-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="pb-40 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Header Card */}
      <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden relative">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primaryLight rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
        
        <div className="relative">
            <h2 className="text-3xl font-extrabold text-brand-dark leading-tight tracking-tight mb-2">
              {result.productName || "未知產品"}
            </h2>
            <div className="flex items-center gap-2 mb-6">
                 <span className="inline-block w-2 h-2 rounded-full bg-brand-primary"></span>
                 <p className="text-gray-500 text-lg font-medium">成份分析報告</p>
            </div>
            
            {/* Summary - Large Text with nice background */}
            <div className="bg-gradient-to-br from-stone-50 to-stone-100 p-6 rounded-2xl mb-6 border border-stone-100">
            <p className="text-gray-800 text-xl leading-relaxed font-medium">
                {result.summary}
            </p>
            </div>

            {/* Child Suitability Badge - High Emphasis */}
            <div className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border-2 ${childConfig.bg} ${childConfig.border}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full bg-white ${childConfig.iconColor} shadow-sm ring-1 ring-inset ring-black/5`}>
                        <Baby className="w-8 h-8" />
                    </div>
                    <h4 className={`text-xl font-extrabold ${childConfig.color} sm:hidden`}>{childConfig.label}</h4>
                </div>
                <div>
                    <h4 className={`text-xl font-extrabold ${childConfig.color} hidden sm:block mb-1`}>{childConfig.label}</h4>
                    <p className="text-lg text-gray-800 font-medium leading-relaxed">{result.childSuitability.reason}</p>
                </div>
            </div>

            {/* Highlights - Pills */}
            <div className="mt-6 flex flex-wrap gap-3">
            {result.pros?.map((pro, idx) => (
                <span key={`pro-${idx}`} className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-base font-bold bg-teal-100 text-teal-800 border border-teal-200">
                <Sparkles className="w-4 h-4" /> {pro}
                </span>
            ))}
            {result.warnings?.map((warn, idx) => (
                <span key={`warn-${idx}`} className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-base font-bold bg-orange-100 text-orange-800 border border-orange-200">
                ⚠️ {warn}
                </span>
            ))}
            </div>
        </div>
      </div>

      {/* Ingredients List */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-brand-dark px-2 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-primary text-white text-sm">📋</span> 
          白話文成份表
        </h3>
        {result.ingredients?.map((item, index) => (
          <div 
            key={index} 
            className={`p-6 rounded-2xl border-2 ${getCategoryBg(item.category)} flex gap-5 items-start shadow-sm transition-transform active:scale-[0.99]`}
          >
            <div className="mt-1 bg-white p-2 rounded-full shadow-sm">
              {getCategoryIcon(item.category)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                <h4 className="text-xl font-bold text-brand-dark">{item.name}</h4>
                {/* Optional Tag */}
                {item.category === IngredientCategory.UNHEALTHY && <span className="text-sm bg-white px-3 py-1 rounded-full text-brand-danger font-extrabold border border-red-100 shadow-sm">注意</span>}
              </div>
              <p className="text-lg text-gray-700 font-medium leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
        {(!result.ingredients || result.ingredients.length === 0) && (
          <div className="text-center text-gray-400 py-10">
            <p className="text-xl">沒看到詳細成份耶 🤔</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultCard;