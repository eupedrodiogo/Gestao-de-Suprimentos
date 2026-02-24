
import { GoogleGenAI, Type } from "@google/genai";
import { OrderItem, OrderStamp, PurchaseOrder, VendorPerformance, WarehouseType, FileType, Quotation } from "../types";

export interface ExtractedOrderData {
  supplierName: string;
  supplierTaxId: string;
  buyerName: string;
  docRef: string;
  projectName: string;
  warehouse: WarehouseType;
  description: string;
  amount: number;
  taxAmount: number;
  date: string;
  paymentTerms: string;
  deliveryDate: string;
  notes: string;
  items: OrderItem[];
  stamps: OrderStamp[];
  fileType: FileType;
}

export interface MarketInsight {
  text: string;
  sources: { title: string; uri: string }[];
}

export interface StrategicReport {
  summary: string;
  savingsOpportunities: { title: string; description: string; potentialValue: string }[];
  riskAnalysis: { supplier: string; risk: string; mitigation: string }[];
  categoryInsights: { category: string; trend: string }[];
}

/**
 * Utility to sanitize orders by removing heavy base64 file data before sending to LLM
 */
const sanitizeForAI = (orders: PurchaseOrder[]) => {
  return orders.map(({ fileUrl, fileName, history, stamps, items, ...rest }) => ({
    ...rest,
    items: items?.map(({ description, quantity, unitPrice, totalPrice }) => ({
      description, quantity, unitPrice, totalPrice
    }))
  }));
};

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAiQuotations = async (order: PurchaseOrder): Promise<Quotation[]> => {
  try {
    const ai = getAiClient();
    const itemsDescription = order.items?.map(i => `${i.quantity}x ${i.description}`).join(', ') || order.description;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [{
            text: `Aja como um Agente de Compras Inteligente para o "Hospital São Francisco na Providência de Deus", localizado na Rua Conde de Bonfim, 1033, Tijuca, Rio de Janeiro - RJ.
            
            Gere 3 cotações realistas de fornecedores para os seguintes itens:
            "${itemsDescription}"
            
            REGRAS DE PRIORIDADE DE FORNECEDORES (GEOLOCALIZAÇÃO):
            1. Prioridade Máxima: Fornecedores do estado do Rio de Janeiro (RJ), especialmente da capital ou região metropolitana.
            2. Prioridade Média: Fornecedores da Região Sudeste (SP, MG, ES).
            3. Prioridade Baixa: Outras regiões, apenas se não houver opções viáveis próximas.
            
            Considere fornecedores reais do mercado brasileiro se possível, ou crie nomes plausíveis que respeitem a lógica regional acima.
            Varie os preços, prazos de entrega (menores para locais mais próximos) e condições de pagamento.
            
            Atribua um 'aiScore' (0-100) baseado no Custo Total (Preço + Frete Implícito + Prazo). Fornecedores do RJ devem ter bônus no score devido à logística facilitada.
            No campo 'aiReasoning', explique o score citando explicitamente a localização do fornecedor em relação à Tijuca/RJ.
            
            Retorne APENAS JSON.`
          }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              supplierName: { type: Type.STRING },
              price: { type: Type.NUMBER },
              deliveryTimeDays: { type: Type.NUMBER },
              paymentTerms: { type: Type.STRING },
              isWinner: { type: Type.BOOLEAN },
              aiScore: { type: Type.NUMBER },
              aiReasoning: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    const quotations = JSON.parse(response.text || "[]");
    // Ensure IDs are unique if AI didn't generate them well
    return quotations.map((q: any, idx: number) => ({
      ...q,
      id: q.id || `QUOTE-${Date.now()}-${idx}`,
      isWinner: false // Reset winner status initially
    }));
  } catch (error) {
    console.error("Erro ao gerar cotações IA:", error);
    // Fallback mock data
    return [
      {
        id: 'QUOTE-MOCK-1',
        supplierName: 'Cirúrgica Rio de Janeiro (Mock)',
        price: order.amount || 1500,
        deliveryTimeDays: 1,
        paymentTerms: '30 dias',
        isWinner: false,
        aiScore: 95,
        aiReasoning: 'Fornecedor local (RJ). Entrega imediata.'
      },
      {
        id: 'QUOTE-MOCK-2',
        supplierName: 'MedHospitalar SP (Mock)',
        price: (order.amount || 1500) * 0.95, // Cheaper but further
        deliveryTimeDays: 4,
        paymentTerms: '15 dias',
        isWinner: false,
        aiScore: 82,
        aiReasoning: 'Preço menor, mas frete e prazo maiores (SP).'
      }
    ];
  }
};

export const extractDataFromDocument = async (file: File): Promise<ExtractedOrderData | null> => {
  try {
    const ai = getAiClient();
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo."));
      reader.readAsDataURL(file);
    });

    let mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            {
              text: `Aja como o Auditor Digital do SupriNexus. Extraia os dados deste documento fiscal/logístico.
              Campos: Fornecedor, CNPJ, Valor Total, Data, Itens (descrição, qtd, preço unitário) e Setor (FARMÁCIA, T.I. ou ALMOXARIFADO CENTRAL).
              Retorne APENAS JSON.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplierName: { type: Type.STRING },
            supplierTaxId: { type: Type.STRING },
            docRef: { type: Type.STRING },
            warehouse: { type: Type.STRING, enum: ['FARMÁCIA', 'ALMOXARIFADO CENTRAL', 'T.I.', 'ENGENHARIA CLÍNICA / MRO', 'NUTRIÇÃO & DIETÉTICA'] },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            fileType: { type: Type.STRING, enum: ['INVOICE', 'PURCHASE_ORDER', 'QUOTATION', 'CONTRACT', 'OTHER'] },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  totalPrice: { type: Type.NUMBER }
                }
              }
            }
          },
          required: ["supplierName", "amount", "fileType"]
        }
      }
    });

    return JSON.parse(response.text || "null");
  } catch (error) {
    console.error("Erro na extração SupriNexus:", error);
    return null;
  }
};

export const extractQuotationData = async (file: File): Promise<Partial<Quotation> | null> => {
  try {
    const ai = getAiClient();
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo."));
      reader.readAsDataURL(file);
    });

    let mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            {
              text: `Extraia os dados desta cotação comercial.
              Identifique o nome do fornecedor, o valor total da cotação, o prazo de entrega em dias (se houver, converta para número), e as condições de pagamento.
              Retorne APENAS JSON.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplierName: { type: Type.STRING },
            price: { type: Type.NUMBER },
            deliveryTimeDays: { type: Type.NUMBER },
            paymentTerms: { type: Type.STRING }
          },
          required: ["supplierName", "price"]
        }
      }
    });

    return JSON.parse(response.text || "null");
  } catch (error) {
    console.error("Erro na extração de cotação:", error);
    return null;
  }
};

