// src/components/layout/Navbar.tsx
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";
import { Link } from "react-router-dom";

export const Navbar = () => {
  const { isAuthenticated, loading, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link title="UnitFix Home" to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="h-7 w-7 rounded-md bg-blue-600 shadow-sm shadow-blue-200 flex items-center justify-center">
            {/* Minimalist Logo Icon */}
            <div className="h-3 w-3 border-2 border-white rounded-sm" />
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">UnitFix</span>
        </Link>

        {!loading && (
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={logout}>
                Log out
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/signin"
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Sign in
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};