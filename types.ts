
export enum OrderStatus {
  REQUESTED = 'REQUISITADO', // Solicitante criou
  PENDING_ALMOXARIFADO = 'AGUARDANDO SC', // Enviado para Almoxarifado
  SC_CREATED = 'SC GERADA', // Almoxarifado gerou SC
  QUOTATION_PROCESS = 'EM COTAÇÃO', // Compras cotando
  WAITING_HQ_APPROVAL = 'AGUARDANDO APROVAÇÃO SEDE', // Enviado para SP
  APPROVED = 'APROVADO', // Sede aprovou
  PURCHASING = 'EM COMPRA', // Comprador gerando Pedido
  AWAITING_DELIVERY = 'AGUARDANDO ENTREGA', // Pedido feito
  RECEIVED = 'RECEBIDO', // Almoxarifado recebeu (NF)
  AVAILABLE_FOR_PICKUP = 'DISPONÍVEL PARA RETIRADA', // Solicitante pode buscar
  COMPLETED = 'CONCLUÍDO', // Retirado
  REJECTED = 'CANCELADO' // Cancelado em qualquer etapa
}

export type WarehouseType = 
  | 'FARMÁCIA' 
  | 'ALMOXARIFADO CENTRAL' 
  | 'T.I.' 
  | 'ENGENHARIA CLÍNICA / MRO'
  | 'NUTRIÇÃO & DIETÉTICA';

export type SupplierCategory = 
  | 'MEDICAMENTOS' 
  | 'MATERIAIS MÉDICOS' 
  | 'OPME (ÓRTESES/PRÓTESES)' 
  | 'LABORATÓRIO' 
  | 'GASES MEDICINAIS' 
  | 'HIGIENE & LIMPEZA'
  | 'ESCRITÓRIO & PAPELARIA'
  | 'HARDWARE & SOFTWARE'
  | 'MANUTENÇÃO (MRO)'
  | 'NUTRIÇÃO';

export type FileType = 'INVOICE' | 'PURCHASE_ORDER' | 'QUOTATION' | 'CONTRACT' | 'OTHER';
export type OrderOrigin = 'NEXUS_UPLOAD' | 'ERP_TASY' | 'BIONEXO' | 'MANUAL_REQUEST';

// --- NOVOS TIPOS DE AUTENTICAÇÃO (ATUALIZADO) ---
export type UserRole = 
  | 'DIRETORIA'                    // Acesso Total
  | 'GERENCIA_SUPRIMENTOS'         // Acesso Total
  | 'COMPRAS'                      // NF, SC, OC
  | 'COORD_ALMOXARIFADO'           // NF, SC, OC
  | 'COORD_FINANCEIRO'             // Apenas NF
  | 'SOLICITANTE';                 // Apenas SC (e acompanhamento de entrega)

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone?: string; // Para notificações Whatsapp
  avatar?: string;
  allowedWarehouses: WarehouseType[] | 'ALL';
}
// -----------------------------------

export interface OrderHistory {
  status: OrderStatus;
  timestamp: string;
  user: string;
  note?: string;
}

export interface OrderItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku?: string;
  lotNumber?: string;
  expiryDate?: string;
  anvisaReg?: string;
  isThermolabile?: boolean;
  isStandardized?: boolean; // Item padronizado
}

export interface OrderStamp {
  type: 'FISCAL' | 'DIGITAL_SIGNATURE' | 'APPROVAL' | 'SECURITY' | 'QUALITY' | 'SANITARY';
  label: string;
  issuer?: string;
  confidence?: number;
}

export interface Quotation {
  id: string;
  supplierName: string;
  price: number;
  deliveryTimeDays: number;
  paymentTerms: string;
  isWinner: boolean;
  aiScore: number; // 0-100
  aiReasoning: string;
  fileUrl?: string;
  fileName?: string;
}

export interface PurchaseOrder {
  id: string;
  erpId?: string;       // ID Original no Tasy (ex: OC-99881)
  scNumber?: string;    // Número da Solicitação de Compra (Protheus)
  origin?: OrderOrigin; // Origem do dado
  docRef?: string;
  supplierName: string; // Pode ser vazio inicialmente
  supplierTaxId?: string;
  category: SupplierCategory;
  warehouse: WarehouseType;
  description: string;
  amount: number;
  date: string;
  status: OrderStatus;
  items?: OrderItem[];
  stamps?: OrderStamp[];
  notes?: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: FileType;
  history?: OrderHistory[];
  requesterId?: string; // ID do usuário que solicitou
  
  // Campos do Formulário de Solicitação
  requesterName?: string;
  requesterRole?: string;
  destinationLocation?: string;
  urgencyLevel?: 1 | 2 | 3;
  justification?: string;
  costCenter?: string;

  // Cotações
  quotations?: Quotation[];
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface VendorPerformance {
  score: number;
  costEfficiency: number;
  reliability: number;
  compliance: number;
  aiAnalysis: string;
}
