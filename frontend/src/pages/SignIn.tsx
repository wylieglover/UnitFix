// src/pages/SignIn.tsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DemoAccounts } from "../components/ui/DemoAccounts";
import { authService } from "../features/auth/services/authService";
import { Info } from "lucide-react";

export const SignIn = () => {
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Auto-fill if coming from home page with credentials
  useEffect(() => {
    if (location.state?.email && location.state?.password) {
      setForm({
        email: location.state.email,
        password: location.state.password
      });
      // Optionally clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectDemoAccount = (email: string, password: string) => {
    setForm({ email, password });
    setError(null);
    setShowDemoAccounts(false); // Collapse after selection
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { user, organization, property, properties } = await authService.login(form);
      
      if (!organization) {
        throw new Error("Organization information missing from login response");
      }

      const orgId = organization.id;

      // Determine redirect path based on user type
      let redirectPath: string;
      
      if (user.userType === 'tenant' && property) {
        redirectPath = `/organizations/${orgId}/tickets`;
      } else if (user.userType === 'staff' && properties && properties.length > 0) {
        redirectPath = `/organizations/${orgId}/properties`;
      } else {
        redirectPath = `/organizations/${orgId}/dashboard`;
      }
      
      window.location.href = redirectPath;
      
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.error ?? err.message ?? "Sign in failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12 px-6">
      <section className="w-full max-w-md space-y-6">
        {/* Demo accounts - toggleable */}
        {!showDemoAccounts ? (
          <DemoAccounts 
            compact 
            onSelectAccount={handleSelectDemoAccount}
            onViewAll={() => setShowDemoAccounts(true)}
          />
        ) : (
          <Card className="p-6 border-blue-200 bg-blue-50">
            <DemoAccounts onSelectAccount={handleSelectDemoAccount} />
            <button
              onClick={() => setShowDemoAccounts(false)}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium underline-offset-4 hover:underline"
            >
              Hide demo accounts
            </button>
          </Card>
        )}

        <Card className="p-8 shadow-xl border-gray-100">
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to manage your units</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Input 
              name="email" 
              type="email" 
              value={form.email}
              onChange={onChange} 
              label="Email"
              placeholder="you@example.com" 
              required
            />
            
            <Input 
              name="password" 
              type="password" 
              value={form.password}
              onChange={onChange} 
              label="Password"
              placeholder="••••••••" 
              required
            />

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              variant="primary"
              className="w-full py-6 text-base"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            {/* Server startup notice */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                The server may take up to 50 seconds to wake up from idle. Please be patient!
              </p>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </Card>
      </section>
    </div>
  );
};