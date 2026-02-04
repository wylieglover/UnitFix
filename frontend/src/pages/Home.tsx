// src/pages/Home.tsx
import { DemoAccounts } from "../components/ui/DemoAccounts";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const navigate = useNavigate();

  const handleSelectDemoAccount = (email: string, password: string) => {
    // Navigate to login with state to auto-fill
    navigate('/signin', { state: { email, password } });
  };

  return (
    <div className="flex flex-col items-center">
      {/* hero */}
      <section className="w-full max-w-5xl px-6 pb-16 pt-8 text-center sm:pt-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Tenants text a photo.{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              You get a ticket.
            </span>
          </h1>

          <p className="mt-5 text-base text-gray-600 sm:text-lg">
            Stop chasing voicemails and emails. Give each property manager a
            dedicated number. We parse photos and messages into prioritized
            maintenance tickets—automatically.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/signup"
              className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-95"
            >
              Request access
            </a>
            <a
              href="#demo"
              className="inline-flex items-center rounded-lg px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Try the demo
            </a>
          </div>

          <div className="mt-10 text-xs uppercase tracking-wide text-gray-500 opacity-60">
            Trusted by small to mid-size property teams
          </div>
        </div>

        {/* example card */}
        <div className="mt-12 w-full max-w-4xl rounded-xl border border-gray-100 bg-white/60 p-2 shadow-sm backdrop-blur-md mx-auto">
          <div className="grid items-center gap-6 p-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-100 bg-white/50 p-4 text-left">
              <p className="text-xs font-semibold text-gray-500">Example SMS</p>
              <div className="mt-3 space-y-3 text-sm">
                <div className="w-fit rounded-2xl bg-gray-100 px-3 py-2 text-gray-800">
                  Hi, the sink is leaking in 2B.
                </div>
                <div className="w-fit rounded-2xl bg-gray-100 px-3 py-2 italic text-gray-500">
                  [Photo attached]
                </div>
                <div className="ml-auto w-fit rounded-2xl bg-blue-600 px-3 py-2 text-white shadow-sm">
                  Got it! We created ticket #102394.
                </div>
              </div>
            </div>

            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">
                Why text-first?
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>• Faster than portals or email</li>
                <li>• Photos auto-attached to tickets</li>
                <li>• One number per organization</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* demo section */}
      <section id="demo" className="w-full max-w-5xl px-6 py-16 bg-gradient-to-b from-blue-50/50 to-transparent">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Try UnitFix{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Right Now
            </span>
          </h2>
          <p className="mt-3 text-base text-gray-600">
            No signup required. Click any demo account below to explore the platform.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <DemoAccounts onSelectAccount={handleSelectDemoAccount} />
        </div>
      </section>

      {/* features */}
      <section className="w-full max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Text-to-ticket", "Tenants text issues, tickets auto-created."],
            ["Staff collaboration", "Assign, merge, and track tickets seamlessly."],
            ["Per-org phone number", "Provision or swap numbers instantly."],
            ["Property matching", "Know the unit automatically."],
            ["Role-based access", "Different views for owners, staff, and tenants."],
            ["Built for speed", "Instant search, filters, mobile-ready."],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-xl border border-gray-100 bg-white/70 p-6 shadow-sm backdrop-blur-sm flex flex-col">
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600 flex-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section
        id="how-it-works"
        className="w-full max-w-5xl px-6 py-12 text-center mx-auto"
      >
        <h2 className="text-2xl font-bold text-gray-900">How it works</h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            ["1", "Create organization", "Set up your company and assign an owner."],
            ["2", "Provision number", "Get a dedicated phone number for tenants."],
            ["3", "Add properties", "Create properties to manage across your portfolio."],
            ["4", "Invite staff", "Add maintenance team with role-based access."],
            ["5", "Invite tenants", "Tenants get access to their specific units."],
            ["6", "Start receiving", "Tenants text issues, tickets auto-created."],
          ].map(([step, title, desc]) => (
            <div key={step} className="rounded-xl border border-gray-100 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
              <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-100">
                {step}
              </div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <a
            href="/signup"
            className="inline-flex items-center rounded-lg bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            Request access today
          </a>
        </div>
      </section>
    </div>
  );
};