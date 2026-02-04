// src/pages/SignUp.tsx
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Mail } from "lucide-react";

export const SignUp = () => {
  const navigate = useNavigate();

  const handleDemoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/');
    // Small delay to let the page load, then scroll
    setTimeout(() => {
      const demoSection = document.getElementById('demo');
      if (demoSection) {
        demoSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12 px-6">
      <section className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Join{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              UnitFix
            </span>
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Currently invite-only. Get in touch to request access.
          </p>
        </div>

        <Card className="p-8 shadow-xl border-gray-100">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Request Access
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                UnitFix is currently available by invitation only. Contact us to learn more about how we can help streamline your property maintenance.
              </p>
            </div>

            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=unitfixbusiness@gmail.com&su=UnitFix%20Access%20Request"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-95"
            >
              <Mail className="w-4 h-4" />
              Contact Us
            </a>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Want to try it first?{" "}
                <a 
                  href="/#demo" 
                  onClick={handleDemoClick}
                  className="font-semibold text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline cursor-pointer"
                >
                  Check out our demo accounts
                </a>
              </p>
            </div>
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/signin" className="font-semibold text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </div>
  );
};