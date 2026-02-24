
import React from 'react';
import { X, Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target, ArrowRight, Download } from 'lucide-react';
import { StrategicReport } from '../services/aiService';

interface StrategyModalProps {
  report: StrategicReport | null;
  isOpen: boolean;
  onClose: () => void;
}

const StrategyModal: React.FC<StrategyModalProps> = ({ report, isOpen, onClose }) => {
  if (!isOpen || !report) return null;

  const handleDownloadReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `strategic_report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/80 backdrop-blur-md p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
        <div className="px-10 py-8 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-brand-900 tracking-tighter">Strategic Intelligence Report</h2>
              <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">IA Sourcing Analytics v1.0</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownloadReport} className="p-3 hover:bg-brand-50 text-brand-600 rounded-2xl transition-colors"><Download size={24} /></button>
            <button onClick={onClose} className="p-3 hover:bg-brand-200 rounded-2xl transition-colors"><X size={24} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
          {/* Executive Summary */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-brand-400 uppercase tracking-widest flex items-center gap-2">
              <Target size={16} className="text-brand-600" /> Resumo Executivo
            </h3>
            <div className="p-8 bg-brand-50 border border-brand-100 rounded-[2.5rem]">
              <p className="text-xl font-bold text-brand-800 leading-relaxed italic">
                "{report.summary}"
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Savings Opportunities */}
            <section className="space-y-6">
              <h3 className="text-sm font-black text-brand-400 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-600" /> Alavancas de Savings
              </h3>
              <div className="space-y-4">
                {report.savingsOpportunities.map((opt, i) => (
                  <div key={i} className="p-6 bg-white border border-brand-100 rounded-3xl hover:border-brand-200 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-brand-900 group-hover:text-brand-600 transition-colors uppercase text-sm">{opt.title}</h4>
                      <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black">{opt.potentialValue} Est.</span>
                    </div>
                    <p className="text-xs text-brand-500 font-medium leading-relaxed">{opt.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Risk Analysis */}
            <section className="space-y-6">
              <h3 className="text-sm font-black text-brand-400 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" /> Matriz de Riscos SRM
              </h3>
              <div className="space-y-4">
                {report.riskAnalysis.map((risk, i) => (
                  <div key={i} className="p-6 bg-brand-50 border border-brand-100 rounded-3xl">
                    <h4 className="font-black text-brand-900 mb-1 text-sm uppercase">{risk.supplier}</h4>
                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-3 flex items-center gap-1">
                       Risco: {risk.risk}
                    </p>
                    <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-brand-100">
                       <Lightbulb size={14} className="text-brand-500 shrink-0 mt-0.5" />
                       <p className="text-xs text-brand-600 font-medium">{risk.mitigation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="p-10 border-t border-brand-100 bg-brand-50/30 flex justify-end">
          <button onClick={onClose} className="px-10 py-5 bg-brand-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-brand-600 transition-all shadow-xl">
            Aplicar Estratégia <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyModal;