export const getApprovalRecommendation = async (order: PurchaseOrder, history: PurchaseOrder[]): Promise<{ recommendation: 'APPROVE' | 'REVIEW' | 'REJECT'; reason: string }> => {
  try {
    const ai = getAiClient();
    // Limita o histórico para evitar payload muito grande
    const sanitizedHistory = sanitizeForAI(history.filter(h => h.supplierName === order.supplierName).slice(0, 20));
    const sanitizedOrder = sanitizeForAI([order])[0];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [{
            text: `Analise esta ordem no contexto SupriNexus. 
            ORDEM ATUAL: ${JSON.stringify(sanitizedOrder)}
            HISTÓRICO RECENTE: ${JSON.stringify(sanitizedHistory)}
            Recomende APROVAR, REVISAR ou REJEITAR com base em preços e conformidade.`
          }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING, enum: ['APPROVE', 'REVIEW', 'REJECT'] },
            reason: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch {
    return { recommendation: 'REVIEW', reason: 'Análise técnica pendente devido a instabilidade no Nexus.' };
  }
};

export const analyzeVendorPerformance = async (supplierName: string, orders: PurchaseOrder[]): Promise<VendorPerformance> => {
  try {
    const ai = getAiClient();
    // Limita para as últimas 30 ordens desse fornecedor
    const vendorOrders = sanitizeForAI(orders.filter(o => o.supplierName === supplierName).slice(0, 30));
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [{
            text: `Gere um scorecard SupriNexus para o fornecedor "${supplierName}".
            DADOS SANITIZADOS: ${JSON.stringify(vendorOrders)}.
            Avalie de 0-100: Score Global, Custos, Confiança e Compliance.`
          }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            costEfficiency: { type: Type.NUMBER },
            reliability: { type: Type.NUMBER },
            compliance: { type: Type.NUMBER },
            aiAnalysis: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Erro Scorecard:", error);
    return { 
      score: 50, 
      costEfficiency: 50, 
      reliability: 50, 
      compliance: 50, 
      aiAnalysis: "O Nexus não pôde processar o scorecard completo. Baseie-se no histórico manual." 
    };
  }
};

export const getSupplierReputation = async (supplierName: string): Promise<MarketInsight | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Pesquise a reputação de mercado e saúde financeira do fornecedor "${supplierName}".`,
      config: { tools: [{ googleSearch: {} }] },
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      .map(chunk => ({ title: chunk.web!.title, uri: chunk.web!.uri })) || [];
    return { text: response.text || "Sem dados externos.", sources };
  } catch { return null; }
};

export const findSupplierLocation = async (supplierName: string): Promise<MarketInsight | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview",
      contents: `Localize os centros de distribuição da "${supplierName}" no Brasil.`,
      config: { tools: [{ googleSearch: {} }, { googleMaps: {} }] },
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.maps)
      .map(chunk => ({ title: chunk.maps!.title, uri: chunk.maps!.uri })) || [];
    return { text: response.text || "Localização não mapeada.", sources };
  } catch { return null; }
};

export const generateSourcingStrategy = async (orders: PurchaseOrder[]): Promise<StrategicReport | null> => {
  try {
    const ai = getAiClient();
    // Limita análise às últimas 50 ordens globais
    const data = sanitizeForAI(orders.slice(0, 50));
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [{
            text: `Aja como o Consultor Sourcing do SupriNexus. Analise estes dados recentes: ${JSON.stringify(data)}`
          }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            savingsOpportunities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  potentialValue: { type: Type.STRING }
                }
              }
            },
            riskAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  supplier: { type: Type.STRING },
                  risk: { type: Type.STRING },
                  mitigation: { type: Type.STRING }
                }
              }
            },
            categoryInsights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { category: { type: Type.STRING }, trend: { type: Type.STRING } }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch { return null; }
};

export const askAboutOrders = async (orders: PurchaseOrder[], query: string): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Otimização: Ordena por data decrescente e pega apenas as 50 últimas ordens para o contexto.
    // Isso evita o erro de limite de tokens e melhora a relevância.
    const recentOrders = orders
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50);

    const context = sanitizeForAI(recentOrders);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: 'user',
          parts: [
            { 
              text: `Você é o Nexus Assistant, um especialista em Supply Chain e Inteligência Hospitalar.
              Responda perguntas sobre as ordens de compra com base APENAS nos dados fornecidos abaixo.
              Se não encontrar a informação, diga que não há dados suficientes.
              Seja conciso, profissional e use formatação markdown se necessário.
              
              CONTEXTO DE DADOS (Últimas 50 Ordens):
              ${JSON.stringify(context)}
              
              PERGUNTA DO USUÁRIO:
              ${query}`
            }
          ]
        }
      ],
    });
    return response.text || "O Nexus processou sua solicitação mas não gerou resposta em texto.";
  } catch (error) { 
    console.error("Erro no Chat Nexus:", error);
    return "Nexus Assistant temporariamente indisponível. Por favor, tente novamente em alguns instantes."; 
  }
};
