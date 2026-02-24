
import React, { useMemo, useState } from 'react';
import { FileText, Download, Search, Trash2, ExternalLink, Filter, FolderOpen, Calendar, Building2, LayoutGrid, List as ListIcon, HardDrive, Share2, Clock, MapPin, ChevronDown } from 'lucide-react';
import { PurchaseOrder, WarehouseType } from '../types';

interface FileCenterProps {
  orders: PurchaseOrder[];
}

const WAREHOUSES: WarehouseType[] = [
  'FARMÁCIA',
  'ALMOXARIFADO CENTRAL',
  'T.I.',
  'ENGENHARIA CLÍNICA / MRO',
  'NUTRIÇÃO & DIETÉTICA'
];

const FileCenter: React.FC<FileCenterProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isGridView, setIsGridView] = useState(true);
  const [warehouseFilter, setWarehouseFilter] = useState<WarehouseType | 'TODOS'>('TODOS');

  const files = useMemo(() => {
    return orders
      .filter(o => o.fileName && o.fileUrl)
      .map(o => ({
        id: o.id,
        name: o.fileName!,
        url: o.fileUrl!,
        supplier: o.supplierName,
        warehouse: o.warehouse,
        date: o.date,
        amount: o.amount,
        category: o.category
      }))
      .filter(f => 
        (f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.supplier.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (warehouseFilter === 'TODOS' || f.warehouse === warehouseFilter)
      );
  }, [orders, searchTerm, warehouseFilter]);

  const stats = useMemo(() => ({
    totalFiles: files.length,
    totalVolume: (files.length * 1.2).toFixed(1) + ' MB',
    lastUpdate: files.length > 0 ? new Date(Math.max(...files.map(f => new Date(f.date).getTime()))).toLocaleDateString() : 'N/A'
  }), [files]);

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-0 space-y-8 animate-in fade-in duration-500 pb-20 sm:pb-0">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="w-full lg:w-auto">
          <div className="flex items-center gap-2 text-brand-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
            <span>Almoxarifado</span>
            <span>/</span>
            <span className="text-brand-600">Arquivo Digital</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-brand-900 tracking-tighter leading-tight uppercase">Laudos & Notas</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          {[
            { label: 'Documentos', value: stats.totalFiles, icon: FolderOpen },
            { label: 'Storage', value: stats.totalVolume, icon: HardDrive },
            { label: 'Entrada', value: stats.lastUpdate, icon: Clock }
          ].map((s, i) => (
            <div key={i} className="bg-white border border-brand-100 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm">
              <p className="text-[8px] font-black text-brand-400 uppercase tracking-widest mb-1 truncate">{s.label}</p>
              <p className="text-[10px] sm:text-xs font-black text-brand-900 flex items-center gap-2"><s.icon size={12} className="text-brand-500 shrink-0"/> {s.value}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-400" size={18} />
          <input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            type="text" 
            placeholder="Buscar arquivo..." 
            className="w-full pl-14 pr-6 py-4 bg-brand-50 border border-brand-100 rounded-2xl outline-none text-sm font-bold" 
          />
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-brand-100 shadow-sm w-full sm:w-auto">
           <div className="relative flex-1 sm:flex-none">
             <select 
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value as any)}
              className="w-full bg-transparent text-[10px] font-black uppercase tracking-widest px-4 py-3 outline-none border-r border-brand-100 appearance-none min-w-[120px]"
             >
               <option value="TODOS">Setores</option>
               {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
             </select>
             <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
           </div>
           <button onClick={() => setIsGridView(true)} className={`p-3 rounded-xl transition-all ${isGridView ? 'bg-brand-900 text-white shadow-lg' : 'text-brand-400'}`}><LayoutGrid size={18} /></button>
           <button onClick={() => setIsGridView(false)} className={`p-3 rounded-xl transition-all ${!isGridView ? 'bg-brand-900 text-white shadow-lg' : 'text-brand-400'}`}><ListIcon size={18} /></button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="py-20 text-center bg-brand-50 rounded-[2rem] border border-dashed border-brand-200">
           <FolderOpen size={48} className="mx-auto text-brand-200 mb-4" />
           <p className="text-brand-400 font-black uppercase text-[10px] tracking-widest px-6">Nenhum documento digitalizado neste contexto.</p>
        </div>
      ) : isGridView ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {files.map(file => (
            <div key={file.id} className="bg-white p-6 rounded-[2rem] border border-brand-100 hover:shadow-xl transition-all group flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-12 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
                   <FileText size={24} />
                </div>
                <button onClick={() => handleDownload(file.url, file.name)} className="p-2.5 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-600 hover:text-white transition-all"><Download size={18} /></button>
              </div>
              
              <div className="flex-1">
                <h3 className="text-sm font-black text-brand-900 mb-1 truncate uppercase" title={file.name}>{file.name}</h3>
                <div className="flex items-center gap-1.5 text-brand-400 text-[10px] font-bold uppercase truncate mb-1">
                  <Building2 size={12} /> {file.supplier}
                </div>
                <div className="flex items-center gap-1.5 text-brand-300 text-[9px] font-black uppercase">
                  <MapPin size={10} /> {file.warehouse}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-brand-50 flex justify-between items-center">
                <span className="text-[9px] font-black text-brand-400 uppercase">{new Date(file.date).toLocaleDateString()}</span>
                <span className="text-[10px] font-black text-brand-900 uppercase">R$ {(file.amount/1000).toFixed(1)}k</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-brand-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-brand-50/50 text-[10px] font-black text-brand-400 uppercase tracking-widest border-b border-brand-100">
                <tr>
                  <th className="px-6 py-4">Arquivo</th>
                  <th className="px-6 py-4">Laboratório</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50 font-bold text-xs">
                {files.map(file => (
                  <tr key={file.id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="px-6 py-5 flex items-center gap-3">
                      <FileText size={18} className="text-brand-500" />
                      <span className="text-brand-900 truncate max-w-[200px] uppercase">{file.name}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-brand-900 uppercase text-[10px] font-black truncate">{file.supplier}</div>
                      <div className="text-brand-400 text-[8px] font-black uppercase flex items-center gap-1"><MapPin size={10}/> {file.warehouse}</div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button onClick={() => handleDownload(file.url, file.name)} className="p-2.5 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-600 hover:text-white transition-all"><Download size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileCenter;
