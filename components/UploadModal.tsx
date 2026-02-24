
import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Building, Calendar, Sparkles, Loader2, List, Tags, Fingerprint, MapPin, FileCheck2, ScrollText, ReceiptText, FileSignature, AlertCircle, Eye, Download, ExternalLink, Trash2, CheckCircle2 } from 'lucide-react';
import { OrderStatus, OrderItem, OrderStamp, SupplierCategory, WarehouseType, FileType } from '../types';
import { extractDataFromDocument } from '../services/aiService';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, file: File | null) => Promise<void>;
}

const CATEGORIES: SupplierCategory[] = [
  'MEDICAMENTOS', 
  'MATERIAIS MÉDICOS', 
  'OPME (ÓRTESES/PRÓTESES)', 
  'LABORATÓRIO', 
  'GASES MEDICINAIS', 
  'HIGIENE & LIMPEZA',
  'ESCRITÓRIO & PAPELARIA',
  'HARDWARE & SOFTWARE',
  'MANUTENÇÃO (MRO)',
  'NUTRIÇÃO'
];

const WAREHOUSES: WarehouseType[] = [
  'FARMÁCIA',
  'ALMOXARIFADO CENTRAL',
  'T.I.',
  'ENGENHARIA CLÍNICA / MRO',
  'NUTRIÇÃO & DIETÉTICA'
];

