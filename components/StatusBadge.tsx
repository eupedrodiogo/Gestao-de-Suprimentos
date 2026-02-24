
import React from 'react';
import { OrderStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyles = (s: OrderStatus) => {
    switch (s) {
      case OrderStatus.APPROVED:
        return 'bg-brand-100 text-brand-700 border-brand-200';
      case OrderStatus.PENDING_ALMOXARIFADO:
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case OrderStatus.SC_CREATED:
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case OrderStatus.QUOTATION_PROCESS:
        return 'bg-violet-100 text-violet-700 border-violet-200';
      case OrderStatus.WAITING_HQ_APPROVAL:
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case OrderStatus.PURCHASING:
        return 'bg-brand-100 text-brand-700 border-brand-200';
      case OrderStatus.AWAITING_DELIVERY:
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case OrderStatus.AVAILABLE_FOR_PICKUP:
        return 'bg-lime-100 text-lime-700 border-lime-200';
      case OrderStatus.COMPLETED:
      case OrderStatus.RECEIVED:
        return 'bg-brand-100 text-brand-700 border-brand-200';
      case OrderStatus.REQUESTED:
        return 'bg-brand-50 text-brand-600 border-brand-100';
      case OrderStatus.REJECTED:
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStyles(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
