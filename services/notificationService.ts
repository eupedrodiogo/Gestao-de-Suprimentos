
import { PurchaseOrder, User, OrderStatus } from '../types';

export const sendNotification = async (order: PurchaseOrder, action: string, currentUser: User) => {
  // Simula delay de API de envio
  console.log(`[Notification Service] Iniciando disparos para Ordem ${order.id}...`);
  
  const stakeholders = getStakeholdersForOrder(order);
  
  for (const stakeholder of stakeholders) {
    // Não notificar o próprio usuário que realizou a ação
    if (stakeholder.email === currentUser.email) continue;

    await sendEmail(stakeholder, order, action);
    await sendWhatsApp(stakeholder, order, action);
  }
  
  return stakeholders.length;
};

const getStakeholdersForOrder = (order: PurchaseOrder): { role: string, email: string, phone: string }[] => {
  // Em um sistema real, isso viria do banco de dados de usuários.
  // Aqui vamos retornar perfis genéricos baseados nas regras de negócio solicitadas.
  
  const recipients = [
    { role: 'DIRETORIA', email: 'diretoria@nexus.com', phone: '5511999990001' },
    { role: 'GERENCIA_SUPRIMENTOS', email: 'gerencia@nexus.com', phone: '5511999990002' }
  ];

  if (order.status === OrderStatus.RECEIVED || order.fileType === 'INVOICE') {
    recipients.push({ role: 'COORD_FINANCEIRO', email: 'financeiro@nexus.com', phone: '5511999990005' });
  }

  if (['REQUESTED', 'APPROVED', 'RECEIVED'].includes(order.status)) {
    recipients.push({ role: 'COMPRAS', email: 'compras@nexus.com', phone: '5511999990003' });
    recipients.push({ role: 'COORD_ALMOXARIFADO', email: 'almoxarifado@nexus.com', phone: '5511999990004' });
  }

  // Notificar solicitante se houver ID vinculado (simulado)
  if (order.requesterId) {
     recipients.push({ role: 'SOLICITANTE', email: 'solicitante@nexus.com', phone: '5511999990006' });
  }

  return recipients;
};

const sendEmail = async (user: { email: string }, order: PurchaseOrder, action: string) => {
  console.log(`📧 EMAIL enviado para ${user.email}:
    Assunto: Atualização Nexus - Ordem ${order.id}
    Corpo: O status da ordem mudou para ${order.status}. 
    Setor: ${order.warehouse}
    Ação: ${action}
  `);
};

const sendWhatsApp = async (user: { phone: string }, order: PurchaseOrder, action: string) => {
  console.log(`📱 WHATSAPP enviado para ${user.phone}:
    Nexus Alert: Ordem ${order.id} atualizada.
    Status: ${order.status}
    Item: ${order.description}
  `);
};
