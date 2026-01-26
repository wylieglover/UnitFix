// src/pages/SignIn.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { authService } from "../features/auth/services/authService";

export const SignIn = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
        // Staff can access the properties list page
        redirectPath = `/organizations/${orgId}/properties`;
      } else {
        // Org owners/admins go to dashboard
        redirectPath = `/organizations/${orgId}/dashboard`;
      }
      
      // Use window.location.href for a full page reload
      window.location.href = redirectPath;
      
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.error ?? err.message ?? "Sign in failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12 px-6">
      <section className="w-full max-w-md">
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