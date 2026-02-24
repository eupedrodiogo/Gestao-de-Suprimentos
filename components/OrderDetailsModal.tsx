import React, { useMemo, useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Calendar, ArrowRight, ArrowLeft, History, Hash, 
  List, StickyNote, AlertCircle, Sparkles, Fingerprint, Verified, 
  Landmark, FileCheck, Award, Cpu, Download, FileText, Banknote, 
  MapPin, Search, ExternalLink, Clock, Navigation, LocateFixed, Truck, PackageCheck, Send, MessageSquare,
  Loader2, Edit3, Check, Save, Printer, ThumbsUp, ThumbsDown, ThermometerSnowflake, Activity, Eye, FileSearch,
  Bot, ShoppingCart, Upload, FileText as FileIcon, XCircle
} from 'lucide-react';
import { User, PurchaseOrder, OrderStatus, OrderStamp, OrderItem, Quotation } from '../types';
import StatusBadge from './StatusBadge';
import { updateOrder, addOrderNote, getOrders } from '../services/mockService';
import { getSupplierReputation, findSupplierLocation, MarketInsight, getApprovalRecommendation, generateAiQuotations, extractQuotationData } from '../services/aiService';

interface OrderDetailsModalProps {
  order: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updated: PurchaseOrder) => void;
  currentUser: User | null;
}

