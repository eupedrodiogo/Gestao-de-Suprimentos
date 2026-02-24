
import React, { useMemo, useState } from 'react';
import { PurchaseOrder, OrderStatus, SupplierCategory, VendorPerformance } from '../types';
import { Building2, ShieldAlert, ShieldCheck, Shield, ChevronRight, Tags, Info, AlertTriangle, TrendingDown, Clock, Sparkles, X, Activity, Target, Zap, Loader2 } from 'lucide-react';
import { analyzeVendorPerformance } from '../services/aiService';

interface SuppliersViewProps {
  orders: PurchaseOrder[];
}

const SuppliersView: React.FC<SuppliersViewProps> = ({ orders }) => {
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [performance, setPerformance] = useState<VendorPerformance | null>(null);
  const [isLoadingPerf, setIsLoadingPerf] = useState(false);

  const supplierData = useMemo(() => {
    const map = new Map<string, any>();
    
    orders.forEach(order => {
      const stats = map.get(order.supplierName) || {
        name: order.supplierName,
        totalOrders: 0,
        totalSpent: 0,
        categories: new Set<SupplierCategory>(),
        lastOrder: order.date,
        shippedOnTime: 0,
        pendingCount: 0
      };
      
      stats.totalOrders += 1;
      stats.totalSpent += order.amount;
      stats.categories.add(order.category);
      if (order.status === OrderStatus.RECEIVED) stats.shippedOnTime += 1;
      if (order.status === OrderStatus.PENDING_ALMOXARIFADO || order.status === OrderStatus.REQUESTED) stats.pendingCount += 1;
      if (new Date(order.date) > new Date(stats.lastOrder)) stats.lastOrder = order.date;
      
      map.set(order.supplierName, stats);
    });
    
    return Array.from(map.values()).map(s => {
      let level: 'STRATEGIC' | 'CRITICAL' | 'TRANSACTIONAL' = 'TRANSACTIONAL';
      if (s.totalSpent > 30000) level = 'STRATEGIC';
      else if (s.totalOrders > 5) level = 'CRITICAL';

      const riskScore = Math.min(10, (s.pendingCount * 2) + (level === 'CRITICAL' ? 3 : 1));

      return { ...s, level, riskScore };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const handleOpenScorecard = async (supplierName: string) => {
    setSelectedSupplier(supplierName);
    setIsLoadingPerf(true);
    try {
      const perf = await analyzeVendorPerformance(supplierName, orders);
      setPerformance(perf);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingPerf(false);
    }
  };

  const getLevelBadge = (level: string) => {
    switch(level) {
      case 'STRATEGIC': return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[8px] font-black flex items-center gap-1"><ShieldCheck size={10}/> ESTRATÉGICO</span>;
      case 'CRITICAL': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[8px] font-black flex items-center gap-1"><ShieldAlert size={10}/> CRÍTICO</span>;
      default: return <span className="bg-brand-100 text-brand-600 px-2 py-0.5 rounded text-[8px] font-black flex items-center gap-1"><Shield size={10}/> TRANSACIONAL</span>;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom duration-500 pb-20 lg:pb-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
            <span>Suprimentos</span>
            <span>/</span>
            <span className="text-brand-600">Supplier Relationship Management</span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-black text-brand-900 tracking-tighter leading-tight">Painel SRM</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supplierData.map((supplier, idx) => (
          <div key={idx} className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-brand-100 hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 ${supplier.riskScore > 7 ? 'bg-red-500' : supplier.riskScore > 4 ? 'bg-amber-500' : 'bg-brand-500'}`}></div>

            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-white">
                <Building2 size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col items-end gap-2">
                {getLevelBadge(supplier.level)}
                <div className="flex items-center gap-1.5 bg-brand-50 px-2 py-1 rounded-lg">
                  <span className="text-[8px] font-black text-brand-400 uppercase">Risk:</span>
                  <span className={`text-[10px] font-black ${supplier.riskScore > 7 ? 'text-red-600' : 'text-brand-900'}`}>{supplier.riskScore}/10</span>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg sm:text-xl font-black text-brand-900 tracking-tight mb-1 group-hover:text-brand-600 transition-colors uppercase truncate">{supplier.name}</h3>
            <div className="flex flex-wrap gap-1.5 mb-8">
              {Array.from(supplier.categories).map((cat: any) => (
                <span key={cat} className="text-[8px] font-black text-brand-400 border border-brand-100 px-2 py-0.5 rounded-full uppercase tracking-widest bg-brand-50/50">{cat}</span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-brand-400 uppercase tracking-widest flex items-center gap-1.5"><TrendingDown size={10} /> Total Spent</p>
                <p className="text-lg sm:text-xl font-black text-brand-900 tracking-tighter">R$ {supplier.totalSpent.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-brand-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={10} /> Atividade</p>
                <p className="text-lg sm:text-xl font-black text-brand-900 tracking-tighter">{supplier.totalOrders} <span className="text-[10px] font-bold text-brand-400 uppercase">PO's</span></p>
              </div>
            </div>

            <button 
              onClick={() => handleOpenScorecard(supplier.name)}
              className="w-full py-4 bg-brand-900 text-white rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              Scorecard Detalhado <ChevronRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {selectedSupplier && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-900/80 backdrop-blur-md p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-[3rem] shadow-2xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col animate-in sm:zoom-in duration-300">
             <div className="p-6 sm:p-8 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-900 rounded-xl flex items-center justify-center text-white"><Activity size={20}/></div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-black text-brand-900 tracking-tighter uppercase truncate max-w-[150px] sm:max-w-none">{selectedSupplier}</h2>
                    <p className="text-[9px] font-black text-brand-400 uppercase tracking-widest">Auditoria de Performance IA</p>
                  </div>
               </div>
               <button onClick={() => { setSelectedSupplier(null); setPerformance(null); }} className="p-2 hover:bg-brand-200 rounded-xl transition-colors text-brand-400 hover:text-brand-900"><X size={24}/></button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                {isLoadingPerf ? (
                  <div className="py-20 flex flex-col items-center justify-center text-brand-400">
                    <Loader2 className="animate-spin text-brand-600 mb-4" size={40} />
                    <p className="font-black uppercase tracking-widest text-[10px] animate-pulse">O Nexus está analisando o histórico...</p>
                  </div>
                ) : performance && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom">
                    <div className="flex justify-center">
                       {/* Aumentado o tamanho do gráfico para mobile (w-48 h-48) e adicionado viewBox para escalabilidade correta */}
                       <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-brand-100" />
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * performance.score) / 100} className={`${performance.score < 40 ? 'text-red-500' : performance.score < 70 ? 'text-amber-500' : 'text-brand-600'} transition-all duration-1000`} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-3xl sm:text-5xl font-black text-brand-900">{performance.score}</span>
                             <span className="text-[10px] sm:text-xs font-black text-brand-400 uppercase tracking-widest">Score Global</span>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                       {[
                         { label: 'Custos', val: performance.costEfficiency, icon: TrendingDown, color: 'text-brand-500', bg: 'bg-brand-50' },
                         { label: 'Confiança', val: performance.reliability, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
                         { label: 'Compliance', val: performance.compliance, icon: ShieldCheck, color: 'text-brand-500', bg: 'bg-brand-50' }
                       ].map((m, i) => (
                         <div key={i} className="bg-brand-50 p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-brand-100 text-center flex flex-col items-center">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${m.bg} ${m.color} rounded-xl flex items-center justify-center mb-2 sm:mb-3`}><m.icon size={16}/></div>
                            <p className="text-[9px] font-black text-brand-400 uppercase tracking-widest mb-1 truncate w-full">{m.label}</p>
                            <p className="text-base sm:text-lg font-black text-brand-900">{m.val}%</p>
                         </div>
                       ))}
                    </div>

                    <div className={`p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl ${performance.score < 60 ? 'bg-amber-600' : 'bg-brand-600'} text-white transition-colors duration-500`}>
                       <div className="flex items-center gap-2 mb-4">
                          <Sparkles size={18} className="animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Parecer Analítico Nexus AI</span>
                       </div>
                       <p className="text-xs sm:text-sm font-medium leading-relaxed italic">
                         "{performance.aiAnalysis}"
                       </p>
                    </div>
                  </div>
                )}
             </div>

             <div className="p-6 sm:p-8 border-t border-brand-100 bg-white">
                <button 
                  onClick={() => { setSelectedSupplier(null); setPerformance(null); }}
                  className="w-full py-5 bg-brand-900 text-white rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 transition-all shadow-xl active:scale-95"
                >
                  Confirmar Análise
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersView;
