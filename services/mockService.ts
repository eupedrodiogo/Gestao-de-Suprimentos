
import { PurchaseOrder, OrderStatus, OrderHistory } from '../types';

// PDF Base64 mínimo válido para simulação de arquivos gerados pelo sistema
const MOCK_PDF_BASE64 = "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSC4gIC9SZXNvdXJjZXMgPDwKICAgIC9Gb250IDw8CiAgICAgIC9GMQo1IDAgUgoKICAgID4+CiAgPj4KICAvQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqCjw8CiAgL0xlbmd0aCAxMDAKPj4Kc3RyZWFtCkJUCi9GMSAyNCBUZgoxMDAgNzAwIFRkCihEb2N1bWVudG8gR2VyYWRvIGF1dG9tYXRpY2FtZW50ZSBwZWxvIFN1cHJpTmV4dXMpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCjUgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDE1NyAwMDAwMCBuIAowMDAwMDAwMjY1IDAwMDAwIG4gCjAwMDAwMDA0MjAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNTIzCiUlRU9GCg==";

const INITIAL_DATA: PurchaseOrder[] = [
  // 1. Cenário Farmácia - Recebido (NF Disponível)
  {
    id: 'NF-2024-1001',
    erpId: 'OC-102030',
    origin: 'NEXUS_UPLOAD',
    supplierName: 'Pharma Distribuidora S.A',
    category: 'MEDICAMENTOS',
    warehouse: 'FARMÁCIA',
    description: 'Reposição de Antibióticos e Analgésicos - Pronto Socorro',
    amount: 12450.00,
    date: new Date('2024-05-20').toISOString(),
    status: OrderStatus.RECEIVED,
    fileName: 'nota_fiscal_pharma_001.pdf',
    fileUrl: MOCK_PDF_BASE64,
    fileType: 'INVOICE',
    items: [
      { sku: 'AMX-500', description: 'Amoxicilina 500mg', quantity: 1000, unitPrice: 8.50, totalPrice: 8500, lotNumber: 'LT9921', expiryDate: '2025-12-01', anvisaReg: '1.0001.0002' },
      { sku: 'DIP-1G', description: 'Dipirona Sódica 1g', quantity: 3950, unitPrice: 1.00, totalPrice: 3950, lotNumber: 'LT9940', expiryDate: '2026-01-15', anvisaReg: '1.0020.0440' }
    ],
    stamps: [
      { type: 'FISCAL', label: 'NF-e Válida', issuer: 'SEFAZ', confidence: 1.0 },
      { type: 'QUALITY', label: 'Lote Aprovado', issuer: 'Farmácia Clínica', confidence: 0.98 }
    ],
    history: [
      { status: OrderStatus.REQUESTED, timestamp: new Date('2024-05-18T10:00:00').toISOString(), user: 'Dr. Santos (Farmácia)' },
      { status: OrderStatus.APPROVED, timestamp: new Date('2024-05-18T16:00:00').toISOString(), user: 'Diretoria Clínica' },
      { status: OrderStatus.RECEIVED, timestamp: new Date('2024-05-20T08:30:00').toISOString(), user: 'Almoxarifado Central' }
    ]
  },
  // 2. Cenário TI - Em Auditoria (Cotação de Alto Valor)
  {
    id: 'OC-2024-8821',
    origin: 'BIONEXO',
    supplierName: 'Dell Computadores do Brasil',
    category: 'HARDWARE & SOFTWARE',
    warehouse: 'T.I.',
    description: 'Renovação Parque Tecnológico - Notebooks Latitude',
    amount: 145000.00,
    date: new Date('2024-06-01').toISOString(),
    status: OrderStatus.PENDING_ALMOXARIFADO,
    fileName: 'proposta_dell_q3.pdf',
    fileUrl: MOCK_PDF_BASE64,
    fileType: 'QUOTATION',
    items: [
      { sku: 'DELL-LAT-5420', description: 'Notebook Latitude 5420 i7 16GB', quantity: 20, unitPrice: 7250.00, totalPrice: 145000.00 }
    ],
    history: [
      { status: OrderStatus.REQUESTED, timestamp: new Date('2024-06-01T09:00:00').toISOString(), user: 'Gerente TI' },
      { status: OrderStatus.PENDING_ALMOXARIFADO, timestamp: new Date('2024-06-01T09:05:00').toISOString(), user: 'Bionexo Integration', note: 'Aguardando aprovação CAPEX diretoria.' }
    ]
  },
  // 3. Cenário Nutrição - Aprovado (Integração Tasy)
  {
    id: 'TASY-2024-5501',
    erpId: 'OC-99100',
    origin: 'ERP_TASY',
    supplierName: 'Danone Nutricia',
    category: 'NUTRIÇÃO',
    warehouse: 'NUTRIÇÃO & DIETÉTICA',
    description: 'Dietas Enterais Terapia Intensiva',
    amount: 8200.50,
    date: new Date('2024-06-02').toISOString(),
    status: OrderStatus.APPROVED,
    fileName: 'oc_tasy_99100.pdf',
    fileUrl: MOCK_PDF_BASE64,
    fileType: 'PURCHASE_ORDER',
    items: [
      { sku: 'NUT-001', description: 'Nutrison Energy 1.5 1L', quantity: 200, unitPrice: 41.00, totalPrice: 8200.00 }
    ],
    stamps: [
      { type: 'APPROVAL', label: 'Aprovado Tasy', issuer: 'Sistema ERP', confidence: 1.0 }
    ],
    history: [
      { status: OrderStatus.REQUESTED, timestamp: new Date('2024-06-02T08:00:00').toISOString(), user: 'Nutricionista Chefe' },
      { status: OrderStatus.APPROVED, timestamp: new Date('2024-06-02T14:00:00').toISOString(), user: 'Gerência Suprimentos' }
    ]
  },
  // 4. Cenário Engenharia Clínica - Em Trânsito (Peças Críticas)
  {
    id: 'OC-2024-3312',
    origin: 'NEXUS_UPLOAD',
    supplierName: 'GE Healthcare',
    category: 'MANUTENÇÃO (MRO)',
    warehouse: 'ENGENHARIA CLÍNICA / MRO',
    description: 'Peça de Reposição - Tubo Raio-X Tomógrafo',
    amount: 85000.00,
    date: new Date('2024-05-28').toISOString(),
    status: OrderStatus.AWAITING_DELIVERY,
    fileName: 'invoice_ge_parts.pdf',
    fileUrl: MOCK_PDF_BASE64,
    fileType: 'INVOICE',
    items: [
       { sku: 'GE-TUBE-RX', description: 'X-Ray Tube Assembly Optima', quantity: 1, unitPrice: 85000.00, totalPrice: 85000.00 }
    ],
    history: [
      { status: OrderStatus.REQUESTED, timestamp: new Date('2024-05-25').toISOString(), user: 'Eng. Chefe' },
      { status: OrderStatus.APPROVED, timestamp: new Date('2024-05-26').toISOString(), user: 'Diretoria' },
      { status: OrderStatus.AWAITING_DELIVERY, timestamp: new Date('2024-05-29').toISOString(), user: 'GE Logistics' }
    ]
  },
  // 5. Cenário Almoxarifado Central - Requisitado (Material de Escritório)
  {
    id: 'REQ-2024-0055',
    origin: 'NEXUS_UPLOAD',
    supplierName: 'Kalunga Comércio',
    category: 'ESCRITÓRIO & PAPELARIA',
    warehouse: 'ALMOXARIFADO CENTRAL',
    description: 'Material de Expediente - Papel A4 e Toners',
    amount: 2350.90,
    date: new Date('2024-06-03').toISOString(),
    status: OrderStatus.REQUESTED,
    fileName: 'pedido_kalunga.pdf',
    fileUrl: MOCK_PDF_BASE64,
    fileType: 'QUOTATION',
    items: [
       { sku: 'PAP-A4', description: 'Papel Sulfite A4 cx 10 resmas', quantity: 50, unitPrice: 280.00, totalPrice: 1400.00 },
       { sku: 'TON-HP', description: 'Toner HP 85A Compatível', quantity: 10, unitPrice: 95.09, totalPrice: 950.90 }
    ],
    history: [
      { status: OrderStatus.REQUESTED, timestamp: new Date('2024-06-03T11:00:00').toISOString(), user: 'Assistente Adm.' }
    ]
  },
  // 6. Cenário OPME - Rejeitado (Erro de Cotação)
  {
    id: 'OC-2024-9999',
    origin: 'BIONEXO',
    supplierName: 'OrthoImplant Ltda',
    category: 'OPME (ÓRTESES/PRÓTESES)',
    warehouse: 'ALMOXARIFADO CENTRAL',
    description: 'Prótese de Quadril Cerâmica',
    amount: 18000.00,
    date: new Date('2024-05-15').toISOString(),
    status: OrderStatus.REJECTED,
    fileName: 'cotacao_errada.pdf',
    fileUrl: MOCK_PDF_BASE64,
    fileType: 'QUOTATION',
    items: [],
    history: [
      { status: OrderStatus.REQUESTED, timestamp: new Date('2024-05-15').toISOString(), user: 'Centro Cirúrgico' },
      { status: OrderStatus.REJECTED, timestamp: new Date('2024-05-16').toISOString(), user: 'Auditoria Médica', note: 'Rejeitado: Valor acima da tabela SIMPRO permitida.' }
    ]
  },
  // 7. Cenário Gases - Recebido (Contrato Recorrente)
  {
    id: 'NF-2024-OX-02',
    erpId: 'CTR-002',
    origin: 'NEXUS_UPLOAD',
    supplierName: 'White Martins',
    category: 'GASES MEDICINAIS',
    warehouse: 'FARMÁCIA', // Gases geralmente geridos pela farmácia ou eng. clínica
    description: 'Recarga Tanque O2 Líquido',
    amount: 15400.00,
    date: new Date('2024-06-02').toISOString(),
    status: OrderStatus.RECEIVED,
    fileName: 'nf_white_martins.pdf',
    fileUrl: MOCK_PDF_BASE64,
    fileType: 'INVOICE',
    items: [
      { sku: 'O2-LIQ', description: 'Oxigênio Líquido Medicinal m3', quantity: 1500, unitPrice: 10.26, totalPrice: 15400.00 }
    ],
    history: [
      { status: OrderStatus.RECEIVED, timestamp: new Date('2024-06-02T06:00:00').toISOString(), user: 'Portaria / Recebimento' }
    ]
  },
  // 8. Cenário Solicitação Manual - Aguardando SC (Fluxo Novo)
  {
    id: 'REQ-MANUAL-001',
    origin: 'MANUAL_REQUEST',
    supplierName: 'A DEFINIR',
    category: 'MANUTENÇÃO (MRO)',
    warehouse: 'ENGENHARIA CLÍNICA / MRO',
    description: 'Compressor Scroll 7,5TR Modelo YH175-A7',
    amount: 0,
    date: new Date().toISOString(),
    status: OrderStatus.PENDING_ALMOXARIFADO,
    requesterName: 'Diógenes',
    requesterRole: 'Supervisor J3',
    costCenter: 'Engenharia Predial',
    destinationLocation: 'CTI C',
    urgencyLevel: 2,
    justification: 'Compressor do CTI C em curto, capacidade em 50%.',
    items: [
      { description: 'COMPRESSOR SCROLL 7,5TR MODELO YH175-A7- 210 MARCA:INVOTECH GÁS R22', quantity: 1, unitPrice: 0, totalPrice: 0, isStandardized: false },
      { description: 'BOTIJA DE GÁS R22 13KG', quantity: 1, unitPrice: 0, totalPrice: 0, isStandardized: true },
      { description: 'CONJUNTO DE OXI ACETILENO (PPU)', quantity: 1, unitPrice: 0, totalPrice: 0, isStandardized: false },
      { description: 'VARETA DE SOLDA FOSCOPER', quantity: 10, unitPrice: 0, totalPrice: 0, isStandardized: true }
    ],
    history: [
      { status: OrderStatus.REQUESTED, timestamp: new Date().toISOString(), user: 'Diógenes (Engenharia)' }
    ]
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Limite de segurança: se o arquivo for > 2MB, não tenta converter para evitar travar a UI
    if (file.size > 2 * 1024 * 1024) {
      console.warn("Arquivo muito grande para preview local. Usando mock.");
      resolve(MOCK_PDF_BASE64);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const getOrders = async (): Promise<PurchaseOrder[]> => {
  await delay(600);
  try {
    const stored = localStorage.getItem('purchase_orders');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Mescla os iniciais se o localStorage estiver vazio ou com poucos dados (reset manual)
      if (parsed.length < 2) return INITIAL_DATA;
      return parsed;
    }
  } catch (e) {
    console.error("Erro ao ler localStorage", e);
    return INITIAL_DATA;
  }
  // Se não houver nada no storage, retorna o mock expandido e salva
  localStorage.setItem('purchase_orders', JSON.stringify(INITIAL_DATA));
  return INITIAL_DATA;
};

// Simula a consulta ao ERP Tasy com geração de arquivo virtual
export const fetchTasyQueue = async (): Promise<PurchaseOrder[]> => {
  await delay(2000); 
  return [
    {
      id: 'TEMP-TASY-01',
      erpId: 'OC-99210',
      origin: 'ERP_TASY',
      supplierName: 'Cirúrgica Brasil Ltda',
      category: 'MATERIAIS MÉDICOS',
      warehouse: 'ALMOXARIFADO CENTRAL',
      description: 'Kit Cirúrgico Estéril - Demanda Bloco C',
      amount: 45200.00,
      date: new Date().toISOString(),
      status: OrderStatus.REQUESTED,
      fileType: 'PURCHASE_ORDER',
      fileName: 'OC-99210_TASY_GENERATED.pdf', // Nome do arquivo virtual
      fileUrl: MOCK_PDF_BASE64, // Conteúdo do arquivo virtual
      items: [
         { sku: 'KIT-CIR-01', description: 'Kit Cirúrgico Universal Estéril', quantity: 200, unitPrice: 226.00, totalPrice: 45200.00 }
      ],
      history: [{ status: OrderStatus.REQUESTED, timestamp: new Date().toISOString(), user: 'Integração Tasy (Automático)' }]
    },
    {
      id: 'TEMP-TASY-02',
      erpId: 'OC-99211',
      origin: 'ERP_TASY',
      supplierName: 'Cremer S.A.',
      category: 'MATERIAIS MÉDICOS',
      warehouse: 'ALMOXARIFADO CENTRAL',
      description: 'Compressas de Gaze Algodonada',
      amount: 5600.00,
      date: new Date().toISOString(),
      status: OrderStatus.REQUESTED,
      fileType: 'PURCHASE_ORDER',
      fileName: 'OC-99211_TASY_GENERATED.pdf',
      fileUrl: MOCK_PDF_BASE64,
      items: [
         { sku: 'GAZE-ALG', description: 'Gaze Algodonada Estéril pct 10un', quantity: 1000, unitPrice: 5.60, totalPrice: 5600.00 }
      ],
      history: [{ status: OrderStatus.REQUESTED, timestamp: new Date().toISOString(), user: 'Integração Tasy (Automático)' }]
    },
    {
      id: 'TEMP-TASY-03',
      erpId: 'OC-99215',
      origin: 'ERP_TASY',
      supplierName: 'Eurofarma Laboratórios',
      category: 'MEDICAMENTOS',
      warehouse: 'FARMÁCIA',
      description: 'Omeprazol Sódico 40mg Inj.',
      amount: 12300.00,
      date: new Date().toISOString(),
      status: OrderStatus.REQUESTED,
      fileType: 'PURCHASE_ORDER',
      fileName: 'OC-99215_TASY_GENERATED.pdf',
      fileUrl: MOCK_PDF_BASE64,
      items: [
         { sku: 'OME-40', description: 'Omeprazol 40mg Frasco-Ampola', quantity: 2000, unitPrice: 6.15, totalPrice: 12300.00 }
      ],
      history: [{ status: OrderStatus.REQUESTED, timestamp: new Date().toISOString(), user: 'Integração Tasy (Automático)' }]
    }
  ];
};

export const createOrder = async (order: any, file: File | null): Promise<PurchaseOrder> => {
  await delay(800); 
  
  let fileUrl = order.fileUrl || ''; 
  let fileName = order.fileName || '';
  
  if (file) {
    try {
      fileUrl = await fileToBase64(file);
      fileName = file.name;
    } catch (e) {
      console.warn("Falha ao converter arquivo, usando mock.", e);
      fileUrl = MOCK_PDF_BASE64;
    }
  }

  // Se não tem arquivo e não veio do Tasy com URL mockada, tenta gerar um mock se for teste
  if (!fileUrl && order.origin === 'ERP_TASY') {
      fileUrl = MOCK_PDF_BASE64;
      fileName = `TASY_DOC_${new Date().getTime()}.pdf`;
  }

  // Sanitização de data
  let finalDate = order.date;
  try {
    const d = new Date(order.date);
    if (isNaN(d.getTime())) throw new Error();
    finalDate = d.toISOString();
  } catch {
    finalDate = new Date().toISOString();
  }

  let initialStatus = OrderStatus.PENDING_ALMOXARIFADO; // Default para MANUAL_REQUEST
  if (order.fileType === 'INVOICE') initialStatus = OrderStatus.RECEIVED;
  else if (order.origin === 'ERP_TASY') initialStatus = OrderStatus.REQUESTED;
  else if (order.origin === 'NEXUS_UPLOAD') initialStatus = OrderStatus.PENDING_ALMOXARIFADO; // Ajuste conforme necessidade
  
  // Se for manual request, status inicial é PENDING_ALMOXARIFADO (ou REQUESTED, mas vamos seguir o fluxo)
  if (order.origin === 'MANUAL_REQUEST') {
      initialStatus = OrderStatus.PENDING_ALMOXARIFADO;
  }
  
  const prefix = order.origin === 'ERP_TASY' ? 'TASY' : (order.origin === 'MANUAL_REQUEST' ? 'REQ' : (order.fileType === 'INVOICE' ? 'NF' : 'OC'));
  
  const newOrder: PurchaseOrder = {
    ...order,
    id: order.id && !order.id.startsWith('TEMP') ? order.id : `${prefix}-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    status: initialStatus,
    date: finalDate,
    fileUrl,
    fileName,
    history: [{ 
      status: initialStatus, 
      timestamp: new Date().toISOString(), 
      user: order.requesterName || (order.origin === 'ERP_TASY' ? 'Nexus Connector Tasy' : 'Nexus Auto-Ingest'),
      note: order.origin === 'MANUAL_REQUEST' 
        ? 'Solicitação de compra criada manualmente.' 
        : (order.origin === 'ERP_TASY' 
          ? `Ordem importada do Tasy (ID Original: ${order.erpId}). Arquivo digital gerado automaticamente.`
          : (order.fileType === 'INVOICE' 
              ? `Lançamento automático de Nota Fiscal realizado com sucesso no setor ${order.warehouse}. Estoque atualizado.`
              : `Ordem de Compra registrada e encaminhada para auditoria técnica no setor ${order.warehouse}.`))
    }]
  };
  
  const current = await getOrders();
  
  // Tenta salvar. Se estourar a cota (arquivo mto grande), salva sem o arquivo pesado (usa o mock)
  try {
    localStorage.setItem('purchase_orders', JSON.stringify([newOrder, ...current]));
  } catch (e) {
    console.warn("Quota Exceeded! Salvando versão leve da ordem.");
    // Fallback: Substitui o conteúdo pesado pelo mock leve para garantir que a ordem seja salva
    newOrder.fileUrl = MOCK_PDF_BASE64;
    newOrder.notes = (newOrder.notes || "") + "\n[Sistema: Arquivo original muito grande para armazenamento local. Visualização mock ativada.]";
    
    // Tenta salvar novamente com o arquivo leve. Se falhar, tenta limpar ordens antigas
    try {
      localStorage.setItem('purchase_orders', JSON.stringify([newOrder, ...current]));
    } catch (e2) {
      console.error("Armazenamento crítico. Limpando histórico antigo.");
      // Último recurso: mantém apenas as 50 últimas ordens
      localStorage.setItem('purchase_orders', JSON.stringify([newOrder, ...current.slice(0, 50)]));
    }
  }
  
  return newOrder;
};

export const updateOrder = async (id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | null> => {
  const current = await getOrders();
  let updatedOrder: PurchaseOrder | null = null;
  const updatedData = current.map(o => {
    if (o.id === id) {
      const newHistory = updates.status && updates.status !== o.status 
        ? [...(o.history || []), { status: updates.status, timestamp: new Date().toISOString(), user: 'Gestor de Almoxarifado' }]
        : (o.history || []);

      updatedOrder = { 
        ...o, 
        ...updates,
        history: newHistory
      };
      return updatedOrder;
    }
    return o;
  });
  localStorage.setItem('purchase_orders', JSON.stringify(updatedData));
  return updatedOrder;
};

export const addOrderNote = async (id: string, note: string, user: string): Promise<PurchaseOrder | null> => {
  const current = await getOrders();
  let updatedOrder: PurchaseOrder | null = null;
  const updatedData = current.map(o => {
    if (o.id === id) {
      updatedOrder = { 
        ...o, 
        history: [...(o.history || []), { status: o.status, timestamp: new Date().toISOString(), user, note }]
      };
      return updatedOrder;
    }
    return o;
  });
  localStorage.setItem('purchase_orders', JSON.stringify(updatedData));
  return updatedOrder;
};

export const deleteOrder = async (id: string): Promise<void> => {
  const current = await getOrders();
  localStorage.setItem('purchase_orders', JSON.stringify(current.filter(o => o.id !== id)));
};
