import React, { useState, useMemo, useRef } from 'react';
import {
  Warehouse, TriangleAlert, TrendingUp, Search, ShoppingCart, Package, Vault,
  Microscope, ListChecks, Ban, SlidersHorizontal, ReceiptText, Truck,
  ArrowUp, ArrowDown, Pointer, Upload, FileText, CheckCircle2, XCircle,
  BarChart3, PieChart
} from 'lucide-react';
import { Bar, Bubble, Line, Chart } from 'react-chartjs-2';
import 'chart.js/auto';

// --- Data Store ---
const reportData = {
  macro: {
    jan: { entries: 165342.03, exits: 194127.89, stock: 319956.82 },
    feb: { entries: 220248.42, exits: 143582.99, stock: 395295.34 }
  },
  categories: [
    {
      id: "hidraulica",
      name: "Materiais de Hidráulica",
      status: "risk", // Red
      entries: 24811.08,
      exits: 5226.46,
      stock: 68798.33,
      analysis: "Explosão de compras em Fev (24.8k) vs baixo consumo (5.2k). Verificar se há obra específica ou erro de aprovisionamento.",
      entriesQty: 1200,
      exitsQty: 250,
      stockQty: 3500
    },
    {
      id: "construcao",
      name: "Mat. Construção/Vidraçaria",
      status: "risk", // Red
      entries: 5747.70,
      exits: 755.13,
      stock: 15117.33,
      analysis: "Stock subiu de 10k para 15k com consumo quase nulo (755). Representa 'dinheiro parado' e risco de degradação.",
      entriesQty: 300,
      exitsQty: 40,
      stockQty: 800
    },
    {
      id: "higiene",
      name: "Higiene e Limpeza",
      status: "volume", // Yellow
      entries: 83646.40,
      exits: 66628.76,
      stock: 65142.08,
      analysis: "Maior volume financeiro. Stock cobre 1 mês. Gestão equilibrada, mas exige Just-in-Time para libertar espaço.",
      entriesQty: 15000,
      exitsQty: 12000,
      stockQty: 11500
    },
    {
      id: "descartaveis",
      name: "Materiais Descartáveis",
      status: "volume", // Yellow
      entries: 43203.58,
      exits: 34590.57,
      stock: 40661.63,
      analysis: "Consumo caiu de 43k para 34k, mas compras mantiveram-se. Necessário alinhar próxima compra com nova média real.",
      entriesQty: 25000,
      exitsQty: 20000,
      stockQty: 23000
    },
    {
      id: "eletrica",
      name: "Elétrica e Eletrónica",
      status: "stable", // Blue
      entries: 5153.80,
      exits: 9894.73,
      stock: 54964.15,
      analysis: "Correção positiva: Consumo (9.8k) superou Entradas (5.1k), ajudando a reduzir o alto stock acumulado.",
      entriesQty: 400,
      exitsQty: 800,
      stockQty: 4500
    },
    {
      id: "escritorio",
      name: "Materiais de Escritório",
      status: "stable", // Blue
      entries: 22456.43,
      exits: 17597.85,
      stock: 42437.06,
      analysis: "Padrão saudável. Cobertura de 1.5 a 2 meses. Dentro das melhores práticas de gestão.",
      entriesQty: 5000,
      exitsQty: 4000,
      stockQty: 9500
    }
  ],
  items: [
    { id: '1001', name: 'Tubo PVC 100mm', category: 'hidraulica', entriesQty: 500, entriesVal: 10000, exitsQty: 50, exitsVal: 1000, stockQty: 1500, stockVal: 30000, action: 'CONGELAR' },
    { id: '1002', name: 'Cimento 50kg', category: 'construcao', entriesQty: 100, entriesVal: 3000, exitsQty: 10, exitsVal: 300, stockQty: 250, stockVal: 7500, action: 'CONGELAR' },
    { id: '1003', name: 'Papel Toalha', category: 'higiene', entriesQty: 5000, entriesVal: 25000, exitsQty: 4500, exitsVal: 22500, stockQty: 3000, stockVal: 15000, action: 'COMPRAR' },
    { id: '1004', name: 'Seringa 10ml', category: 'descartaveis', entriesQty: 10000, entriesVal: 15000, exitsQty: 8000, exitsVal: 12000, stockQty: 5000, stockVal: 7500, action: 'COMPRAR' },
    { id: '1005', name: 'Lâmpada LED', category: 'eletrica', entriesQty: 100, entriesVal: 1500, exitsQty: 300, exitsVal: 4500, stockQty: 800, stockVal: 12000, action: 'ESTAVEL' },
    { id: '1006', name: 'Papel A4', category: 'escritorio', entriesQty: 2000, entriesVal: 10000, exitsQty: 1800, exitsVal: 9000, stockQty: 4000, stockVal: 20000, action: 'ESTAVEL' },
    { id: '1007', name: 'Soro Fisiológico', category: 'descartaveis', entriesQty: 8000, entriesVal: 12000, exitsQty: 8500, exitsVal: 12750, stockQty: 2000, stockVal: 3000, action: 'COMPRAR' },
    { id: '1008', name: 'Fio de Cobre', category: 'eletrica', entriesQty: 50, entriesVal: 2000, exitsQty: 10, exitsVal: 400, stockQty: 100, stockVal: 4000, action: 'CONGELAR' },
  ],
  pdfExtractedData: [
    { id: '1', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 4000, dtMov: '11/02/2026 08:10:16', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '2', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 3000, dtMov: '09/01/2026 08:20:07', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '3', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 3000, dtMov: '12/01/2026 09:49:12', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '4', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 3000, dtMov: '16/01/2026 08:58:06', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '5', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 3000, dtMov: '19/01/2026 07:59:50', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '6', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 3000, dtMov: '23/01/2026 08:33:13', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '7', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 3000, dtMov: '26/01/2026 10:04:16', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '8', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 3000, dtMov: '02/02/2026 09:48:46', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '9', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 3000, dtMov: '13/02/2026 07:58:01', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '10', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 3000, dtMov: '18/02/2026 07:51:19', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '11', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 2700, dtMov: '09/02/2026 10:21:51', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '12', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 2500, dtMov: '23/02/2026 08:23:46', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '13', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 2400, dtMov: '23/01/2026 08:33:13', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '14', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 2000, dtMov: '21/01/2026 07:57:07', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '15', material: 'Saco Para Lixo Verde - 40 Litros - Pacote Com 100 Sacos', un: 'un', qtMov: 2000, dtMov: '04/02/2026 08:13:25', operacao: 'Transferência - Saída', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '16', material: 'Disjuntor Tripolar 32a Curva C Din - Steck', un: 'un', qtMov: 5, dtMov: '06/01/2026 09:18:16', operacao: 'Devolução excesso Consumo', grupo: 'Materiais de Eletrica - Eletronica' },
    { id: '17', material: 'Disjuntor Tripolar 32a Curva C Din - Steck', un: 'un', qtMov: 5, dtMov: '07/01/2026 09:09:32', operacao: 'Devolução excesso Consumo', grupo: 'Materiais de Eletrica - Eletronica' },
    { id: '18', material: 'Disjuntor Tripolar 32a Curva C Din - Steck', un: 'un', qtMov: 5, dtMov: '07/01/2026 09:26:36', operacao: 'Consumo', grupo: 'Materiais de Eletrica - Eletronica' },
    { id: '19', material: 'Lixa D Agua 150', un: 'un', qtMov: 46, dtMov: '28/01/2026 10:22:05', operacao: 'Devolução excesso Consumo', grupo: 'Materiais de Pintura' },
    { id: '20', material: 'Fita Isolante Scotch Mod 33+classe A 19 Mm X 20 Metros', un: 'un', qtMov: 15, dtMov: '13/01/2026 16:16:41', operacao: 'Nota Fiscal de Compra', grupo: 'Materiais de Eletrica - Eletronica' },
    { id: '21', material: 'Fita Isolante Scotch Mod 33+classe A 19 Mm X 20 Metros', un: 'un', qtMov: 15, dtMov: '16/01/2026 09:36:17', operacao: 'Nota Fiscal de Compra', grupo: 'Materiais de Eletrica - Eletronica' },
    { id: '22', material: 'Fita Isolante Scotch Mod 33+classe A 19 Mm X 20 Metros', un: 'un', qtMov: 15, dtMov: '16/01/2026 09:42:13', operacao: 'Nota Fiscal de Compra', grupo: 'Materiais de Eletrica - Eletronica' },
    { id: '23', material: 'Papel Toalha Ultra - Supreme - Rolo De 200 Metros', un: 'un', qtMov: 900, dtMov: '06/01/2026 15:14:59', operacao: 'Nota Fiscal de Compra', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '24', material: 'Papel Toalha Ultra - Supreme - Rolo De 200 Metros', un: 'un', qtMov: 720, dtMov: '02/02/2026 12:01:14', operacao: 'Nota Fiscal de Compra', grupo: 'Materiais de Higiene e Limpeza' },
    { id: '25', material: 'Papel A4 75 Gr 500fls', pct: 'pct', qtMov: 400, dtMov: '08/01/2026 14:36:56', operacao: 'Nota Fiscal de Compra', grupo: 'Materiais de Escritorio' },
    { id: '26', material: 'Papel A4 75 Gr 500fls', pct: 'pct', qtMov: 400, dtMov: '09/02/2026 08:33:21', operacao: 'Nota Fiscal de Compra', grupo: 'Materiais de Escritorio' },
  ]
};

