import React from 'react';
import { AnalysisResult, IngredientCategory, ChildSuitabilityStatus } from '../types';
import { AlertTriangle, CheckCircle, Info, XCircle, Baby } from 'lucide-react';

interface ResultCardProps {
  result: AnalysisResult;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-ios-green';
    if (score >= 50) return 'text-ios-yellow';
    return 'text-ios-red';
  };

  const getChildStatusConfig = (status: ChildSuitabilityStatus) => {
    switch (status) {
      case ChildSuitabilityStatus.SAFE:
        return { color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300', icon: CheckCircle, label: '可以吃 (適合幼童)' };
      case ChildSuitabilityStatus.AVOID:
        return { color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', icon: XCircle, label: '少吃比較好 (不建議)' };
      default:
        return { color: 'text-yellow-800', bg: 'bg-yellow-100', border: 'border-yellow-300', icon: AlertTriangle, label: '要注意 (適量)' };
    }
  };

  const childConfig = getChildStatusConfig(result.childSuitability.status);
  
  const getCategoryIcon = (cat: IngredientCategory) => {
    switch (cat) {
      case IngredientCategory.HEALTHY: return <CheckCircle className="w-8 h-8 text-ios-green shrink-0" />;
      case IngredientCategory.UNHEALTHY: return <XCircle className="w-8 h-8 text-ios-red shrink-0" />;
      case IngredientCategory.CAUTION: return <AlertTriangle className="w-8 h-8 text-ios-yellow shrink-0" />;
      default: return <Info className="w-8 h-8 text-ios-gray shrink-0" />;
    }
  };

  const getCategoryBg = (cat: IngredientCategory) => {
    switch (cat) {
      case IngredientCategory.HEALTHY: return 'bg-green-50 border-green-200';
      case IngredientCategory.UNHEALTHY: return 'bg-red-50 border-red-200';
      case IngredientCategory.CAUTION: return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="pb-40 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-2">
            <h2 className="text-3xl font-extrabold text-black leading-tight tracking-tight">
              {result.productName || "未知產品"}
            </h2>
            <p className="text-gray-500 text-lg mt-2 font-medium">成份分析報告</p>
          </div>
          <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-full bg-white border-8 ${getScoreColor(result.healthScore).replace('text-', 'border-')}`}>
            <span className={`text-3xl font-black ${getScoreColor(result.healthScore)}`}>{result.healthScore}</span>
            <span className="text-xs text-gray-500 font-bold">健康分</span>
          </div>
        </div>
        
        {/* Summary - Large Text */}
        <div className="bg-gray-100 p-5 rounded-2xl mb-6">
          <p className="text-gray-900 text-xl leading-relaxed font-medium">
            {result.summary}
          </p>
        </div>

        {/* Child Suitability Badge - High Emphasis */}
        <div className={`flex items-start gap-4 p-5 rounded-2xl border-2 ${childConfig.bg} ${childConfig.border}`}>
            <div className={`p-3 rounded-full bg-white ${childConfig.color} shadow-sm`}>
               <Baby className="w-8 h-8" />
            </div>
            <div>
               <h4 className={`text-xl font-extrabold ${childConfig.color} mb-2`}>{childConfig.label}</h4>
               <p className="text-lg text-gray-900 font-medium leading-relaxed">{result.childSuitability.reason}</p>
            </div>
        </div>

        {/* Highlights - Pills */}
        <div className="mt-6 flex flex-wrap gap-3">
           {result.pros?.map((pro, idx) => (
             <span key={`pro-${idx}`} className="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-green-100 text-green-800 border border-green-200">
               👍 {pro}
             </span>
           ))}
           {result.warnings?.map((warn, idx) => (
             <span key={`warn-${idx}`} className="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-red-100 text-red-800 border border-red-200">
               ⚠️ {warn}
             </span>
           ))}
        </div>
      </div>

      {/* Ingredients List */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-black px-2 flex items-center gap-2">
          <span>📋</span> 詳細成份 (白話文)
        </h3>
        {result.ingredients?.map((item, index) => (
          <div 
            key={index} 
            className={`p-5 rounded-2xl border-2 ${getCategoryBg(item.category)} flex gap-5 items-start shadow-sm`}
          >
            <div className="mt-1">
              {getCategoryIcon(item.category)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xl font-bold text-black">{item.name}</h4>
                {/* Optional Tag */}
                {item.category === IngredientCategory.UNHEALTHY && <span className="text-sm bg-white px-3 py-1 rounded-full text-red-700 font-extrabold border-2 border-red-200 shadow-sm">注意</span>}
              </div>
              <p className="text-lg text-gray-800 font-medium leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
        {(!result.ingredients || result.ingredients.length === 0) && (
          <div className="text-center text-gray-500 py-10">
            <p className="text-xl">沒看到詳細成份耶 🤔</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultCard;