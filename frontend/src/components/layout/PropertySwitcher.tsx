// src/components/layout/PropertySwitcher.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProperties } from '../../contexts/PropertiesContext';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown, Building2, Check } from 'lucide-react';

export const PropertySwitcher = () => {
  const { organizationId, propertyId } = useParams();
  const { properties } = useProperties();
  const { isStaff } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Only show for staff with multiple properties
  if (!isStaff || properties.length <= 1) return null;

  const currentProperty = properties.find(p => p.id === propertyId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Building2 size={16} />
        <span className="max-w-[150px] truncate">
          {currentProperty?.name || 'Select Property'}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-80 overflow-y-auto">
          {properties.map((property) => (
            <button
              key={property.id}
              onClick={() => {
                navigate(`/organizations/${organizationId}/properties/${property.id}`);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                property.id === propertyId
                  ? 'text-indigo-600 bg-indigo-50 font-semibold'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <span>{property.name}</span>
              {property.id === propertyId && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};