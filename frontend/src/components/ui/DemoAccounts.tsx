// src/components/DemoAccounts.tsx
import { Card } from "./Card";
import { Users, UserCircle } from "lucide-react";

interface DemoAccount {
  name: string;
  email: string;
  password: string;
  role: string;
  description: string;
}

const demoAccounts: DemoAccount[] = [
  {
    name: "Demo Account",
    email: "demo@unitfix.com",
    password: "Demo123!",
    role: "Organization Owner",
    description: "Full access to dashboard, properties, and settings"
  },
  {
    name: "John Smith",
    email: "john@unitfix.com",
    password: "Demo123!",
    role: "Staff Manager",
    description: "Manage maintenance requests and assign tasks"
  },
  {
    name: "Sarah Johnson",
    email: "sarah@unitfix.com",
    password: "Demo123!",
    role: "Staff Member",
    description: "View and update assigned maintenance tickets"
  },
  {
    name: "Maria Garcia",
    email: "maria@unitfix.com",
    password: "Demo123!",
    role: "Tenant",
    description: "Submit and track maintenance requests"
  }
];

interface DemoAccountsProps {
  onSelectAccount?: (email: string, password: string) => void;
  onViewAll?: () => void;
  compact?: boolean;
}

export const DemoAccounts = ({ onSelectAccount, onViewAll, compact = false }: DemoAccountsProps) => {
  if (compact) {
    return (
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-900">Try our demo accounts</p>
            <p className="text-xs text-blue-700 mt-0.5">
              No signup required. Explore UnitFix with pre-loaded demo data.{" "}
              <button 
                onClick={onViewAll}
                className="underline font-medium hover:text-blue-800"
              >
                View all accounts
              </button>
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Try Demo Accounts</h3>
        <p className="text-sm text-gray-600 mt-1">
          No signup required. Click any account to auto-fill credentials.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {demoAccounts.map((account) => (
          <Card
            key={account.email}
            className="p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all active:scale-[0.98]"
            onClick={() => onSelectAccount?.(account.email, account.password)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{account.name}</p>
                <p className="text-xs text-blue-600 font-medium">{account.role}</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{account.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-center text-gray-500">
        All demo accounts use password: <code className="bg-gray-100 px-2 py-0.5 rounded">Demo123!</code>
      </p>
    </div>
  );
};