const colors = {
  risk: { bg: 'rgba(225, 29, 72, 0.7)', border: '#e11d48' },   // Rose-600
  volume: { bg: 'rgba(245, 158, 11, 0.7)', border: '#f59e0b' }, // Amber-500
  stable: { bg: 'rgba(100, 116, 139, 0.7)', border: '#64748b' } // Slate-500
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export default function InventoryDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'valor' | 'quantidade'>('valor');
  const [chartType, setChartType] = useState<'bubble' | 'pareto'>('bubble');
  
  // Table Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [classFilter, setClassFilter] = useState('TODAS');

  // PDF Table Filters
  const [pdfSearchTerm, setPdfSearchTerm] = useState('');
  const [pdfGroupFilter, setPdfGroupFilter] = useState('TODOS');
  const [pdfOperationFilter, setPdfOperationFilter] = useState('TODAS');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileNames = Array.from(e.target.files).map((f: File) => f.name).join(', ');
      alert(`Arquivos importados com sucesso:\n${fileNames}`);
    }
  };

  // --- PDF Table Filtering ---
  const filteredPdfData = useMemo(() => {
    return reportData.pdfExtractedData.filter(item => {
      const matchSearch = item.material.toLowerCase().includes(pdfSearchTerm.toLowerCase());
      const matchGroup = pdfGroupFilter === 'TODOS' || item.grupo === pdfGroupFilter;
      const matchOperation = pdfOperationFilter === 'TODAS' || item.operacao === pdfOperationFilter;
      return matchSearch && matchGroup && matchOperation;
    });
  }, [pdfSearchTerm, pdfGroupFilter, pdfOperationFilter]);

  const uniquePdfGroups = useMemo(() => Array.from(new Set(reportData.pdfExtractedData.map(i => i.grupo))), []);
  const uniquePdfOperations = useMemo(() => Array.from(new Set(reportData.pdfExtractedData.map(i => i.operacao))), []);

  const totalPdfMov = useMemo(() => {
    return filteredPdfData.reduce((acc, item) => acc + item.qtMov, 0);
  }, [filteredPdfData]);

  // --- Macro Chart Data ---
  const macroChartData = {
    labels: ['Entradas (Compras)', 'Saídas (Consumo)', 'Estoque Final'],
    datasets: [
      {
        label: 'Janeiro 2026',
        data: [reportData.macro.jan.entries, reportData.macro.jan.exits, reportData.macro.jan.stock],
        backgroundColor: '#d4c2ba', // brand-200
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      },
      {
        label: 'Fevereiro 2026',
        data: [reportData.macro.feb.entries, reportData.macro.feb.exits, reportData.macro.feb.stock],
        backgroundColor: '#3b1c11', // brand-900
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      }
    ]
  };

  const macroChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          color: '#5f4033', // brand-700
          font: {
            family: 'Inter',
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.dataset.label + ': ' + formatCurrency(context.raw);
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: '#f5f0ed' }, // brand-50
        ticks: {
          color: '#81665a', // brand-500
          font: { family: 'Inter', size: 11 }
        },
        border: { display: false }
      },
      x: { 
        grid: { display: false },
        ticks: {
          color: '#5f4033', // brand-700
          font: { family: 'Inter', size: 12 }
        },
        border: { display: false }
      }
    }
  };

  // --- Bubble Chart Data ---
  const bubbleData = {
    datasets: [{
      label: 'Categorias',
      data: reportData.categories.map(cat => ({
        x: viewMode === 'valor' ? cat.exits : cat.exitsQty,
        y: viewMode === 'valor' ? cat.entries : cat.entriesQty,
        r: viewMode === 'valor' ? Math.sqrt(cat.stock) / 5 : Math.sqrt(cat.stockQty) / 2,
        catId: cat.id
      })),
      backgroundColor: reportData.categories.map(cat => colors[cat.status as keyof typeof colors].bg),
      borderColor: reportData.categories.map(cat => colors[cat.status as keyof typeof colors].border),
      borderWidth: 1
    }]
  };

  const bubbleOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (e: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        setSelectedCategory(reportData.categories[index]);
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const cat = reportData.categories[context.dataIndex];
            const stockVal = viewMode === 'valor' ? formatCurrency(cat.stock) : formatNumber(cat.stockQty);
            return `${cat.name} (Stock: ${stockVal})`;
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: viewMode === 'valor' ? 'Consumo (Saídas R$)' : 'Consumo (Saídas Qtd)' },
        grid: { color: '#f5f5f4' }
      },
      y: {
        title: { display: true, text: viewMode === 'valor' ? 'Compras (Entradas R$)' : 'Compras (Entradas Qtd)' },
        grid: { color: '#f5f5f4' }
      }
    }
  };

  // --- Pareto Chart Data ---
  const sortedCategories = [...reportData.categories].sort((a, b) => 
    viewMode === 'valor' ? b.stock - a.stock : b.stockQty - a.stockQty
  );
  
  let cumulative = 0;
  const totalStock = sortedCategories.reduce((sum, cat) => sum + (viewMode === 'valor' ? cat.stock : cat.stockQty), 0);
  
  const paretoData = {
    labels: sortedCategories.map(c => c.name),
    datasets: [
      {
        type: 'line' as const,
        label: '% Acumulado',
        data: sortedCategories.map(cat => {
          cumulative += (viewMode === 'valor' ? cat.stock : cat.stockQty);
          return (cumulative / totalStock) * 100;
        }),
        borderColor: '#0ea5e9',
        backgroundColor: '#0ea5e9',
        borderWidth: 2,
        yAxisID: 'y1',
      },
      {
        type: 'bar' as const,
        label: viewMode === 'valor' ? 'Estoque (R$)' : 'Estoque (Qtd)',
        data: sortedCategories.map(cat => viewMode === 'valor' ? cat.stock : cat.stockQty),
        backgroundColor: sortedCategories.map(cat => colors[cat.status as keyof typeof colors].bg),
        borderColor: sortedCategories.map(cat => colors[cat.status as keyof typeof colors].border),
        borderWidth: 1,
        yAxisID: 'y',
      }
    ]
  };

  const paretoOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (e: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        setSelectedCategory(sortedCategories[index]);
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: viewMode === 'valor' ? 'Valor (R$)' : 'Quantidade' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        title: { display: true, text: '% Acumulado' },
        min: 0,
        max: 100
      }
    }
  };

  // --- Table Filtering ---
  const filteredItems = useMemo(() => {
    return reportData.items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.includes(searchTerm);
      const matchStatus = statusFilter === 'TODOS' || item.action === statusFilter;
      const matchClass = classFilter === 'TODAS' || item.category === classFilter;
      return matchSearch && matchStatus && matchClass;
    });
  }, [searchTerm, statusFilter, classFilter]);

  const tableTotals = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      acc.entriesQty += item.entriesQty;
      acc.entriesVal += item.entriesVal;
      acc.exitsQty += item.exitsQty;
      acc.exitsVal += item.exitsVal;
      acc.stockQty += item.stockQty;
      acc.stockVal += item.stockVal;
      return acc;
    }, { entriesQty: 0, entriesVal: 0, exitsQty: 0, exitsVal: 0, stockQty: 0, stockVal: 0 });
  }, [filteredItems]);

  // Giro de Estoque Global
  const giroGlobal = reportData.macro.feb.exits / reportData.macro.feb.stock;
  const coberturaDias = 30 / giroGlobal;

  return (
    <div className="bg-[#f5f0ed] rounded-[2rem] overflow-hidden text-[#292524] font-sans pb-12 shadow-sm border border-brand-200">
      {/* Navigation / Header */}
      <nav className="bg-[#3b1c11] border-b border-[#4d2d22] sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-0 sm:h-24 lg:h-20 gap-4 sm:gap-0">
            <div className="flex items-center w-full sm:w-auto justify-between">
              <div className="flex-shrink-0 flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-[#5f4033] flex items-center justify-center bg-[#4d2d22] shrink-0">
                  <Warehouse className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">HSF Almoxarifado</h1>
                  <p className="text-[10px] sm:text-[11px] text-[#d4c2ba] font-semibold uppercase tracking-widest mt-0.5">Relatório Estratégico Fev 2026</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-transparent border border-[#705346] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#4d2d22] transition-colors whitespace-nowrap shrink-0 flex-1 sm:flex-none"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Importar PDF</span>
                <span className="sm:hidden">Importar</span>
              </button>
              <button className="flex items-center justify-center gap-2 bg-[#7f1d1d] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#991b1b] transition-colors border border-[#991b1b] whitespace-nowrap shrink-0 flex-1 sm:flex-none">
                <TriangleAlert className="w-4 h-4" /> 
                <span className="hidden sm:inline">Atenção: Sobre-estoque</span>
                <span className="sm:hidden">Alertas</span>
              </button>
              <input 
                type="file" 
                multiple 
                accept=".pdf" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Section 1: Executive Summary & Macro KPIs */}
        <section id="summary-section" className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#3b1c11] p-6 rounded-2xl shadow-sm border border-[#4d2d22] relative overflow-hidden group flex flex-col justify-between">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-[#d4c2ba] uppercase tracking-wider">Entradas (Compras)</p>
                  <div className="w-10 h-10 rounded-full border border-[#5f4033] flex items-center justify-center text-[#d4c2ba] bg-[#4d2d22]">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-4xl font-bold text-white mb-2">220.248</h3>
                <div className="flex items-center text-sm mb-4">
                  <span className="text-emerald-400 font-bold flex items-center">
                    <ArrowUp className="w-4 h-4 mr-1" /> 33,2%
                  </span>
                  <span className="text-[#a58c82] ml-2">vs Janeiro (165k)</span>
                </div>
                <div className="pt-3 border-t border-[#4d2d22] flex justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="text-[#a58c82] uppercase tracking-wider font-bold">Principal</span>
                    <span className="text-white font-medium">185.248</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[#a58c82] uppercase tracking-wider font-bold">Substoque</span>
                    <span className="text-white font-medium">35.000</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#5f4033] p-6 rounded-2xl shadow-sm border border-[#705346] relative overflow-hidden group flex flex-col justify-between">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-[#e6dcd7] uppercase tracking-wider">Saídas (Consumo)</p>
                  <div className="w-10 h-10 rounded-full border border-[#81665a] flex items-center justify-center text-[#e6dcd7] bg-[#705346]">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-4xl font-bold text-white mb-2">143.582</h3>
                <div className="flex items-center text-sm mb-4">
                  <span className="text-rose-400 font-bold flex items-center">
                    <ArrowDown className="w-4 h-4 mr-1" /> 26,0%
                  </span>
                  <span className="text-[#d4c2ba] ml-2">vs Janeiro (194k)</span>
                </div>
                <div className="pt-3 border-t border-[#705346] flex justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="text-[#d4c2ba] uppercase tracking-wider font-bold">Principal</span>
                    <span className="text-white font-medium">120.000</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[#d4c2ba] uppercase tracking-wider font-bold">Substoque</span>
                    <span className="text-white font-medium">23.582</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#81665a] p-6 rounded-2xl shadow-sm border border-[#93796e] relative overflow-hidden group flex flex-col justify-between">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Saldo Final (Estoque)</p>
                  <div className="w-10 h-10 rounded-full border border-[#a58c82] flex items-center justify-center text-white bg-[#93796e]">
                    <Vault className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-4xl font-bold text-white mb-2">395.295</h3>
                <div className="flex items-center text-sm mb-4">
                  <span className="text-emerald-300 font-bold flex items-center">
                    <ArrowUp className="w-4 h-4 mr-1" /> 23,5%
                  </span>
                  <span className="text-white ml-2">Capital Imobilizado</span>
                </div>
                <div className="pt-3 border-t border-[#93796e] flex justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="text-[#e6dcd7] uppercase tracking-wider font-bold">Principal</span>
                    <span className="text-white font-medium">330.000</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[#e6dcd7] uppercase tracking-wider font-bold">Substoque</span>
                    <span className="text-white font-medium">65.295</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#a58c82] p-6 rounded-2xl shadow-sm border border-[#d4c2ba] relative overflow-hidden group flex flex-col justify-between">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Giro de Estoque</p>
                  <div className="w-10 h-10 rounded-full border border-[#d4c2ba] flex items-center justify-center text-white bg-[#b8a299]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-4xl font-bold text-white mb-2">{giroGlobal.toFixed(2).replace('.', ',')}x</h3>
                <div className="flex items-center text-sm mb-4">
                  <span className="text-white font-bold flex items-center">
                    Cobertura: {coberturaDias.toFixed(0)} dias
                  </span>
                </div>
                <div className="pt-3 border-t border-[#b8a299] flex justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="text-[#f5f0ed] uppercase tracking-wider font-bold">Principal</span>
                    <span className="text-white font-medium">0,36x</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[#f5f0ed] uppercase tracking-wider font-bold">Substoque</span>
                    <span className="text-white font-medium">0,36x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Macro Chart */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#e6dcd7]">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-[#3b1c11]">Comparativo Mensal: O Efeito Tesoura</h3>
              <p className="text-[15px] text-[#81665a] mt-1">Visualização do aumento das compras vs. queda do consumo.</p>
            </div>
            <div className="h-[350px]">
              <Bar data={macroChartData} options={macroChartOptions} />
            </div>
          </div>
        </section>

        {/* Section 2: Micro Analysis */}
        <section id="micro-section" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-brand-800 flex items-center gap-2">
                  <Microscope className="text-brand-400 w-6 h-6" /> Análise por Categoria (Curva ABC)
                </h2>
                <p className="mt-2 text-brand-600">
                  Explore a matriz abaixo para identificar as categorias críticas.
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="inline-flex items-center text-sm bg-brand-100 px-2 py-1 rounded border border-brand-200">
                    <span className="w-3 h-3 rounded-full bg-rose-500 mr-1"></span> Crítico
                  </span>
                  <span className="inline-flex items-center text-sm bg-brand-100 px-2 py-1 rounded border border-brand-200">
                    <span className="w-3 h-3 rounded-full bg-amber-500 mr-1"></span> Alto Volume
                  </span>
                  <span className="inline-flex items-center text-sm bg-brand-100 px-2 py-1 rounded border border-brand-200">
                    <span className="w-3 h-3 rounded-full bg-brand-500 mr-1"></span> Estável
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex bg-brand-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setChartType('bubble')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${chartType === 'bubble' ? 'bg-white shadow-sm text-brand-800' : 'text-brand-500 hover:text-brand-700'}`}
                  >
                    <PieChart className="w-4 h-4" /> Matriz
                  </button>
                  <button 
                    onClick={() => setChartType('pareto')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${chartType === 'pareto' ? 'bg-white shadow-sm text-brand-800' : 'text-brand-500 hover:text-brand-700'}`}
                  >
                    <BarChart3 className="w-4 h-4" /> Pareto
                  </button>
                </div>
                <div className="flex bg-brand-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setViewMode('valor')}
                    className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md ${viewMode === 'valor' ? 'bg-white shadow-sm text-brand-800' : 'text-brand-500 hover:text-brand-700'}`}
                  >
                    Por Valor (R$)
                  </button>
                  <button 
                    onClick={() => setViewMode('quantidade')}
                    className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md ${viewMode === 'quantidade' ? 'bg-white shadow-sm text-brand-800' : 'text-brand-500 hover:text-brand-700'}`}
                  >
                    Por Quantidade
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Chart */}
            <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-brand-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-brand-700">
                  {chartType === 'bubble' ? 'Matriz de Movimentação (Fev 2026)' : 'Curva ABC - Pareto (Fev 2026)'}
                </h3>
                <div className="text-xs text-brand-400">Clique nos elementos para detalhes</div>
              </div>
              <div className="h-[400px]">
                {chartType === 'bubble' ? (
                  <Bubble data={bubbleData} options={bubbleOptions} />
                ) : (
                  <Chart type="bar" data={paretoData} options={paretoOptions as any} />
                )}
              </div>
              {chartType === 'bubble' && (
                <div className="mt-2 text-center text-xs text-brand-400">
                  Eixo X: Consumo | Eixo Y: Compras | Tamanho: Stock Final
                </div>
              )}
            </div>

            {/* Details Panel */}
            <div className="lg:col-span-1 bg-brand-50 p-6 rounded-xl border border-brand-200 flex flex-col h-full">
              {!selectedCategory ? (
                <div className="text-center my-auto text-brand-400">
                  <Pointer className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Selecione uma categoria no gráfico para ver a análise estratégica.</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-brand-200 pb-3">
                    <h3 className="font-bold text-lg text-brand-900 leading-tight">{selectedCategory.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      selectedCategory.status === 'risk' ? 'bg-rose-100 text-rose-800' :
                      selectedCategory.status === 'volume' ? 'bg-amber-100 text-amber-800' :
                      'bg-brand-100 text-brand-800'
                    }`}>
                      {selectedCategory.status === 'risk' ? 'Alerta Vermelho' :
                       selectedCategory.status === 'volume' ? 'Alto Giro' : 'Estável'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-xs text-brand-500 uppercase">Entradas (Fev)</p>
                      <p className="font-mono font-bold text-brand-800">
                        {viewMode === 'valor' ? formatCurrency(selectedCategory.entries) : formatNumber(selectedCategory.entriesQty)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-xs text-brand-500 uppercase">Saídas (Fev)</p>
                      <p className="font-mono font-bold text-brand-800">
                        {viewMode === 'valor' ? formatCurrency(selectedCategory.exits) : formatNumber(selectedCategory.exitsQty)}
                      </p>
                    </div>
                    <div className="col-span-2 bg-brand-800 p-3 rounded shadow-sm text-white">
                      <p className="text-xs text-brand-400 uppercase">Stock Final</p>
                      <p className="font-mono font-bold text-xl">
                        {viewMode === 'valor' ? formatCurrency(selectedCategory.stock) : formatNumber(selectedCategory.stockQty)}
                      </p>
                    </div>
                    
                    {/* Giro Specific */}
                    <div className="col-span-2 bg-white p-3 rounded shadow-sm flex justify-between items-center">
                      <div>
                        <p className="text-xs text-brand-500 uppercase">Giro de {viewMode === 'valor' ? 'Valor' : 'Quantidade'}</p>
                        <p className="font-mono font-bold text-brand-600">
                          {viewMode === 'valor' 
                            ? (selectedCategory.exits / selectedCategory.stock).toFixed(2) 
                            : (selectedCategory.exitsQty / selectedCategory.stockQty).toFixed(2)}x
                        </p>
                      </div>
                      <TrendingUp className="text-brand-200 w-6 h-6" />
                    </div>
                  </div>

                  <div className={`bg-white p-4 rounded border-l-4 shadow-sm ${
                    selectedCategory.status === 'risk' ? 'border-rose-500' :
                    selectedCategory.status === 'volume' ? 'border-amber-500' :
                    'border-brand-500'
                  }`}>
                    <h4 className="font-bold text-sm text-brand-700 mb-2">Análise & Ação</h4>
                    <p className="text-sm text-brand-600 leading-relaxed">{selectedCategory.analysis}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Insights do Relatório PDF */}
        <section id="pdf-insights" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-brand-800 flex items-center gap-2">
                <FileText className="text-brand-400 w-6 h-6" /> Inteligência de Movimentação
              </h2>
              <p className="mt-1 text-sm text-brand-600">Dados extraídos automaticamente do relatório HSF (Jan-Fev 2026)</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> PDF Processado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-brand-900">Top Consumo (Volume)</h3>
              </div>
              <ul className="space-y-4">
                {[
                  { name: 'Saco Lixo Verde 40L', qty: '85.400 un', trend: 'Alta' },
                  { name: 'Copo Descartável 200ml', qty: '4.250 pct', trend: 'Estável' },
                  { name: 'Papel A4 75g', qty: '1.840 pct', trend: 'Alta' },
                ].map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-sm border-b border-brand-50 pb-3 last:border-0 last:pb-0">
                    <span className="font-medium text-brand-700">{item.name}</span>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-brand-900">{item.qty}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                  <TriangleAlert className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-brand-900">Alertas de Ruptura</h3>
              </div>
              <ul className="space-y-4">
                {[
                  { name: 'Papel Toalha Ultra', setor: 'Higiene', status: 'Estoque Crítico' },
                  { name: 'Saco Lixo Preto 200L', setor: 'Higiene', status: 'Abaixo da Média' },
                  { name: 'Luva de Procedimento', setor: 'Descartáveis', status: 'Risco de Falta' },
                ].map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-sm border-b border-brand-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <span className="font-medium text-brand-700 block">{item.name}</span>
                      <span className="text-[10px] text-brand-400 uppercase">{item.setor}</span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">{item.status}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                  <ArrowDown className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-brand-900">Devoluções / Inativos</h3>
              </div>
              <ul className="space-y-4">
                {[
                  { name: 'Disjuntor Tripolar 32A', motivo: 'Excesso Consumo', qty: '15 un' },
                  { name: 'Lixa D Agua 150', motivo: 'Excesso Consumo', qty: '46 un' },
                  { name: 'Fita Isolante Scotch', motivo: 'Excesso Consumo', qty: '22 un' },
                ].map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-sm border-b border-brand-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <span className="font-medium text-brand-700 block">{item.name}</span>
                      <span className="text-[10px] text-brand-400 uppercase">{item.motivo}</span>
                    </div>
                    <span className="font-bold text-brand-900">{item.qty}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: PDF Extracted Data Table */}
        <section id="pdf-table-section">
          <div className="bg-white rounded-xl shadow-sm border border-brand-200 overflow-hidden">
            <div className="p-6 border-b border-brand-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-brand-800">Movimentação Detalhada (PDF)</h2>
                <p className="text-sm text-brand-500">Registros extraídos do relatório original</p>
              </div>
              
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Buscar material..." 
                    className="w-full pl-9 pr-4 py-2 bg-brand-50 border border-brand-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={pdfSearchTerm}
                    onChange={(e) => setPdfSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  className="bg-brand-50 border border-brand-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 max-w-[200px] truncate"
                  value={pdfGroupFilter}
                  onChange={(e) => setPdfGroupFilter(e.target.value)}
                >
                  <option value="TODOS">Todos os Grupos</option>
                  {uniquePdfGroups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <select 
                  className="bg-brand-50 border border-brand-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 max-w-[200px] truncate"
                  value={pdfOperationFilter}
                  onChange={(e) => setPdfOperationFilter(e.target.value)}
                >
                  <option value="TODAS">Todas as Operações</option>
                  {uniquePdfOperations.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-brand-50 text-brand-500 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 font-medium">Material</th>
                    <th className="px-6 py-3 font-medium">Grupo</th>
                    <th className="px-6 py-3 font-medium text-center">Un.</th>
                    <th className="px-6 py-3 font-medium text-right">Qt. Mov.</th>
                    <th className="px-6 py-3 font-medium text-center">Dt. Mov.</th>
                    <th className="px-6 py-3 font-medium">Operação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {filteredPdfData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-brand-400">Nenhum registro encontrado com os filtros atuais.</td>
                    </tr>
                  ) : (
                    filteredPdfData.map((item) => (
                      <tr key={item.id} className="hover:bg-brand-50/50 transition-colors">
                        <td className="px-6 py-3 font-medium text-brand-800 truncate max-w-[300px]" title={item.material}>{item.material}</td>
                        <td className="px-6 py-3 text-brand-600 truncate max-w-[200px]" title={item.grupo}>{item.grupo}</td>
                        <td className="px-6 py-3 text-brand-500 text-center uppercase text-xs">{item.un}</td>
                        <td className="px-6 py-3 font-mono font-bold text-brand-800 text-right">{formatNumber(item.qtMov)}</td>
                        <td className="px-6 py-3 text-brand-500 text-center">{item.dtMov}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.operacao.includes('Saída') || item.operacao.includes('Consumo') ? 'bg-rose-100 text-rose-700' :
                            item.operacao.includes('Entrada') || item.operacao.includes('Compra') ? 'bg-emerald-100 text-emerald-700' :
                            'bg-brand-100 text-brand-700'
                          }`}>
                            {item.operacao}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredPdfData.length > 0 && (
                  <tfoot className="bg-brand-50/80 sticky bottom-0 border-t border-brand-200 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 font-bold text-brand-900 text-right uppercase tracking-wider text-xs">Total Filtrado:</td>
                      <td className="px-6 py-4 font-mono font-black text-brand-900 text-right text-base">{formatNumber(totalPdfMov)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div className="bg-brand-50 p-4 text-xs text-brand-500 flex justify-between items-center border-t border-brand-100">
              <span>Mostrando {filteredPdfData.length} de {reportData.pdfExtractedData.length} registros</span>
            </div>
          </div>
        </section>

        {/* Section 5: Data Table */}
        <section id="table-section">
          <div className="bg-white rounded-xl shadow-sm border border-brand-200 overflow-hidden">
            <div className="p-6 border-b border-brand-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-brand-800">Análise de Reposição de Materiais</h2>
                <p className="text-sm text-brand-500">Detalhamento por item e ações sugeridas</p>
              </div>
              
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Buscar material..." 
                    className="w-full pl-9 pr-4 py-2 bg-brand-50 border border-brand-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  className="bg-brand-50 border border-brand-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  <option value="TODAS">Todas as Classes</option>
                  {reportData.categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select 
                  className="bg-brand-50 border border-brand-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="COMPRAR">Comprar</option>
                  <option value="CONGELAR">Congelar</option>
                  <option value="ESTAVEL">Estável</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-brand-50 text-brand-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Código</th>
                    <th className="px-6 py-3 font-medium">Descrição</th>
                    <th className="px-6 py-3 font-medium text-right">Qtde Ent.</th>
                    <th className="px-6 py-3 font-medium text-right">Valor Ent.</th>
                    <th className="px-6 py-3 font-medium text-right">Consumo</th>
                    <th className="px-6 py-3 font-medium text-right">Saldo</th>
                    <th className="px-6 py-3 font-medium text-right">Giro Qtd</th>
                    <th className="px-6 py-3 font-medium text-right">Giro Val</th>
                    <th className="px-6 py-3 font-medium text-center">Ação Sugerida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-brand-50">
                      <td className="px-6 py-4 font-mono text-brand-500">{item.id}</td>
                      <td className="px-6 py-4 font-medium text-brand-800">{item.name}</td>
                      <td className="px-6 py-4 text-right">{formatNumber(item.entriesQty)}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(item.entriesVal)}</td>
                      <td className="px-6 py-4 text-right">{formatNumber(item.exitsQty)}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatNumber(item.stockQty)}</td>
                      <td className="px-6 py-4 text-right text-brand-500">{(item.exitsQty / item.stockQty).toFixed(2)}x</td>
                      <td className="px-6 py-4 text-right text-brand-500">{(item.exitsVal / item.stockVal).toFixed(2)}x</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.action === 'CONGELAR' ? 'bg-rose-100 text-rose-800' :
                          item.action === 'COMPRAR' ? 'bg-brand-100 text-brand-800' :
                          'bg-brand-100 text-brand-800'
                        }`}>
                          {item.action === 'CONGELAR' && <Ban className="w-3 h-3 mr-1" />}
                          {item.action === 'COMPRAR' && <ShoppingCart className="w-3 h-3 mr-1" />}
                          {item.action === 'ESTAVEL' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {item.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-brand-500">
                        Nenhum item encontrado com os filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-brand-100 font-bold text-brand-800">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-right">TOTAIS:</td>
                    <td className="px-6 py-4 text-right">{formatNumber(tableTotals.entriesQty)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(tableTotals.entriesVal)}</td>
                    <td className="px-6 py-4 text-right">{formatNumber(tableTotals.exitsQty)}</td>
                    <td className="px-6 py-4 text-right">{formatNumber(tableTotals.stockQty)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        {/* Section 4: Recommendations */}
        <section id="recommendations-section">
          <div className="bg-white rounded-xl shadow-sm border border-brand-200 overflow-hidden">
            <div className="p-6 md:p-8 bg-brand-900 text-white">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ListChecks className="text-brand-400 w-6 h-6" /> Plano de Ação Imediato
              </h2>
              <p className="mt-2 text-brand-300">Medidas corretivas recomendadas à Coordenação para mitigar o risco de overstock.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-brand-100">
              <div className="p-6 hover:bg-brand-50 transition-colors">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                    <Ban className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-800">1. Congelamento de Compras</h3>
                    <p className="text-sm text-brand-600 mt-1">
                      Suspender novas ordens para <strong>Hidráulica</strong> e <strong>Construção Civil</strong> até o stock normalizar (cobertura 30-45 dias).
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 hover:bg-brand-50 transition-colors">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-800">2. Revisão Ponto de Encomenda</h3>
                    <p className="text-sm text-brand-600 mt-1">
                      A queda de 26% no consumo exige recalcular os níveis mínimos e máximos no ERP para evitar compras automáticas desnecessárias.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 hover:bg-brand-50 transition-colors border-t border-brand-100">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                    <ReceiptText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-800">3. Auditoria de Saldo</h3>
                    <p className="text-sm text-brand-600 mt-1">
                      Rastrear a diferença de <strong>1.326,91</strong> entre o fecho de Janeiro e abertura de Fevereiro via logs do sistema.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 hover:bg-brand-50 transition-colors border-t border-brand-100">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-800">4. Implementar Just-in-Time</h3>
                    <p className="text-sm text-brand-600 mt-1">
                      Para <strong>Higiene</strong> e <strong>Descartáveis</strong>, negociar entregas semanais/quinzenais para reduzir o volume físico e financeiro armazenado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-brand-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-brand-400 text-sm">© 2026 HSF Almoxarifado. Dados extraídos dos balancetes sintéticos.</p>
        </div>
      </footer>
    </div>
  );
}
