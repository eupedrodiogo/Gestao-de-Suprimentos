import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Send, AlertCircle } from 'lucide-react';
import { User, PurchaseOrder, OrderStatus, OrderItem } from '../types';
import { createOrder } from '../services/mockService';

interface RequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSuccess: () => void;
}

const RequestFormModal: React.FC<RequestFormModalProps> = ({ isOpen, onClose, currentUser, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    requesterName: '',
    requesterRole: '',
    costCenter: '',
    destinationLocation: '',
    urgencyLevel: 1 as 1 | 2 | 3,
    justification: '',
    items: [] as OrderItem[]
  });

  const [newItem, setNewItem] = useState<Partial<OrderItem>>({
    description: '',
    quantity: 1,
    isStandardized: false
  });

  useEffect(() => {
    if (isOpen && currentUser) {
      setFormData(prev => ({
        ...prev,
        requesterName: currentUser.name,
        costCenter: currentUser.department,
        // Reset items and other fields if needed or keep them
      }));
    }
  }, [isOpen, currentUser]);

  const handleAddItem = () => {
    if (!newItem.description) return;
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: newItem.description!,
        quantity: newItem.quantity || 1,
        unitPrice: 0,
        totalPrice: 0,
        isStandardized: newItem.isStandardized || false
      }]
    }));
    setNewItem({ description: '', quantity: 1, isStandardized: false });
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.justification || formData.items.length === 0) {
      alert('Preencha a justificativa e adicione pelo menos um item.');
      return;
    }

    setLoading(true);
    try {
      const orderPayload: Partial<PurchaseOrder> = {
        origin: 'MANUAL_REQUEST',
        requesterName: formData.requesterName,
        requesterRole: formData.requesterRole,
        costCenter: formData.costCenter,
        destinationLocation: formData.destinationLocation,
        urgencyLevel: formData.urgencyLevel,
        justification: formData.justification,
        items: formData.items,
        warehouse: 'ALMOXARIFADO CENTRAL', // Default, could be selectable
        category: 'MANUTENÇÃO (MRO)', // Default or inferred
        supplierName: 'A DEFINIR',
        description: `Solicitação de Compra - ${formData.costCenter}`,
        amount: 0,
        date: new Date().toISOString(),
        requesterId: currentUser?.id
      };

      await createOrder(orderPayload, null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Erro ao criar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-brand-900 text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2 rounded-lg">
              <Save size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Solicitação de Compras</h2>
              <p className="text-xs text-brand-400">Hospital São Francisco na Providência de Deus</p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-500 uppercase">Solicitante</label>
              <input 
                type="text" 
                value={formData.requesterName}
                onChange={e => setFormData({...formData, requesterName: e.target.value})}
                className="w-full p-2 border border-brand-200 rounded bg-brand-50 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-500 uppercase">Cargo</label>
              <input 
                type="text" 
                value={formData.requesterRole}
                onChange={e => setFormData({...formData, requesterRole: e.target.value})}
                className="w-full p-2 border border-brand-200 rounded focus:outline-none focus:border-brand-500"
                placeholder="Ex: Supervisor J3"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-500 uppercase">Departamento</label>
              <input 
                type="text" 
                value={formData.costCenter}
                onChange={e => setFormData({...formData, costCenter: e.target.value})}
                className="w-full p-2 border border-brand-200 rounded bg-brand-50 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-500 uppercase">Local de Destino</label>
              <input 
                type="text" 
                value={formData.destinationLocation}
                onChange={e => setFormData({...formData, destinationLocation: e.target.value})}
                className="w-full p-2 border border-brand-200 rounded focus:outline-none focus:border-brand-500"
                placeholder="Ex: CTI C"
              />
            </div>
          </div>

          {/* Urgency & Justification */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="md:col-span-1 space-y-2">
                <label className="text-xs font-semibold text-brand-500 uppercase block">Nível de Urgência</label>
                <div className="flex gap-2">
                  {[1, 2, 3].map(level => (
                    <button
                      key={level}
                      onClick={() => setFormData({...formData, urgencyLevel: level as 1|2|3})}
                      className={`flex-1 py-2 rounded border text-sm font-bold transition-all ${
                        formData.urgencyLevel === level 
                          ? (level === 3 ? 'bg-red-500 border-red-500 text-white' : level === 2 ? 'bg-amber-500 border-amber-500 text-white' : 'bg-brand-500 border-brand-500 text-white')
                          : 'bg-white border-brand-200 text-brand-500 hover:bg-brand-50'
                      }`}
                    >
                      Nível {level}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-brand-400">
                  {formData.urgencyLevel === 3 ? 'Crítico: Risco à vida ou parada total.' : formData.urgencyLevel === 2 ? 'Urgente: Risco de parada parcial.' : 'Normal: Reposição de estoque.'}
                </p>
             </div>
             <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-brand-500 uppercase">Justificativa</label>
                <textarea 
                  value={formData.justification}
                  onChange={e => setFormData({...formData, justification: e.target.value})}
                  className="w-full p-2 border border-brand-200 rounded h-24 resize-none focus:outline-none focus:border-brand-500"
                  placeholder="Descreva o motivo da solicitação..."
                />
             </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-xs font-semibold text-brand-500 uppercase">Itens da Solicitação</label>
            </div>
            
            <div className="border border-brand-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-brand-50 text-brand-500 font-medium border-b border-brand-200">
                  <tr>
                    <th className="p-3 w-16 text-center">#</th>
                    <th className="p-3">Descrição Detalhada</th>
                    <th className="p-3 w-32 text-center">Padronizado?</th>
                    <th className="p-3 w-24 text-center">Qtde.</th>
                    <th className="p-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {formData.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-brand-50">
                      <td className="p-3 text-center text-brand-400">{idx + 1}</td>
                      <td className="p-3 font-medium text-brand-700">{item.description}</td>
                      <td className="p-3 text-center">
                        {item.isStandardized ? <span className="text-brand-600 text-xs font-bold bg-brand-50 px-2 py-1 rounded">SIM</span> : <span className="text-brand-400 text-xs">NÃO</span>}
                      </td>
                      <td className="p-3 text-center font-mono">{item.quantity}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleRemoveItem(idx)} className="text-brand-400 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Add Row */}
                  <tr className="bg-brand-50/50">
                    <td className="p-3 text-center text-brand-300"><Plus size={16} className="mx-auto" /></td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        value={newItem.description}
                        onChange={e => setNewItem({...newItem, description: e.target.value})}
                        placeholder="Adicionar novo item..."
                        className="w-full bg-transparent border-b border-transparent focus:border-brand-500 focus:outline-none placeholder:text-brand-400"
                        onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={newItem.isStandardized}
                        onChange={e => setNewItem({...newItem, isStandardized: e.target.checked})}
                        className="accent-brand-600"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        min="1"
                        value={newItem.quantity}
                        onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                        className="w-full text-center bg-transparent border-b border-transparent focus:border-brand-500 focus:outline-none"
                        onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={handleAddItem}
                        disabled={!newItem.description}
                        className="text-brand-600 hover:text-brand-700 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-xs uppercase"
                      >
                        Adicionar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {formData.items.length === 0 && (
              <div className="text-center py-8 text-brand-400 text-sm border border-dashed border-brand-200 rounded-lg bg-brand-50">
                Nenhum item adicionado à solicitação.
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3 items-start">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-amber-800">
              <p className="font-bold mb-1">Importante:</p>
              <p>Ao enviar esta solicitação, ela será encaminhada imediatamente ao Almoxarifado para geração da SC no Protheus. Você será notificado via WhatsApp a cada mudança de status.</p>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="p-4 border-t border-brand-100 bg-brand-50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-brand-600 hover:bg-brand-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : (
              <>
                <Send size={16} />
                Enviar Solicitação
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default RequestFormModal;