const FILE_TYPES: { value: FileType; label: string; icon: any; color: string }[] = [
  { value: 'INVOICE', label: 'Nota Fiscal (NF)', icon: ReceiptText, color: 'text-brand-500' },
  { value: 'PURCHASE_ORDER', label: 'Ordem de Compra (OC)', icon: FileCheck2, color: 'text-brand-500' },
  { value: 'QUOTATION', label: 'Orçamento', icon: ScrollText, color: 'text-amber-500' },
  { value: 'CONTRACT', label: 'Contrato', icon: FileSignature, color: 'text-purple-500' },
  { value: 'OTHER', label: 'Outro Documento', icon: FileText, color: 'text-brand-500' }
];

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [docRef, setDocRef] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [category, setCategory] = useState<SupplierCategory>('MEDICAMENTOS');
  const [warehouse, setWarehouse] = useState<WarehouseType>('ALMOXARIFADO CENTRAL');
  const [fileType, setFileType] = useState<FileType>('OTHER');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [stamps, setStamps] = useState<OrderStamp[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setDocRef('');
      setSupplierName('');
      setCategory('MEDICAMENTOS');
      setWarehouse('ALMOXARIFADO CENTRAL');
      setFileType('OTHER');
      setAmount('');
      setItems([]);
      setFile(null);
      setExtractError(null);
      setSubmitError(null);
      setShowPreview(false);
      setIsSubmitting(false); // Reset de segurança
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      
      setExtractError(null);
      setSubmitError(null);
      setIsExtracting(true);
      
      try {
        const extracted = await extractDataFromDocument(selectedFile);
        
        if (extracted) {
          if (extracted.docRef) setDocRef(extracted.docRef);
          if (extracted.supplierName) setSupplierName(extracted.supplierName);
          if (extracted.amount) setAmount(extracted.amount.toString());
          
          if (extracted.date) {
            const d = new Date(extracted.date);
            if (!isNaN(d.getTime())) {
              setDate(d.toISOString().split('T')[0]);
            }
          }

          if (extracted.items) setItems(extracted.items);
          if (extracted.description) setDescription(extracted.description);
          if (extracted.fileType) setFileType(extracted.fileType);
          
          if (extracted.warehouse) {
            setWarehouse(extracted.warehouse);
          } else {
            const lowerSup = extracted.supplierName?.toLowerCase() || "";
            if (lowerSup.includes('pharma') || lowerSup.includes('lab')) setWarehouse('FARMÁCIA');
            else if (lowerSup.includes('tech') || lowerSup.includes('soft')) setWarehouse('T.I.');
          }

          if (warehouse === 'FARMÁCIA') setCategory('MEDICAMENTOS');
          if (warehouse === 'T.I.') setCategory('HARDWARE & SOFTWARE');
        } else {
          setExtractError("O Nexus não conseguiu identificar os dados automaticamente.");
        }
      } catch (err) {
        setExtractError("Erro ao processar arquivo.");
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Evita duplo clique

    setIsSubmitting(true);
    setSubmitError(null);
    
    let isoDate: string;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) throw new Error("Invalid Date");
      isoDate = d.toISOString();
    } catch {
      isoDate = new Date().toISOString();
    }

    try {
      await onSubmit({
        docRef,
        supplierName,
        category,
        warehouse,
        fileType,
        amount: parseFloat(amount) || 0,
        date: isoDate,
        description,
        items,
        stamps,
      }, file);
      onClose();
    } catch (error) {
      console.error(error);
      setSubmitError("Erro ao salvar ordem. Verifique o tamanho do arquivo ou a conexão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-900/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-[3rem] shadow-2xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[95vh] flex flex-col overflow-hidden animate-in sm:zoom-in duration-200 glass-card">
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-brand-100 flex justify-between items-center bg-brand-900 text-white">
          <div className="flex flex-col">
            <h2 className="text-xl font-black tracking-tighter flex items-center gap-2">
              SupriNexus Ingest <Sparkles size={18} className="text-brand-400" />
            </h2>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50">Auditoria Digital Autônoma</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} id="uploadForm" className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {submitError && (
             <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-xs font-bold">{submitError}</p>
             </div>
          )}

          <div 
            className={`border-2 border-dashed rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 transition-all relative min-h-[140px] flex items-center justify-center ${
              file ? 'border-brand-500 bg-brand-50/10' : 'border-brand-200 hover:border-brand-400 cursor-pointer'
            }`}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,image/*" />
            
            {isExtracting && (
              <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center rounded-[1.5rem] sm:rounded-[2rem] z-10 p-4">
                <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-900 text-center animate-pulse">Analizando Documento...</p>
              </div>
            )}

            {file ? (
              <div className="w-full flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-brand-100 shadow-sm">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="block text-sm font-black text-brand-900 truncate max-w-[200px] lg:max-w-[300px]">{file.name}</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {!extractError && fileType !== 'OTHER' && (
                        <span className="text-[9px] font-black text-brand-600 uppercase bg-brand-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 size={10} /> {FILE_TYPES.find(f => f.value === fileType)?.label} Detectado
                        </span>
                      )}
                      {extractError && (
                         <span className="text-[9px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertCircle size={10} /> Verificação Manual
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
                    className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-lg hover:shadow-brand-200 active:scale-95"
                    title="Visualizar arquivo"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}
                    className="p-3 bg-brand-50 text-brand-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                    title="Remover"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-brand-400 text-center">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-100">
                  <Upload size={24} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest">Upload de Documento Nexus</p>
                <p className="text-[8px] font-bold text-brand-300 mt-1">PDF ou Imagem (Máx. 10MB)</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-black text-brand-500 uppercase tracking-widest flex items-center gap-2">
                Classificação de Documento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FILE_TYPES.map(type => (
                  <button 
                    key={type.value}
                    type="button"
                    onClick={() => setFileType(type.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-1 ${fileType === type.value ? 'bg-brand-900 border-brand-900 text-white shadow-lg' : 'bg-white border-brand-100 text-brand-400 hover:border-brand-300'}`}
                  >
                    <type.icon size={16} className={fileType === type.value ? 'text-white' : type.color} />
                    <span className="text-[8px] font-black uppercase tracking-tighter leading-none">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-black text-brand-500 uppercase tracking-widest flex items-center gap-2">
                Setor de Destino
              </label>
              <select 
                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-brand-50 border border-brand-100 rounded-xl sm:rounded-2xl outline-none font-black text-sm text-brand-900 appearance-none focus:ring-2 focus:ring-brand-500/20" 
                value={warehouse} 
                onChange={e => setWarehouse(e.target.value as WarehouseType)}
              >
                {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Fornecedor / Razão Social</label>
              <input required type="text" className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-brand-50 border border-brand-100 rounded-xl sm:rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-brand-500/20" value={supplierName} onChange={e => setSupplierName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Categoria de Insumo</label>
              <select className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-brand-50 border border-brand-100 rounded-xl sm:rounded-2xl outline-none font-bold text-sm appearance-none focus:ring-2 focus:ring-brand-500/20" value={category} onChange={e => setCategory(e.target.value as SupplierCategory)}>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Valor Transação (R$)</label>
              <input required type="number" step="0.01" className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-brand-50 border border-brand-100 rounded-xl sm:rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-brand-500/20" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
        </form>

        <div className="p-6 sm:p-8 border-t border-brand-100 flex flex-col sm:flex-row gap-4 bg-white">
          <button type="button" onClick={onClose} className="order-2 sm:order-1 flex-1 py-4 bg-brand-100 text-brand-600 rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-200 transition-colors">Cancelar</button>
          <button 
            type="submit" 
            form="uploadForm"
            disabled={isSubmitting || isExtracting} 
            className={`order-1 sm:order-2 flex-[2] py-4 text-white rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl disabled:opacity-50 transition-all ${fileType === 'INVOICE' ? 'bg-brand-600 hover:bg-brand-700' : 'bg-brand-900 hover:bg-brand-600'}`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Processando...
              </div>
            ) : fileType === 'INVOICE' ? (
              'Confirmar Lançamento NF'
            ) : (
              'Confirmar Ingestão OC'
            )}
          </button>
        </div>
      </div>

      {/* Overlay Preview do Documento */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-brand-900/90 backdrop-blur-md p-4 sm:p-8 animate-in zoom-in duration-300">
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-brand-100 flex justify-between items-center bg-brand-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-400 truncate max-w-[200px]">{file?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 text-brand-600 hover:bg-brand-50 rounded-xl transition-all" title="Abrir em nova aba">
                  <ExternalLink size={20} />
                </a>
                <button onClick={() => setShowPreview(false)} className="p-2.5 hover:bg-brand-200 rounded-xl transition-colors text-brand-400 hover:text-brand-900"><X size={20}/></button>
              </div>
            </div>
            <div className="flex-1 bg-brand-100 relative overflow-hidden">
              {file?.type === 'application/pdf' ? (
                <object data={previewUrl} type="application/pdf" className="w-full h-full border-none">
                  <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-white">
                    <AlertCircle size={48} className="text-amber-500 mb-4" />
                    <p className="text-sm font-black text-brand-900 uppercase tracking-widest mb-2">Visualização Direta Indisponível</p>
                    <p className="text-[10px] font-medium text-brand-500 mb-6 max-w-xs uppercase leading-relaxed">Alguns navegadores bloqueiam a visualização de PDFs por segurança. Clique abaixo para abrir o documento.</p>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-brand-700 transition-all flex items-center gap-3">
                      Abrir PDF Externamente <ExternalLink size={14} />
                    </a>
                  </div>
                </object>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8 overflow-auto">
                  <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-brand-100 flex justify-center bg-white">
              <button 
                onClick={() => setShowPreview(false)} 
                className="px-10 py-4 bg-brand-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-brand-600 transition-all active:scale-95"
              >
                Retornar à Ingestão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadModal;
