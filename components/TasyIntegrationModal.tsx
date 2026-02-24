
import React, { useState, useEffect } from 'react';
import { X, Server, RefreshCw, Download, ArrowRight, CheckCircle2, Database, AlertCircle, Loader2, Building, Layers } from 'lucide-react';
import { PurchaseOrder } from '../types';
import { fetchTasyQueue } from '../services/mockService';

interface TasyIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (orders: PurchaseOrder[]) => Promise<void>;
}

const TasyIntegrationModal: React.FC<TasyIntegrationModalProps> = ({ isOpen, onClose, onImport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PurchaseOrder[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importStatus, setImportStatus] = useState<'idle' | 'success'>('idle');

  useEffect(() => {
    if (isOpen) {
      loadTasyData();
      setImportStatus('idle');
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const loadTasyData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTasyQueue();
      setPendingOrders(data);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);
    const toImport = pendingOrders.filter(o => selectedIds.has(o.id));
    
    // Simular delay de importação
    await new Promise(r => setTimeout(r, 1500));
    
    await onImport(toImport);
    setImportStatus('success');
    setIsLoading(false);
    
    // Fechar após sucesso
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-brand-900/80 backdrop-blur-md p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
        
        {/* Header Tasy Style */}
        <div className="bg-[#005F9E] p-8 flex justify-between items-center text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
           
           <div className="flex items-center gap-4 relative z-10">
             <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Database size={28} className="text-[#005F9E]" />
             </div>
             <div>
               <h2 className="text-2xl font-black tracking-tighter">Conector Tasy Philips</h2>
               <p className="text-[10px] font-bold text-brand-200 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse"></span> Online • Endpoint: /api/purchasing/queue
               </p>
             </div>
           </div>
           <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors relative z-10"><X size={20}/></button>
        </div>

        <div className="p-8 bg-brand-50 flex-1 min-h-[400px] flex flex-col">
          {importStatus === 'success' ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in">
               <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-6">
                 <CheckCircle2 size={40} />
               </div>
               <h3 className="text-2xl font-black text-brand-900 mb-2">Sincronização Concluída</h3>
               <p className="text-brand-500 font-medium">As ordens selecionadas foram importadas para o SupriNexus com sucesso.</p>
             </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-brand-500 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={16} /> Fila de Exportação Pendente
                </h3>
                <button onClick={loadTasyData} disabled={isLoading} className="p-2 text-[#005F9E] hover:bg-brand-50 rounded-lg transition-colors">
                  <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {isLoading && pendingOrders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                   <Loader2 size={32} className="animate-spin text-[#005F9E] mb-4" />
                   <p className="text-xs font-black uppercase text-brand-400">Consultando Banco de Dados Oracle...</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-brand-200 overflow-hidden shadow-sm flex-1">
                  <div className="overflow-y-auto max-h-[350px] custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="bg-brand-100 text-[9px] font-black text-brand-500 uppercase tracking-widest sticky top-0">
                        <tr>
                          <th className="px-6 py-4 w-10">
                            <input type="checkbox" className="rounded border-brand-300" 
                              checked={pendingOrders.length > 0 && selectedIds.size === pendingOrders.length}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedIds(new Set(pendingOrders.map(o => o.id)));
                                else setSelectedIds(new Set());
                              }}
                            />
                          </th>
                          <th className="px-6 py-4">ID Tasy</th>
                          <th className="px-6 py-4">Fornecedor</th>
                          <th className="px-6 py-4">Setor</th>
                          <th className="px-6 py-4 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-100 text-xs font-bold text-brand-700">
                        {pendingOrders.map(order => (
                          <tr key={order.id} className={`hover:bg-brand-50 transition-colors cursor-pointer ${selectedIds.has(order.id) ? 'bg-brand-50/50' : ''}`} onClick={() => toggleSelect(order.id)}>
                            <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                               <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleSelect(order.id)} className="rounded border-brand-300 text-[#005F9E] focus:ring-[#005F9E]" />
                            </td>
                            <td className="px-6 py-4 text-[#005F9E] font-black">{order.erpId}</td>
                            <td className="px-6 py-4">{order.supplierName}</td>
                            <td className="px-6 py-4 text-[10px] uppercase text-brand-400">{order.warehouse}</td>
                            <td className="px-6 py-4 text-right">R$ {order.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                        {pendingOrders.length === 0 && (
                          <tr><td colSpan={5} className="p-8 text-center text-brand-400 text-xs">Nenhuma ordem pendente encontrada na fila do Tasy.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {importStatus !== 'success' && (
          <div className="p-6 border-t border-brand-200 bg-white flex justify-end gap-3">
             <button onClick={onClose} className="px-6 py-3 rounded-xl text-brand-500 font-bold text-xs uppercase hover:bg-brand-100 transition-colors">Cancelar</button>
             <button 
              onClick={handleImport} 
              disabled={selectedIds.size === 0 || isLoading}
              className="px-8 py-3 bg-[#005F9E] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-brand-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
             >
               {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
               Importar ({selectedIds.size})
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasyIntegrationModal;
