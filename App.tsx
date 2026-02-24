
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Plus, Search, Trash2, Filter, TrendingUp, Package, Clock, Sparkles, 
  DollarSign, Eye, Database, Send, Loader2, ShieldCheck, CheckCheck, Box, Tags, Truck, Activity, Download, FileJson, BarChart3, Bell, BrainCircuit, X, FolderOpen, FileText, HeartPulse, ChevronDown, MapPin, Menu, ReceiptText, FileCheck2, ScrollText, FileSignature, Zap, Layers, AlertTriangle, Plug, Sheet, LogOut, User as UserIcon, ArrowRight, MessageCircle
} from 'lucide-react';
import { PurchaseOrder, OrderStatus, SystemNotification, SupplierCategory, WarehouseType, FileType, User } from './types';
import { getOrders, createOrder, deleteOrder, updateOrder, addOrderNote } from './services/mockService';
import { askAboutOrders, generateSourcingStrategy, StrategicReport } from './services/aiService';
import { getCurrentUser, logout } from './services/authService';
import { sendNotification } from './services/notificationService';
import StatusBadge from './components/StatusBadge';
import UploadModal from './components/UploadModal';
import OrderDetailsModal from './components/OrderDetailsModal';
import SuppliersView from './components/SuppliersView';
import StrategyModal from './components/StrategyModal';
import FileCenter from './components/FileCenter';
import RequestFormModal from './components/RequestFormModal';
import LoginScreen from './components/LoginScreen';
import TasyIntegrationModal from './components/TasyIntegrationModal';
import InventoryDashboard from './components/InventoryDashboard';

const WAREHOUSES: WarehouseType[] = [
  'FARMÁCIA',
  'ALMOXARIFADO CENTRAL',
  'T.I.',
  'ENGENHARIA CLÍNICA / MRO',
  'NUTRIÇÃO & DIETÉTICA'
];

type ViewType = 'dashboard' | 'suppliers' | 'files' | 'inventory-dashboard';