type ModalTab = 'details' | 'preview' | 'market' | 'logistics' | 'history' | 'quotations';

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, isOpen, onClose, onUpdate, currentUser }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>('details');
  const [marketData, setMarketData] = useState<MarketInsight | null>(null);
  const [locationData, setLocationData] = useState<MarketInsight | null>(null);
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  const [aiRecommendation, setAiRecommendation] = useState<{ recommendation: string; reason: string } | null>(null);
  const [isLoadingRec, setIsLoadingRec] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  
  // Quotations State
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isGeneratingQuotes, setIsGeneratingQuotes] = useState(false);
  const [isAddingManualQuote, setIsAddingManualQuote] = useState(false);
  const [manualQuoteForm, setManualQuoteForm] = useState({
    supplierName: '',
    price: '',
    deliveryTimeDays: '',
    paymentTerms: '',
    file: null as File | null
  });
  
  // Workflow States
  const [scNumberInput, setScNumberInput] = useState('');

  useEffect(() => {
    if (isOpen && order && (order.status === OrderStatus.PENDING_ALMOXARIFADO || order.status === OrderStatus.REQUESTED)) {
      const fetchRec = async () => {
        setIsLoadingRec(true);
        const allOrders = await getOrders();
        const rec = await getApprovalRecommendation(order, allOrders);
        setAiRecommendation(rec);
        setIsLoadingRec(false);
      };
      fetchRec();
    }
  }, [isOpen, order]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('details');
      setMarketData(null);
      setLocationData(null);
      setNewNote('');
      setIsEditing(false);
      setAiRecommendation(null);
      setScNumberInput('');
    } else if (order) {
      setEditedItems(order.items || []);
      setScNumberInput(order.scNumber || '');
      setQuotations(order.quotations || []);
    }
  }, [isOpen, order]);

  const handleGenerateQuotations = async () => {
    if (!order) return;
    setIsGeneratingQuotes(true);
    setActiveTab('quotations');
    try {
      const quotes = await generateAiQuotations(order);
      setQuotations(quotes);
      // Save immediately
      await updateOrder(order.id, { quotations: quotes });
      if (onUpdate) onUpdate({ ...order, quotations: quotes });
    } finally {
      setIsGeneratingQuotes(false);
    }
  };

  const handleSelectWinner = async (quoteId: string) => {
    if (!order) return;
    const updatedQuotes = quotations.map(q => ({ ...q, isWinner: q.id === quoteId }));
    setQuotations(updatedQuotes);
    
    const winner = updatedQuotes.find(q => q.id === quoteId);
    
    // Update order with winner details
    const updates: Partial<PurchaseOrder> = {
      quotations: updatedQuotes,
      amount: winner ? winner.price : order.amount,
      supplierName: winner ? winner.supplierName : order.supplierName
    };
    
    await updateOrder(order.id, updates);
    if (onUpdate) onUpdate({ ...order, ...updates });
  };

  const [isExtractingQuote, setIsExtractingQuote] = useState(false);

  const handleManualQuoteFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setManualQuoteForm(prev => ({ ...prev, file }));
    setIsExtractingQuote(true);

    try {
      const extractedData = await extractQuotationData(file);
      if (extractedData) {
        setManualQuoteForm(prev => ({
          ...prev,
          supplierName: extractedData.supplierName || prev.supplierName,
          price: extractedData.price?.toString() || prev.price,
          deliveryTimeDays: extractedData.deliveryTimeDays?.toString() || prev.deliveryTimeDays,
          paymentTerms: extractedData.paymentTerms || prev.paymentTerms
        }));
      }
    } finally {
      setIsExtractingQuote(false);
    }
  };

  const handleSaveManualQuote = async () => {
    if (!order || !manualQuoteForm.supplierName || !manualQuoteForm.price) return;

    let fileUrl = undefined;
    let fileName = undefined;

    if (manualQuoteForm.file) {
      fileName = manualQuoteForm.file.name;
      // Convert to base64 for mock storage
      fileUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(manualQuoteForm.file!);
      });
    }

    const newQuote: Quotation = {
      id: `QUOTE-MANUAL-${Date.now()}`,
      supplierName: manualQuoteForm.supplierName,
      price: parseFloat(manualQuoteForm.price),
      deliveryTimeDays: parseInt(manualQuoteForm.deliveryTimeDays) || 0,
      paymentTerms: manualQuoteForm.paymentTerms || 'A combinar',
      isWinner: false,
      aiScore: 100, // Manual quotes are trusted
      aiReasoning: 'Cotação inserida manualmente pelo comprador.',
      fileUrl,
      fileName
    };

    const updatedQuotes = [...quotations, newQuote];
    setQuotations(updatedQuotes);
    await updateOrder(order.id, { quotations: updatedQuotes });
    if (onUpdate) onUpdate({ ...order, quotations: updatedQuotes });
    
    setIsAddingManualQuote(false);
    setManualQuoteForm({
      supplierName: '',
      price: '',
      deliveryTimeDays: '',
      paymentTerms: '',
      file: null
    });
  };

  const handleFetchMarketData = async () => {
    if (!order || marketData) return;
    setIsLoadingMarket(true);
    const result = await getSupplierReputation(order.supplierName);
    setMarketData(result);
    setIsLoadingMarket(false);
  };

  const handleFetchLocationData = async () => {
    if (!order || locationData) return;
    setIsLoadingLocation(true);
    const result = await findSupplierLocation(order.supplierName);
    setLocationData(result);
    setIsLoadingLocation(false);
  };

  if (!isOpen || !order) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleStatusChange = async (newStatus: OrderStatus, additionalUpdates: Partial<PurchaseOrder> = {}) => {
    setIsProcessing(true);
    try {
      const updated = await updateOrder(order.id, { status: newStatus, ...additionalUpdates });
      if (updated && onUpdate) onUpdate(updated);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateItemField = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...editedItems];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      item.totalPrice = item.quantity * item.unitPrice;
    }
    updated[index] = item;
    setEditedItems(updated);
  };

  const handleSaveChanges = async () => {
    setIsProcessing(true);
    const totalAmount = editedItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
    try {
      const updated = await updateOrder(order.id, { items: editedItems, amount: totalAmount });
      if (updated && onUpdate) {
        onUpdate(updated);
        setIsEditing(false);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    try {
      const updated = await addOrderNote(order.id, newNote, currentUser?.name || 'Usuário');
      if (updated && onUpdate) {
        onUpdate(updated);
        setNewNote('');
      }
    } finally {
      setIsAddingNote(false);
    }
  };

  const getStampStyles = (type: string) => {
    switch (type) {
      case 'FISCAL': return { icon: <Landmark size={20} />, color: 'text-amber-400', border: 'border-amber-500/30' };
      case 'DIGITAL_SIGNATURE': return { icon: <Fingerprint size={20} />, color: 'text-brand-400', border: 'border-brand-500/30' };
      case 'APPROVAL': return { icon: <FileCheck size={20} />, color: 'text-brand-400', border: 'border-brand-500/30' };
      default: return { icon: <Verified size={20} />, color: 'text-brand-400', border: 'border-brand-500/30' };
    }
  };

  // Helper to determine if the base64 is a PDF
  const isPdf = order.fileUrl?.startsWith('data:application/pdf') || order.fileName?.toLowerCase().endsWith('.pdf');

  const renderWorkflowActions = () => {
    if (!currentUser) return null;
    const role = currentUser.role;
    const status = order.status;

    // 1. Almoxarifado recebe e gera SC
    if (status === OrderStatus.PENDING_ALMOXARIFADO && role === 'COORD_ALMOXARIFADO') {
      return (
        <div className="flex flex-col sm:flex-row gap-4 w-full items-end">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-500 mb-1 block">Número da SC (Protheus)</label>
            <input 
              value={scNumberInput}
              onChange={e => setScNumberInput(e.target.value)}
              placeholder="Ex: SC-123456"
              className="w-full p-3 bg-brand-50 border border-brand-200 rounded-xl text-sm font-bold outline-none focus:border-brand-500"
            />
          </div>
          <button 
            onClick={() => handleStatusChange(OrderStatus.SC_CREATED, { scNumber: scNumberInput })}
            disabled={!scNumberInput || isProcessing}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Gerar SC
          </button>
        </div>
      );
    }

    // 2. Almoxarifado envia para Compras
    if (status === OrderStatus.SC_CREATED && role === 'COORD_ALMOXARIFADO') {
      return (
        <button 
          onClick={() => handleStatusChange(OrderStatus.QUOTATION_PROCESS)}
          disabled={isProcessing}
          className="px-6 py-3 bg-brand-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600"
        >
          Enviar para Compras <ArrowRight size={16} className="inline ml-1"/>
        </button>
      );
    }

    // 3. Compras faz cotação e envia para Sede
    if (status === OrderStatus.QUOTATION_PROCESS && role === 'COMPRAS') {
      return (
        <div className="flex gap-3">
           <button 
            onClick={() => { setActiveTab('quotations'); handleGenerateQuotations(); }}
            disabled={isProcessing}
            className="px-6 py-3 bg-brand-50 text-brand-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-100"
          >
            <Sparkles size={16} className="inline mr-2"/>
            {quotations.length > 0 ? 'Ver Cotações' : 'Gerar Cotações AI'}
          </button>
          <button 
            onClick={() => handleStatusChange(OrderStatus.WAITING_HQ_APPROVAL)}
            disabled={isProcessing || quotations.length === 0 || !quotations.some(q => q.isWinner)}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar para Aprovação Sede <Send size={16} className="inline ml-1"/>
          </button>
        </div>
      );
    }

    // 4. Sede Aprova/Rejeita
    if (status === OrderStatus.WAITING_HQ_APPROVAL && (role === 'DIRETORIA' || role === 'GERENCIA_SUPRIMENTOS')) {
      return (
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => handleStatusChange(OrderStatus.REJECTED)}
            disabled={isProcessing}
            className="flex-1 sm:flex-none px-6 py-3 border border-red-200 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50"
          >
            Rejeitar
          </button>
          <button 
            onClick={() => handleStatusChange(OrderStatus.APPROVED)}
            disabled={isProcessing}
            className="flex-1 sm:flex-none px-6 py-3 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700"
          >
            Aprovar Solicitação <Check size={16} className="inline ml-1"/>
          </button>
        </div>
      );
    }

    // 5. Compras inicia processo de compra (Gera Pedido)
    if (status === OrderStatus.APPROVED && role === 'COMPRAS') {
      return (
        <button 
          onClick={() => handleStatusChange(OrderStatus.PURCHASING)}
          disabled={isProcessing}
          className="px-6 py-3 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700"
        >
          Gerar Pedido de Compra
        </button>
      );
    }

    // 6. Compras confirma pedido e aguarda entrega
    if (status === OrderStatus.PURCHASING && role === 'COMPRAS') {
      return (
        <button 
          onClick={() => handleStatusChange(OrderStatus.AWAITING_DELIVERY)}
          disabled={isProcessing}
          className="px-6 py-3 bg-sky-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-sky-700"
        >
          Confirmar Pedido (Aguardando Entrega)
        </button>
      );
    }

    // 7. Almoxarifado recebe material
    if (status === OrderStatus.AWAITING_DELIVERY && role === 'COORD_ALMOXARIFADO') {
      return (
        <button 
          onClick={() => handleStatusChange(OrderStatus.RECEIVED)}
          disabled={isProcessing}
          className="px-6 py-3 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700"
        >
          Receber Material (Registrar NF)
        </button>
      );
    }

    // 8. Almoxarifado disponibiliza para retirada
    if (status === OrderStatus.RECEIVED && role === 'COORD_ALMOXARIFADO') {
      return (
        <button 
          onClick={() => handleStatusChange(OrderStatus.AVAILABLE_FOR_PICKUP)}
          disabled={isProcessing}
          className="px-6 py-3 bg-lime-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-lime-700"
        >
          Disponibilizar para Retirada
        </button>
      );
    }

    // 9. Solicitante retira
    if (status === OrderStatus.AVAILABLE_FOR_PICKUP && (role === 'SOLICITANTE' || role === 'COORD_ALMOXARIFADO')) {
      return (
        <button 
          onClick={() => handleStatusChange(OrderStatus.COMPLETED)}
          disabled={isProcessing}
          className="px-6 py-3 bg-brand-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-900"
        >
          Confirmar Retirada (Concluir)
        </button>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-900/95 backdrop-blur-xl p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-[3rem] shadow-2xl w-full max-w-6xl flex flex-col lg:flex-row h-full sm:h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Sidebar Info */}
        <div className="w-full lg:w-80 bg-brand-900 p-6 sm:p-10 flex flex-col text-white shrink-0 overflow-y-auto custom-scrollbar lg:h-full">
          <div className="flex justify-between items-center mb-8 lg:block">
            <button onClick={onClose} className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
            <div className="text-right lg:text-left lg:mt-6">
              <h3 className="text-xl sm:text-2xl font-black tracking-tighter leading-none truncate">{order.id}</h3>
              <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mt-2">{order.warehouse}</p>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-8 flex-1">
            <div className="space-y-4">
               <h4 className="text-[9px] font-black text-brand-600 uppercase tracking-widest">Detalhes da Solicitação</h4>
               <div className="bg-white/5 p-4 rounded-3xl space-y-3">
                  <div>
                    <p className="text-[8px] text-brand-500 uppercase font-bold">Solicitante</p>
                    <p className="text-xs font-bold">{order.requesterName || 'N/A'}</p>
                    <p className="text-[9px] text-brand-400">{order.requesterRole}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-brand-500 uppercase font-bold">Destino</p>
                    <p className="text-xs font-bold">{order.destinationLocation || order.warehouse}</p>
                  </div>
                  {order.scNumber && (
                    <div>
                      <p className="text-[8px] text-brand-500 uppercase font-bold">SC Protheus</p>
                      <p className="text-xs font-bold text-cyan-400">{order.scNumber}</p>
                    </div>
                  )}
               </div>

               <h4 className="text-[9px] font-black text-brand-600 uppercase tracking-widest mt-6">Controles Ativos</h4>
               {order.stamps?.map((stamp, idx) => {
                 const styles = getStampStyles(stamp.type);
                 return (
                    <div key={idx} className={`border ${styles.border} p-4 rounded-3xl bg-white/5`}>
                      <div className="flex items-center gap-3">
                        <div className={`${styles.color}`}>{styles.icon}</div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{stamp.label}</p>
                          <p className="text-[8px] font-bold text-brand-500 uppercase">{stamp.issuer}</p>
                        </div>
                      </div>
                    </div>
                 )
               })}
            </div>

            {order.fileName && (
              <div className="mt-auto p-6 bg-brand-600/20 rounded-3xl border border-brand-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest">Digital Vault</p>
                    <p className="text-[10px] font-bold text-brand-300 truncate w-40">{order.fileName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('preview')}
                  className="w-full py-3 bg-brand-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-500 transition-all"
                >
                  <Eye size={14} /> Visualizar Original
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Sticky Header with Tabs */}
          <div className="px-6 sm:px-12 pt-6 sm:pt-8 bg-white border-b border-brand-100 sticky top-0 z-10">
            <div className="flex items-center justify-between mb-6">
              <StatusBadge status={order.status} />
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="p-2.5 rounded-xl text-brand-600 hover:bg-brand-100"><Printer size={20} /></button>
                <button className="p-2.5 rounded-xl text-brand-600 hover:bg-brand-50"><Download size={20} /></button>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar mask-gradient-right">
              {[
                { id: 'details', label: 'Insumos', icon: List },
                { id: 'quotations', label: 'Cotações AI', icon: Bot },
                { id: 'preview', label: 'Visualizar', icon: Eye, disabled: !order.fileUrl },
                { id: 'market', label: 'Reputação', icon: Search },
                { id: 'logistics', label: 'Logística', icon: MapPin },
                { id: 'history', label: 'Audit', icon: MessageSquare },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  disabled={tab.disabled}
                  onClick={() => {
                    setActiveTab(tab.id as ModalTab);
                    if (tab.id === 'market') handleFetchMarketData();
                    if (tab.id === 'logistics') handleFetchLocationData();
                  }}
                  className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest transition-all relative flex items-center gap-2 shrink-0 ${tab.disabled ? 'opacity-20 cursor-not-allowed' : (activeTab === tab.id ? 'text-brand-600' : 'text-brand-400')}`}
                >
                  <tab.icon size={14} /> {tab.label}
                  {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-t-full"></div>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 sm:py-12 space-y-10 custom-scrollbar">
            {activeTab === 'details' && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                  <div className="w-full sm:flex-1">
                    <h2 className="text-3xl sm:text-5xl font-black text-brand-900 tracking-tighter uppercase leading-tight">{order.supplierName}</h2>
                    <p className="text-brand-500 font-bold italic mt-4 text-base sm:text-lg">"{order.description}"</p>
                    {order.justification && (
                       <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-900">
                         <span className="font-bold uppercase text-[10px] block mb-1 text-amber-500">Justificativa</span>
                         {order.justification}
                       </div>
                    )}
                  </div>
                  <div className="w-full sm:w-auto text-left sm:text-right">
                    <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">Total Requisição</p>
                    <div className="text-3xl sm:text-5xl font-black text-brand-900 tracking-tighter">
                      {formatCurrency(isEditing ? editedItems.reduce((acc, curr) => acc + curr.totalPrice, 0) : order.amount)}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] font-black text-brand-900 uppercase tracking-widest">Lista de Itens</h4>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="text-[10px] font-black uppercase tracking-widest text-brand-600 flex items-center gap-1.5"><Edit3 size={14}/> Editar</button>
                    ) : (
                      <div className="flex gap-3">
                         <button onClick={() => setIsEditing(false)} className="text-[10px] font-black uppercase tracking-widest text-brand-400">Cancelar</button>
                         <button onClick={handleSaveChanges} className="text-[10px] font-black uppercase tracking-widest text-brand-600 flex items-center gap-1.5"><Save size={14}/> Salvar</button>
                      </div>
                    )}
                  </div>
                  <div className="border border-brand-100 rounded-3xl overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-brand-50 text-[9px] font-black text-brand-400 uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Item</th>
                          <th className="px-6 py-4 text-center">Padronizado</th>
                          <th className="px-6 py-4 text-center">Qtd</th>
                          <th className="px-6 py-4 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-50">
                        {(isEditing ? editedItems : (order.items || [])).map((item, idx) => (
                          <tr key={idx} className="text-sm">
                            <td className="px-6 py-5">
                               {isEditing ? <input value={item.description} onChange={e => updateItemField(idx, 'description', e.target.value)} className="w-full bg-transparent border-b border-brand-100 outline-none" /> : item.description}
                               <div className="text-[9px] text-brand-400 uppercase font-black tracking-widest mt-1">Lote: {item.lotNumber} | ANVISA: {item.anvisaReg}</div>
                            </td>
                            <td className="px-6 py-5 text-center">
                               {item.isStandardized ? <span className="text-brand-600 text-[10px] font-bold">SIM</span> : <span className="text-brand-400 text-[10px]">NÃO</span>}
                            </td>
                            <td className="px-6 py-5 text-center">
                               {isEditing ? <input type="number" value={item.quantity} onChange={e => updateItemField(idx, 'quantity', parseInt(e.target.value))} className="w-16 text-center bg-transparent border-b border-brand-100 outline-none" /> : item.quantity}
                            </td>
                            <td className="px-6 py-5 text-right font-black">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'quotations' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-brand-900">Cotações de Mercado</h3>
                    <p className="text-xs text-brand-500 font-bold">Powered by Nexus AI Sourcing</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsAddingManualQuote(true)}
                      className="px-4 py-3 bg-white border border-brand-200 text-brand-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-50 flex items-center gap-2"
                    >
                      <Upload size={16}/> Adicionar Manual
                    </button>
                    <button 
                      onClick={handleGenerateQuotations}
                      disabled={isGeneratingQuotes}
                      className="px-6 py-3 bg-brand-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isGeneratingQuotes ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                      {quotations.length > 0 ? 'Regerar Cotações' : 'Gerar Cotações IA'}
                    </button>
                  </div>
                </div>

                {isAddingManualQuote && (
                  <div className="bg-brand-50 p-6 rounded-3xl border border-brand-200 animate-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-black uppercase tracking-widest text-brand-700">Nova Cotação Manual</h4>
                      <button onClick={() => setIsAddingManualQuote(false)}><XCircle size={20} className="text-brand-400 hover:text-red-500"/></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <input 
                        placeholder="Nome do Fornecedor" 
                        value={manualQuoteForm.supplierName}
                        onChange={e => setManualQuoteForm({...manualQuoteForm, supplierName: e.target.value})}
                        className="p-3 rounded-xl border border-brand-200 text-sm font-bold outline-none focus:border-brand-400"
                      />
                      <input 
                        type="number" 
                        placeholder="Preço Total (R$)" 
                        value={manualQuoteForm.price}
                        onChange={e => setManualQuoteForm({...manualQuoteForm, price: e.target.value})}
                        className="p-3 rounded-xl border border-brand-200 text-sm font-bold outline-none focus:border-brand-400"
                      />
                      <input 
                        type="number" 
                        placeholder="Prazo de Entrega (dias)" 
                        value={manualQuoteForm.deliveryTimeDays}
                        onChange={e => setManualQuoteForm({...manualQuoteForm, deliveryTimeDays: e.target.value})}
                        className="p-3 rounded-xl border border-brand-200 text-sm font-bold outline-none focus:border-brand-400"
                      />
                      <input 
                        placeholder="Condições de Pagamento" 
                        value={manualQuoteForm.paymentTerms}
                        onChange={e => setManualQuoteForm({...manualQuoteForm, paymentTerms: e.target.value})}
                        className="p-3 rounded-xl border border-brand-200 text-sm font-bold outline-none focus:border-brand-400"
                      />
                      <div className="sm:col-span-2">
                        <label className={`block w-full p-3 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${isExtractingQuote ? 'border-brand-200 bg-brand-50' : 'border-brand-300 hover:bg-brand-100'}`}>
                          <input 
                            type="file" 
                            className="hidden" 
                            onChange={handleManualQuoteFileChange}
                            disabled={isExtractingQuote}
                          />
                          <div className="flex items-center justify-center gap-2">
                            {isExtractingQuote ? (
                              <>
                                <Loader2 size={16} className="animate-spin text-brand-500"/>
                                <span className="text-xs font-bold text-brand-500">Extraindo dados com Nexus AI...</span>
                              </>
                            ) : (
                              <span className="text-xs font-bold text-brand-500">
                                {manualQuoteForm.file ? manualQuoteForm.file.name : 'Anexar PDF da Cotação (Nexus AI extrairá os dados)'}
                              </span>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                    <button 
                      onClick={handleSaveManualQuote}
                      disabled={!manualQuoteForm.supplierName || !manualQuoteForm.price}
                      className="w-full py-3 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700 disabled:opacity-50"
                    >
                      Salvar Cotação
                    </button>
                  </div>
                )}

                {isGeneratingQuotes ? (
                   <div className="py-20 flex flex-col items-center justify-center gap-4 text-brand-400">
                     <Loader2 size={48} className="animate-spin text-brand-500"/>
                     <p className="text-xs font-black uppercase tracking-widest">Negociando com fornecedores...</p>
                   </div>
                ) : quotations.length === 0 ? (
                   <div className="py-20 flex flex-col items-center justify-center gap-4 text-brand-300 border-2 border-dashed border-brand-100 rounded-3xl">
                     <ShoppingCart size={48} />
                     <p className="text-xs font-black uppercase tracking-widest">Nenhuma cotação disponível</p>
                   </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {quotations.map((quote) => (
                      <div key={quote.id} className={`relative p-6 rounded-3xl border-2 transition-all ${quote.isWinner ? 'border-brand-500 bg-brand-50/50' : 'border-brand-100 bg-white hover:border-brand-50'}`}>
                        {quote.isWinner && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                            <Award size={12}/> Vencedora
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                           <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 font-bold text-xs">
                             {quote.supplierName.substring(0, 2).toUpperCase()}
                           </div>
                           <div className="flex items-center gap-1 bg-brand-50 text-brand-600 px-2 py-1 rounded-lg">
                             {quote.id.includes('MANUAL') ? <Upload size={12}/> : <Sparkles size={12}/>}
                             <span className="text-[10px] font-black">{quote.aiScore}</span>
                           </div>
                        </div>
                        <h4 className="font-bold text-brand-900 mb-1 truncate" title={quote.supplierName}>{quote.supplierName}</h4>
                        <p className="text-2xl font-black text-brand-900 tracking-tight mb-4">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.price)}
                        </p>
                        
                        <div className="space-y-2 mb-6">
                          <div className="flex justify-between text-xs">
                            <span className="text-brand-500">Entrega</span>
                            <span className="font-bold text-brand-700">{quote.deliveryTimeDays} dias</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-brand-500">Pagamento</span>
                            <span className="font-bold text-brand-700">{quote.paymentTerms}</span>
                          </div>
                          {quote.fileName && (
                            <div className="flex justify-between text-xs pt-2 border-t border-brand-50">
                              <span className="text-brand-500 flex items-center gap-1"><FileIcon size={12}/> Anexo</span>
                              <a href={quote.fileUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-600 hover:underline truncate max-w-[120px]">{quote.fileName}</a>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-brand-50 p-3 rounded-xl mb-6">
                          <p className="text-[9px] text-brand-500 leading-relaxed italic">"{quote.aiReasoning}"</p>
                        </div>

                        <button 
                          onClick={() => handleSelectWinner(quote.id)}
                          disabled={quote.isWinner || currentUser?.role !== 'COMPRAS'}
                          className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors ${quote.isWinner ? 'bg-brand-600 text-white' : 'bg-brand-900 text-white hover:bg-brand-600'}`}
                        >
                          {quote.isWinner ? 'Selecionada' : 'Selecionar Vencedora'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'preview' && order.fileUrl && (
              <div className="w-full h-full min-h-[500px] animate-in zoom-in duration-300">
                <div className="bg-brand-100 rounded-[2rem] border border-brand-200 overflow-hidden h-full flex flex-col">
                  <div className="px-6 py-4 bg-white border-b border-brand-200 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-brand-400">{order.fileName}</span>
                    <div className="flex items-center gap-3">
                      <a href={order.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase text-brand-600 flex items-center gap-2">
                        <ExternalLink size={14}/> Nova Aba
                      </a>
                      <a href={order.fileUrl} download={order.fileName} className="text-[10px] font-black uppercase text-brand-600 flex items-center gap-2">
                        <Download size={14}/> Baixar Cópia
                      </a>
                    </div>
                  </div>
                  <div className="flex-1 bg-brand-200 relative">
                    {isPdf ? (
                      <object data={order.fileUrl} type="application/pdf" className="w-full h-full border-none">
                        <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-white">
                          <AlertCircle size={48} className="text-amber-500 mb-4" />
                          <p className="text-sm font-black text-brand-900 uppercase tracking-widest mb-2">Visualização Bloqueada pelo Browser</p>
                          <a href={order.fileUrl} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-brand-700 transition-all">
                            Abrir Documento Externamente
                          </a>
                        </div>
                      </object>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-8">
                        <img 
                          src={order.fileUrl} 
                          alt="Document Preview" 
                          className="max-w-full max-h-[70vh] shadow-2xl rounded-lg object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'market' && (
              <div className="space-y-8 animate-in fade-in">
                {isLoadingMarket ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-600" size={40}/></div> : 
                 marketData && (
                   <div className="grid grid-cols-1 gap-8">
                     <div className="bg-brand-50 p-6 sm:p-10 rounded-3xl border border-brand-100 text-brand-700 leading-relaxed font-medium">
                       {marketData.text}
                     </div>
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'logistics' && (
              <div className="space-y-8 animate-in fade-in">
                {isLoadingLocation ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-600" size={40}/></div> : 
                 locationData && (
                   <div className="bg-brand-50 p-6 sm:p-10 rounded-3xl border border-brand-100 text-brand-700 leading-relaxed font-medium">
                     {locationData.text}
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-8 animate-in slide-in-from-bottom duration-300">
                <div className="bg-brand-50 p-6 sm:p-8 rounded-3xl border border-brand-100 flex flex-col sm:flex-row gap-4">
                  <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Inserir observação técnica..." className="flex-1 bg-white border border-brand-200 rounded-2xl px-5 py-4 text-sm outline-none resize-none h-24" />
                  <button onClick={handleAddNote} disabled={isAddingNote || !newNote.trim()} className="bg-brand-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"><Send size={14}/> Enviar</button>
                </div>
                <div className="space-y-6 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-px before:bg-brand-100 pl-8">
                   {order.history?.slice().reverse().map((entry, idx) => (
                     <div key={idx} className="relative">
                        <div className="absolute -left-[25px] top-1.5 w-3 h-3 rounded-full bg-brand-500 shadow-lg shadow-brand-200" />
                        <div className="flex items-center gap-3 mb-1">
                           <StatusBadge status={entry.status} />
                           <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest">{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm font-black text-brand-900">{entry.user}</p>
                        {entry.note && <div className="mt-2 text-xs text-brand-600 bg-brand-50 p-3 rounded-xl border border-brand-100 leading-relaxed">{entry.note}</div>}
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 sm:p-10 border-t border-brand-100 flex flex-col sm:flex-row justify-end items-center gap-4 bg-white sticky bottom-0">
            {renderWorkflowActions()}
            <button onClick={onClose} className="w-full sm:w-auto px-8 py-3 bg-brand-100 text-brand-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-200">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
