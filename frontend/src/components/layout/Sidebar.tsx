// src/components/layout/Sidebar.tsx
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useProperties } from "../../contexts/PropertiesContext";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  UserCircle, 
  Wrench, 
  Menu, 
  X,
  ChevronDown,
  Check
} from "lucide-react";

export const Sidebar = () => {
  const { organizationId, propertyId } = useParams<{ organizationId: string; propertyId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isStaff } = useAuth(); 
  const { properties } = useProperties();
  const [isOpen, setIsOpen] = useState(false);
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close property dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPropertyDropdownOpen(false);
      }
    };

    if (isPropertyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPropertyDropdownOpen]);

  const navItems = [
    {
      label: "Dashboard",
      path: `/organizations/${organizationId}/dashboard`,
      roles: ["org_owner", "org_admin"],
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: "Properties",
      path: `/organizations/${organizationId}/properties`,
      roles: ["org_owner", "org_admin", "staff"],
      icon: <Building2 size={20} />,
    },
    {
      label: "Staff",
      path: `/organizations/${organizationId}/staff`,
      roles: ["org_owner", "org_admin", "staff"], 
      icon: <Users size={20} />,
    },
    {
      label: "Tenants",
      path: `/organizations/${organizationId}/tenants`,
      roles: ["org_owner", "org_admin", "staff"],
      icon: <UserCircle size={20} />,
    },
    {
      label: "Tickets",
      path: `/organizations/${organizationId}/tickets`,
      roles: ["org_owner", "org_admin", "staff", "tenant"],
      icon: <Wrench size={20} />,
    },
  ];

  // Filter items based on user role
  const filteredItems = navItems.filter((item) => 
    !item.roles || (user && item.roles.includes(user.userType))
  );

  const isActive = (path: string) => location.pathname === path;

  const currentProperty = properties.find(p => p.id === propertyId);
  const showPropertySwitcher = isStaff && properties.length > 1;

  return (
    <>
      {/* Mobile Toggle FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-blue-600 p-4 text-white shadow-2xl lg:hidden active:scale-95 transition-transform"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm lg:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-[65px] left-0 z-40 h-[calc(100vh-65px)] w-64 border-r border-gray-100 bg-white/50 backdrop-blur-md transition-transform lg:sticky lg:translate-x-0
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        <div className="flex h-full flex-col p-4">
          {/* Property Switcher - Only for staff with multiple properties */}
          {showPropertySwitcher && (
            <div className="mb-4" ref={dropdownRef}>
              <button
                onClick={() => setIsPropertyDropdownOpen(!isPropertyDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 size={16} className="flex-shrink-0" />
                  <span className="truncate">
                    {currentProperty?.name || 'Select Property'}
                  </span>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`text-gray-400 transition-transform flex-shrink-0 ${isPropertyDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {isPropertyDropdownOpen && (
                <div className="absolute left-4 right-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-80 overflow-y-auto">
                  {properties.map((property) => (
                    <button
                      key={property.id}
                      onClick={() => {
                        navigate(`/organizations/${organizationId}/properties/${property.id}`);
                        setIsPropertyDropdownOpen(false);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                        property.id === propertyId
                          ? 'text-indigo-600 bg-indigo-50 font-semibold'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <span className="truncate">{property.name}</span>
                      {property.id === propertyId && <Check size={16} className="flex-shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1">
            {filteredItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all
                  ${isActive(item.path)
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm'}
                `}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};