const CategoryChart = ({ orders }: { orders: PurchaseOrder[] }) => {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      counts[o.category] = (counts[o.category] || 0) + o.amount;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="bg-white p-6 rounded-[1.5rem] border border-brand-100 shadow-sm">
      <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-6">Spend por Categoria</h4>
      <div className="space-y-4">
        {data.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-brand-700">
              <span>{item.name}</span>
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}</span>
            </div>
            <div className="h-2 bg-brand-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-600 rounded-full" 
                style={{ width: `${(item.value / data[0].value) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SpendHistoryMini = ({ orders }: { orders: PurchaseOrder[] }) => {
  return (
    <div className="bg-white p-6 rounded-[1.5rem] border border-brand-100 shadow-sm mt-6">
      <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-4">Tendência de Gastos</h4>
      <div className="h-32 flex items-end gap-2">
        {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
          <div key={i} className="flex-1 bg-brand-100 rounded-t-lg relative group">
            <div 
              className="absolute bottom-0 left-0 right-0 bg-brand-500 rounded-t-lg transition-all group-hover:bg-brand-600"
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const FileTypeIcon = ({ type }: { type: FileType | string | undefined }) => {
  switch (type) {
    case 'PDF': return <FileText size={14} className="text-red-500" />;
    case 'IMAGE': return <FileText size={14} className="text-brand-500" />;
    case 'CSV': return <FileJson size={14} className="text-green-500" />;
    case 'INVOICE': return <ReceiptText size={14} className="text-amber-500" />;
    default: return <FileText size={14} className="text-brand-400" />;
  }
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<WarehouseType | 'TODOS'>('TODOS');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isTasyModalOpen, setIsTasyModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    return (localStorage.getItem('currentView') as ViewType) || 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
    return localStorage.getItem('isDesktopSidebarCollapsed') === 'true';
  });
  
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [strategicReport, setStrategicReport] = useState<StrategicReport | null>(null);
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    { id: '1', title: 'Nexus Alert', message: 'Vencimento próximo para Insulina em Ala C.', type: 'warning', timestamp: new Date().toISOString(), read: false },
    { id: '2', title: 'Oportunidade Estratégica', message: 'Economia de 12% detectada em novos distribuidores.', type: 'success', timestamp: new Date().toISOString(), read: false }
  ]);
  const [lastNotificationToast, setLastNotificationToast] = useState<string | null>(null);

  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Inicialização de Autenticação
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Ajusta filtro inicial se necessário, embora agora seja mais baseado em roles
      if (currentUser.role === 'COORD_ALMOXARIFADO') setWarehouseFilter('TODOS'); 
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('currentView', currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('isDesktopSidebarCollapsed', isDesktopSidebarCollapsed.toString());
  }, [isDesktopSidebarCollapsed]);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const data = await getOrders();
      setOrders(data);
    };
    fetchOrders();
  }, [user]);

  // --- FILTRAGEM RIGOROSA DE PERMISSÕES (RBAC) ---
  const filteredOrders = useMemo(() => {
    if (!user) return [];

    let permissionFiltered = orders;

    // REGRA 1: Financeiro só vê Notas Fiscais (INVOICE)
    if (user.role === 'COORD_FINANCEIRO') {
      permissionFiltered = orders.filter(o => o.fileType === 'INVOICE');
    }
    // REGRA 2: Solicitante só vê seus pedidos ou da sua área
    else if (user.role === 'SOLICITANTE') {
      permissionFiltered = orders.filter(o => {
         // Se tiver ID de requester, prioriza
         if (o.requesterId && o.requesterId === user.id) return true;
         // Se não, fallback para warehouse permitida
         return user.allowedWarehouses !== 'ALL' && user.allowedWarehouses.includes(o.warehouse);
      });
    }
    // REGRA 3: Almoxarifado/Compras/Diretoria veem SC, OC e NF
    // (Lógica implícita: se não é Financeiro nem Solicitante, vê tudo, respeitando filtro de warehouse se houver)
    else if (user.role === 'COORD_ALMOXARIFADO' && user.allowedWarehouses !== 'ALL') {
       permissionFiltered = orders.filter(o => user.allowedWarehouses.includes(o.warehouse));
    }

    // Filtros de Interface (Busca, Status, Dropdown de Setor)
    return permissionFiltered.filter(o => {
      const match = o.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm);
      const statusMatch = statusFilter === 'ALL' || o.status === statusFilter;
      const warehouseMatch = warehouseFilter === 'TODOS' || o.warehouse === warehouseFilter;
      return match && statusMatch && warehouseMatch;
    });
  }, [orders, searchTerm, statusFilter, warehouseFilter, user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const notifyUpdate = async (order: PurchaseOrder, action: string) => {
    if (!user) return;
    const count = await sendNotification(order, action, user);
    setLastNotificationToast(`Notificações enviadas via Email e WhatsApp para ${count} responsáveis.`);
    setTimeout(() => setLastNotificationToast(null), 4000);
  };

  const handleCreateOrder = async (data: any, file: File | null) => {
    if (!user) return;
    const orderData = { ...data, requesterId: user.id };
    const newOrder = await createOrder(orderData, file);
    setOrders(prev => [newOrder, ...prev]);
    
    // Notificar
    notifyUpdate(newOrder, 'Nova Requisição Criada');
  };

  const handleTasyImport = async (importedOrders: PurchaseOrder[]) => {
    if (!user) return;
    for (const order of importedOrders) {
       await createOrder({ ...order, requesterId: user.id }, null);
    }
    const updated = await getOrders();
    setOrders(updated);
    notifyUpdate(importedOrders[0], `${importedOrders.length} ordens importadas via Tasy`);
  };

  const handleUpdateOrder = async (updatedOrder: PurchaseOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    if (selectedOrder?.id === updatedOrder.id) setSelectedOrder(updatedOrder);

    // Identificar mudança de status para notificar
    const oldOrder = orders.find(o => o.id === updatedOrder.id);
    if (oldOrder && oldOrder.status !== updatedOrder.status) {
       await notifyUpdate(updatedOrder, `Status alterado para ${updatedOrder.status}`);
    }
  };

  const handleDeleteOrder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Excluir esta requisição do Nexus?')) {
      await deleteOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Fornecedor', 'Data', 'Valor', 'Status', 'Setor', 'Categoria'];
    const rows = filteredOrders.map(o => [
      o.id,
      o.supplierName,
      new Date(o.date).toLocaleDateString(),
      o.amount.toString(),
      o.status,
      o.warehouse,
      o.category
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexus_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateStrategy = async () => {
    setIsGeneratingStrategy(true);
    try {
      if (!strategicReport) {
        const report = await generateSourcingStrategy(orders);
        setStrategicReport(report);
      }
      setIsStrategyOpen(true);
    } catch (e) {
      console.error(e);
      setChatResponse("Erro ao gerar estratégia. Tente novamente.");
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleAiChat = async (query: string) => {
    if (!query.trim() || isChatLoading) return;
    setIsChatLoading(true);
    try {
      const answer = await askAboutOrders(filteredOrders, query);
      setChatResponse(answer);
    } catch (err) {
      setChatResponse("Nexus Assistant offline. Verifique sua conexão.");
    } finally {
      setIsChatLoading(false);
      setChatInput('');
    }
  };

  const stats = useMemo(() => {
    const validDateTimes = filteredOrders
      .map(o => new Date(o.date).getTime())
      .filter(t => !isNaN(t));

    const lastUpdateTime = validDateTimes.length > 0 ? Math.max(...validDateTimes) : 0;

    return {
      total: filteredOrders.reduce((acc, curr) => acc + curr.amount, 0),
      pending: filteredOrders.filter(o => o.status === OrderStatus.PENDING_ALMOXARIFADO || o.status === OrderStatus.REQUESTED).length,
      received: filteredOrders.filter(o => o.status === OrderStatus.RECEIVED).length,
      avgLeadTime: 2.1,
      lastUpdateFormatted: lastUpdateTime > 0 ? new Date(lastUpdateTime).toLocaleDateString() : 'N/A'
    };
  }, [filteredOrders]);

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Define permissões de UI baseadas no cargo
  const canCreateOrder = ['COMPRAS', 'SOLICITANTE', 'COORD_ALMOXARIFADO', 'DIRETORIA', 'GERENCIA_SUPRIMENTOS'].includes(user.role);
  const canDeleteOrder = ['COMPRAS', 'DIRETORIA', 'GERENCIA_SUPRIMENTOS'].includes(user.role);
  const canSeeDashboard = user.role !== 'SOLICITANTE'; // Solicitante talvez queira ver só lista, mas dashboard é ok
  const canSeeSuppliers = ['COMPRAS', 'DIRETORIA', 'GERENCIA_SUPRIMENTOS', 'COORD_FINANCEIRO'].includes(user.role);

  const NavigationContent = () => (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar bg-brand-900">
      <div className="p-8 flex justify-between items-center border-b border-brand-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/20">
            <Layers size={24} className="text-white animate-pulse" />
          </div>
          <div>
            <span className="block text-lg font-black tracking-tight text-white italic">SupriNexus</span>
            <span className="text-[9px] text-brand-500 uppercase font-black tracking-widest">Inteligência Logística</span>
          </div>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-brand-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="px-6 py-6 border-b border-brand-800/50">
        <div className="flex items-center gap-3 mb-4">
           {user.avatar ? (
             <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-brand-700" alt="Avatar" />
           ) : (
             <div className="w-10 h-10 bg-brand-800 rounded-full flex items-center justify-center text-brand-400"><UserIcon size={20}/></div>
           )}
           <div className="overflow-hidden">
             <p className="text-white text-xs font-bold truncate">{user.name}</p>
             <p className="text-brand-500 text-[9px] uppercase font-black truncate">{user.department}</p>
           </div>
        </div>
        <button onClick={handleLogout} className="w-full py-2 bg-brand-800 text-brand-400 hover:text-white hover:bg-red-900/50 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors">
          <LogOut size={12} /> Encerrar Sessão
        </button>
      </div>

      <nav className="flex-1 px-6 py-6 space-y-8">
        <div>
          <h3 className="text-[9px] font-black text-brand-500 uppercase tracking-widest mb-4">Visão Geral</h3>
          <ul className="space-y-2">
            <li>
              <button 
                onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-brand-400 hover:bg-white/5 hover:text-white'}`}
              >
                <LayoutDashboard size={18} />
                <span className="text-xs font-bold">Cockpit Operacional</span>
              </button>
            </li>
            <li>
               <button 
                onClick={() => { setCurrentView('files'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'files' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-brand-400 hover:bg-white/5 hover:text-white'}`}
              >
                <FolderOpen size={18} />
                <span className="text-xs font-bold">Arquivo Digital</span>
              </button>
            </li>
            <li>
               <button 
                onClick={() => { setCurrentView('inventory-dashboard'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'inventory-dashboard' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-brand-400 hover:bg-white/5 hover:text-white'}`}
              >
                <BarChart3 size={18} />
                <span className="text-xs font-bold">Dashboard Estratégico</span>
              </button>
            </li>
            {canSeeSuppliers && (
             <li>
               <button 
                onClick={() => { setCurrentView('suppliers'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'suppliers' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-brand-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Truck size={18} />
                <span className="text-xs font-bold">Fornecedores (SRM)</span>
              </button>
            </li>
            )}
          </ul>
        </div>

        {canSeeDashboard && (
          <div>
            <h3 className="text-[9px] font-black text-brand-500 uppercase tracking-widest mb-4">Métricas Globais</h3>
            <CategoryChart orders={filteredOrders} />
            <SpendHistoryMini orders={filteredOrders} />
          </div>
        )}
      </nav>
      
      {['DIRETORIA', 'GERENCIA_SUPRIMENTOS'].includes(user.role) && (
        <div className="p-6 bg-brand-950 mt-auto">
          <div className="p-4 bg-gradient-to-br from-brand-800 to-brand-900 rounded-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform" onClick={handleGenerateStrategy}>
            <div className="absolute top-0 right-0 p-3 opacity-20"><BrainCircuit size={48} className="text-white"/></div>
            <h4 className="text-white font-black text-sm mb-1 relative z-10 flex items-center gap-2">Nexus Strategy <Sparkles size={12} className="text-amber-400 animate-pulse"/></h4>
            <p className="text-brand-100 text-[10px] leading-relaxed relative z-10">
              {isGeneratingStrategy ? 'Processando dados...' : 'Gerar relatório de sourcing e savings com IA.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-brand-50 overflow-hidden font-sans">
      {/* Toast Notification */}
      {lastNotificationToast && (
        <div className="fixed top-6 right-6 z-[200] bg-brand-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right fade-in">
           <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse"><MessageCircle size={16} /></div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-brand-400">Notificação Enviada</p>
             <p className="text-xs font-bold">{lastNotificationToast}</p>
           </div>
        </div>
      )}

      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-brand-900/80 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 bg-brand-900 z-[100] transform transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${isDesktopSidebarCollapsed ? 'lg:w-[80px]' : 'lg:w-[280px] w-[280px]'} border-r border-brand-800 shadow-2xl lg:shadow-none flex flex-col`}>
        <div className="p-6 flex justify-between items-center border-b border-brand-800/50">
          <div className={`flex items-center gap-3 ${isDesktopSidebarCollapsed ? 'lg:hidden' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/20 shrink-0">
              <Layers size={24} className="text-white animate-pulse" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-lg font-black tracking-tight text-white italic truncate">SupriNexus</span>
              <span className="text-[9px] text-brand-500 uppercase font-black tracking-widest truncate block">Inteligência Logística</span>
            </div>
          </div>
          {isDesktopSidebarCollapsed && (
            <div className="hidden lg:flex w-full justify-center">
              <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/20 shrink-0">
                <Layers size={24} className="text-white" />
              </div>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-brand-400 hover:text-white transition-colors shrink-0">
            <X size={24} />
          </button>
        </div>

        <div className={`px-6 py-6 border-b border-brand-800/50 ${isDesktopSidebarCollapsed ? 'lg:px-2' : ''}`}>
          <div className={`flex items-center gap-3 mb-4 ${isDesktopSidebarCollapsed ? 'lg:justify-center' : ''}`}>
             {user.avatar ? (
               <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-brand-700 shrink-0" alt="Avatar" />
             ) : (
               <div className="w-10 h-10 bg-brand-800 rounded-full flex items-center justify-center text-brand-400 shrink-0"><UserIcon size={20}/></div>
             )}
             <div className={`overflow-hidden ${isDesktopSidebarCollapsed ? 'lg:hidden' : ''}`}>
               <p className="text-white text-xs font-bold truncate">{user.name}</p>
               <p className="text-brand-500 text-[9px] uppercase font-black truncate">{user.department}</p>
             </div>
          </div>
          <button onClick={handleLogout} className={`w-full py-2 bg-brand-800 text-brand-400 hover:text-white hover:bg-red-900/50 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors ${isDesktopSidebarCollapsed ? 'lg:px-0 lg:py-3' : ''}`} title="Encerrar Sessão">
            <LogOut size={isDesktopSidebarCollapsed ? 16 : 12} /> 
            <span className={isDesktopSidebarCollapsed ? 'lg:hidden' : ''}>Encerrar Sessão</span>
          </button>
        </div>

        <nav className={`flex-1 overflow-y-auto custom-scrollbar py-6 space-y-8 ${isDesktopSidebarCollapsed ? 'lg:px-2 px-6' : 'px-6'}`}>
          <div>
            <h3 className={`text-[9px] font-black text-brand-500 uppercase tracking-widest mb-4 ${isDesktopSidebarCollapsed ? 'lg:hidden' : ''}`}>Visão Geral</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-brand-400 hover:bg-white/5 hover:text-white'} ${isDesktopSidebarCollapsed ? 'lg:justify-center lg:p-3 p-3 px-4' : 'px-4 py-3'}`}
                  title="Cockpit Operacional"
                >
                  <LayoutDashboard size={18} className="shrink-0" />
                  <span className={`text-xs font-bold truncate ${isDesktopSidebarCollapsed ? 'lg:hidden' : ''}`}>Cockpit Operacional</span>
                </button>
              </li>
              <li>
                 <button 
                  onClick={() => { setCurrentView('files'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 rounded-xl transition-all ${currentView === 'files' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-brand-400 hover:bg-white/5 hover:text-white'} ${isDesktopSidebarCollapsed ? 'lg:justify-center lg:p-3 p-3 px-4' : 'px-4 py-3'}`}
                  title="Arquivo Digital"
                >
                  <FolderOpen size={18} className="shrink-0" />
                  <span className={`text-xs font-bold truncate ${isDesktopSidebarCollapsed ? 'lg:hidden' : ''}`}>Arquivo Digital</span>
                </button>
              </li>
              <li>
                 <button 
                  onClick={() => { setCurrentView('inventory-dashboard'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 rounded-xl transition-all ${currentView === 'inventory-dashboard' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-brand-400 hover:bg-white/5 hover:text-white'} ${isDesktopSidebarCollapsed ? 'lg:justify-center lg:p-3 p-3 px-4' : 'px-4 py-3'}`}
                  title="Dashboard Estratégico"
                >
                  <BarChart3 size={18} className="shrink-0" />
                  <span className={`text-xs font-bold truncate ${isDesktopSidebarCollapsed ? 'lg:hidden' : ''}`}>Dashboard Estratégico</span>
                </button>
              </li>
              {canSeeSuppliers && (
               <li>
                 <button 
                  onClick={() => { setCurrentView('suppliers'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 rounded-xl transition-all ${currentView === 'suppliers' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-brand-400 hover:bg-white/5 hover:text-white'} ${isDesktopSidebarCollapsed ? 'lg:justify-center lg:p-3 p-3 px-4' : 'px-4 py-3'}`}
                  title="Fornecedores (SRM)"
                >
                  <Truck size={18} className="shrink-0" />
                  <span className={`text-xs font-bold truncate ${isDesktopSidebarCollapsed ? 'lg:hidden' : ''}`}>Fornecedores (SRM)</span>
                </button>
              </li>
              )}
            </ul>
          </div>

          {canSeeDashboard && !isDesktopSidebarCollapsed && (
            <div>
              <h3 className="text-[9px] font-black text-brand-500 uppercase tracking-widest mb-4">Métricas Globais</h3>
              <CategoryChart orders={filteredOrders} />
              <SpendHistoryMini orders={filteredOrders} />
            </div>
          )}
        </nav>
        
        {['DIRETORIA', 'GERENCIA_SUPRIMENTOS'].includes(user.role) && (
          <div className={`p-6 bg-brand-950 mt-auto ${isDesktopSidebarCollapsed ? 'lg:p-2 lg:flex lg:justify-center' : ''}`}>
            <div 
              className={`bg-gradient-to-br from-brand-800 to-brand-900 rounded-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform ${isDesktopSidebarCollapsed ? 'lg:p-3 p-4' : 'p-4'}`} 
              onClick={handleGenerateStrategy}
              title="Nexus Strategy"
            >
              <div className={`absolute top-0 right-0 p-3 opacity-20 ${isDesktopSidebarCollapsed ? 'lg:hidden' : ''}`}><BrainCircuit size={48} className="text-white"/></div>
              <h4 className={`text-white font-black text-sm relative z-10 flex items-center gap-2 ${isDesktopSidebarCollapsed ? 'lg:justify-center' : 'mb-1'}`}>
                {isDesktopSidebarCollapsed ? <BrainCircuit size={20} className="text-white lg:hidden" /> : null}
                <span className={isDesktopSidebarCollapsed ? 'lg:hidden' : ''}>Nexus Strategy</span>
                <Sparkles size={isDesktopSidebarCollapsed ? 16 : 12} className="text-amber-400 animate-pulse shrink-0"/>
              </h4>
              <p className={`text-brand-100 text-[10px] leading-relaxed relative z-10 ${isDesktopSidebarCollapsed ? 'lg:hidden' : ''}`}>
                {isGeneratingStrategy ? 'Processando dados...' : 'Gerar relatório de sourcing e savings com IA.'}
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-brand-200/60 flex items-center justify-between px-6 sm:px-8 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-brand-600 hover:bg-brand-100 rounded-lg">
              <Menu size={24} />
            </button>
            <button 
              onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)} 
              className="hidden lg:flex p-2 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors"
              title={isDesktopSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-brand-900 tracking-tight hidden sm:block">
                {currentView === 'dashboard' ? 'Cockpit Operacional' : currentView === 'suppliers' ? 'Gestão de Fornecedores' : currentView === 'inventory-dashboard' ? 'Dashboard Estratégico' : 'Arquivo Digital'}
              </h2>
              {/* Show role badge in header for clarity */}
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                user.role === 'COMPRAS' ? 'bg-purple-100 text-purple-700' :
                user.role === 'COORD_FINANCEIRO' ? 'bg-brand-100 text-brand-700' :
                'bg-brand-100 text-brand-700'
              }`}>
                {user.role.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="relative hidden md:block group">
               <button className="p-2.5 text-brand-400 hover:bg-brand-100 rounded-xl transition-all relative" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                 <Bell size={20} />
                 {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
               </button>
               {/* Dropdown Notificações */}
               {isNotificationsOpen && (
                 <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-brand-100 p-2 animate-in slide-in-from-top-2 z-50">
                    <div className="px-4 py-3 border-b border-brand-50 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-brand-400">Notificações</span>
                      <button className="text-[10px] text-brand-600 font-bold hover:underline">Marcar lidas</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className="p-3 hover:bg-brand-50 rounded-xl transition-colors cursor-pointer flex gap-3">
                           <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.type === 'warning' ? 'bg-amber-500' : 'bg-brand-500'}`} />
                           <div>
                             <p className="text-xs font-bold text-brand-900">{n.title}</p>
                             <p className="text-[10px] text-brand-500 leading-snug">{n.message}</p>
                             <span className="text-[9px] text-brand-400 mt-1 block">{new Date(n.timestamp).toLocaleTimeString()}</span>
                           </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
            </div>
            
            <div className="h-8 w-px bg-brand-200 hidden sm:block"></div>
            
            {['DIRETORIA', 'GERENCIA_SUPRIMENTOS', 'COMPRAS'].includes(user.role) && (
              <button 
                onClick={() => setIsTasyModalOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-[#005F9E]/10 text-[#005F9E] hover:bg-[#005F9E] hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <Plug size={16} /> Conector Tasy
              </button>
            )}

            {canCreateOrder && (
              <button 
                onClick={() => user.role === 'SOLICITANTE' ? setIsRequestModalOpen(true) : setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-brand-900 text-white rounded-xl sm:rounded-2xl hover:bg-brand-600 transition-all shadow-lg shadow-brand-900/20 active:scale-95 group"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">
                  {user.role === 'SOLICITANTE' ? 'Nova Solicitação' : 'Nova Requisição / Upload'}
                </span>
                <span className="text-xs font-black uppercase tracking-widest sm:hidden">Novo</span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto bg-brand-50 p-4 sm:p-8 custom-scrollbar">
          {currentView === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* KPIs - Hidden for Requester for cleaner view */}
              {user.role !== 'SOLICITANTE' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Volume Total', val: `R$ ${(stats.total / 1000).toFixed(1)}k`, icon: DollarSign, color: 'text-brand-500', trend: '+12%' },
                    { label: 'Em Auditoria', val: stats.pending, icon: Activity, color: 'text-amber-500', trend: '4 pendentes' },
                    { label: 'Recebidos', val: stats.received, icon: CheckCheck, color: 'text-brand-500', trend: 'Últimos 30 dias' },
                    { label: 'Lead Time', val: `${stats.avgLeadTime} dias`, icon: Clock, color: 'text-purple-500', trend: '-0.4 dias' },
                  ].map((kpi, i) => (
                    <div key={i} className="bg-white p-5 rounded-[1.5rem] border border-brand-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl bg-brand-50 ${kpi.color}`}>{<kpi.icon size={20} />}</div>
                        {i === 0 && <span className="text-[9px] font-black text-brand-600 bg-brand-50 px-2 py-1 rounded-full">{kpi.trend}</span>}
                      </div>
                      <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                      <p className="text-2xl font-black text-brand-900 tracking-tight">{kpi.val}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Filters & Actions */}
              <div className="flex flex-col xl:flex-row gap-4 justify-between items-end xl:items-center bg-white p-4 rounded-[1.5rem] border border-brand-100 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                  <div className="relative flex-1 sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar por ID, fornecedor..." 
                      className="w-full pl-12 pr-4 py-3 bg-brand-50 border border-brand-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/10"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                    <div className="relative group">
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="appearance-none pl-4 pr-10 py-3 bg-brand-50 border border-brand-100 rounded-xl text-xs font-black uppercase tracking-widest text-brand-600 outline-none cursor-pointer hover:bg-brand-100 min-w-[140px]"
                      >
                        <option value="ALL">Status: Todos</option>
                        {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" size={14} />
                    </div>

                    {/* Filter only visible to roles who can see multiple warehouses */}
                    {(['DIRETORIA', 'GERENCIA_SUPRIMENTOS', 'COMPRAS', 'COORD_FINANCEIRO'].includes(user.role)) && (
                      <div className="relative group">
                        <select 
                          value={warehouseFilter}
                          onChange={(e) => setWarehouseFilter(e.target.value as any)}
                          className="appearance-none pl-4 pr-10 py-3 bg-brand-50 border border-brand-100 rounded-xl text-xs font-black uppercase tracking-widest text-brand-600 outline-none cursor-pointer hover:bg-brand-100 min-w-[140px]"
                        >
                          <option value="TODOS">Setor: Todos</option>
                          {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                         <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" size={14} />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                   <button onClick={handleExportCSV} className="p-3 text-brand-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" title="Exportar CSV">
                      <FileJson size={20} />
                   </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-[2rem] border border-brand-200 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-brand-50 border-b border-brand-200">
                      <tr>
                        <th className="px-6 py-5 text-[10px] font-black text-brand-400 uppercase tracking-widest">Documento</th>
                        <th className="px-6 py-5 text-[10px] font-black text-brand-400 uppercase tracking-widest">Fornecedor</th>
                        <th className="px-6 py-5 text-[10px] font-black text-brand-400 uppercase tracking-widest">Setor / Data</th>
                        <th className="px-6 py-5 text-[10px] font-black text-brand-400 uppercase tracking-widest">Valor</th>
                        <th className="px-6 py-5 text-[10px] font-black text-brand-400 uppercase tracking-widest text-center">Status</th>
                        <th className="px-6 py-5 text-[10px] font-black text-brand-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-100">
                      {filteredOrders.length === 0 ? (
                         <tr>
                           <td colSpan={6} className="px-6 py-12 text-center text-brand-400">
                             <div className="flex flex-col items-center gap-3">
                               <Package size={48} className="text-brand-200" />
                               <p className="text-xs font-bold uppercase">Nenhuma ordem encontrada neste contexto.</p>
                             </div>
                           </td>
                         </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr key={order.id} onClick={() => setSelectedOrder(order)} className="group hover:bg-brand-50/30 transition-colors cursor-pointer">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-brand-100 text-brand-500 rounded-xl group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                                  {order.origin === 'ERP_TASY' ? <Database size={20} /> : <FileText size={20} />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-black text-sm text-brand-900">{order.id}</span>
                                    {order.origin === 'ERP_TASY' && <span className="bg-[#005F9E] text-white text-[8px] font-black px-1.5 rounded">TASY</span>}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-brand-500 font-medium">
                                     <FileTypeIcon type={order.fileType} />
                                     <span className="truncate max-w-[150px]">{order.fileName || 'Sem anexo'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <p className="font-bold text-sm text-brand-900 mb-1">{order.supplierName}</p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-brand-100 text-brand-500 border border-brand-200">
                                {order.category}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-brand-700">{order.warehouse}</span>
                                <span className="text-[10px] font-medium text-brand-400 flex items-center gap-1">
                                  <Clock size={10} /> {new Date(order.date).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <p className="font-black text-sm text-brand-900">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.amount)}
                              </p>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <StatusBadge status={order.status} />
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }} className="p-2 hover:bg-brand-200 rounded-lg text-brand-500 hover:text-brand-600 transition-colors">
                                  <Eye size={18} />
                                </button>
                                {canDeleteOrder && (
                                  <button onClick={(e) => handleDeleteOrder(order.id, e)} className="p-2 hover:bg-red-50 rounded-lg text-brand-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentView === 'suppliers' && <SuppliersView orders={filteredOrders} />}
          {currentView === 'files' && <FileCenter orders={filteredOrders} />}
          {currentView === 'inventory-dashboard' && <InventoryDashboard />}
        </div>

        {/* AI Chat Widget */}
        <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
           {chatResponse && (
             <div className="mb-4 bg-white p-6 rounded-t-[1.5rem] rounded-bl-[1.5rem] shadow-2xl border border-brand-100 max-w-sm animate-in slide-in-from-bottom-5 pointer-events-auto">
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2 text-brand-600">
                      <Sparkles size={16} /> <span className="text-xs font-black uppercase tracking-widest">Nexus AI</span>
                   </div>
                   <button onClick={() => setChatResponse(null)} className="text-brand-400 hover:text-brand-600"><X size={14}/></button>
                </div>
                <p className="text-sm text-brand-700 leading-relaxed font-medium">{chatResponse}</p>
             </div>
           )}
           
           <div className="bg-brand-900 p-2 rounded-[2rem] shadow-2xl flex items-center gap-2 pointer-events-auto w-full max-w-[320px] sm:max-w-md transition-all hover:ring-4 hover:ring-brand-200">
              <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-brand-500 rounded-full flex items-center justify-center shrink-0">
                 {isChatLoading ? <Loader2 size={20} className="text-white animate-spin" /> : <Sparkles size={20} className="text-white" />}
              </div>
              <input 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiChat(chatInput)}
                placeholder="Pergunte ao Nexus sobre as ordens..."
                className="bg-transparent border-none text-white text-sm font-medium placeholder-brand-400 focus:ring-0 w-full"
              />
              <button 
                onClick={() => handleAiChat(chatInput)}
                disabled={!chatInput.trim() || isChatLoading}
                className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 disabled:opacity-50 transition-colors"
              >
                <ArrowRight size={16} />
              </button>
           </div>
        </div>

      </main>

      {/* Modals */}
      <UploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateOrder} 
      />
      
      <RequestFormModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        currentUser={user}
        onSuccess={async () => {
          const data = await getOrders();
          setOrders(data);
          notifyUpdate({} as any, 'Nova solicitação criada com sucesso');
        }}
      />
      
      <OrderDetailsModal 
        order={selectedOrder} 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        onUpdate={handleUpdateOrder}
        currentUser={user}
      />

      <StrategyModal
        report={strategicReport}
        isOpen={isStrategyOpen}
        onClose={() => setIsStrategyOpen(false)}
      />

      <TasyIntegrationModal
        isOpen={isTasyModalOpen}
        onClose={() => setIsTasyModalOpen(false)}
        onImport={handleTasyImport}
      />
    </div>
  );
}

export default App;
