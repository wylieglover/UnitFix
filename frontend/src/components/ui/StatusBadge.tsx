// src/components/ui/StatusBadge.tsx
import React from 'react';

type BadgeType = 'tenant' | 'ticket' | 'availability' | 'priority' | 'role';

interface StatusBadgeProps {
  type: BadgeType;
  value: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  const normalizedValue = value.toLowerCase().replace('_', ' ');

  const getStyles = () => {
    switch (type) {
      case 'role':
        if (normalizedValue === 'manager') return 'bg-purple-50 text-purple-700 border-purple-100';
        if (normalizedValue === 'member') return 'bg-blue-50 text-blue-700 border-blue-100';
        return 'bg-gray-50 text-gray-600 border-gray-100';
      
      case 'availability':
        if (normalizedValue === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (normalizedValue === 'archived') return 'bg-gray-100 text-gray-600 border-gray-200';
        return 'bg-gray-50 text-gray-600 border-gray-100';

      case 'tenant':
        if (normalizedValue === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (normalizedValue === 'pending') return 'bg-amber-50 text-amber-700 border-amber-100';
        return 'bg-gray-50 text-gray-600 border-gray-100';

      case 'priority':
        if (normalizedValue === 'urgent') return 'bg-red-50 text-red-700 border-red-100';
        if (normalizedValue === 'high') return 'bg-orange-50 text-orange-700 border-orange-100';
        if (normalizedValue === 'medium') return 'bg-blue-50 text-blue-700 border-blue-100';
        return 'bg-gray-50 text-gray-600 border-gray-100';

      case 'ticket':
        if (normalizedValue === 'open') return 'bg-blue-50 text-blue-700 border-blue-100';
        if (normalizedValue === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        return 'bg-amber-50 text-amber-700 border-amber-100';

      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStyles()}`}>
      {normalizedValue}
    </span>
  );
};