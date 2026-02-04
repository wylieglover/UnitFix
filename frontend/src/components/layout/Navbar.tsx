// src/components/layout/Navbar.tsx
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";
import { Link } from "react-router-dom";
import { Home, Wrench } from "lucide-react"; // Optional: adding an icon for visual flair

export const Navbar = () => {
  const { isAuthenticated, user, loading, logout } = useAuth();

  // Helper to determine the routing logic based on user role
  const getHomeRoute = () => {
    if (!user || !user.organizationId) return "/";

    const orgId = user.organizationId;

    switch (user.userType) {
      case "org_admin":
      case "org_owner":
        return `/organizations/${orgId}/dashboard`;
      case "staff":
        return `/organizations/${orgId}/properties`;
      case "tenant":
        return `/organizations/${orgId}/tickets`;
      default:
        return "/";
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link title="UnitFix Home" to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="h-7 w-7 rounded-md bg-blue-600 shadow-sm shadow-blue-200 flex items-center justify-center">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">UnitFix</span>
        </Link>

        {!loading && (
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* New Dynamic Home Button */}
                <Link to={getHomeRoute()}>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600">
                    <Home size={16} />
                    <span>Home</span>
                  </Button>
                </Link>

                <div className="h-4 w-[1px] bg-gray-200 mx-1" /> {/* Subtle separator */}

                <Button variant="outline" size="sm" onClick={logout}>
                  Log out
                </Button>
              </div>
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
                    Request Access
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