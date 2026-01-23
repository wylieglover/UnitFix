export const Home = () => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-white to-gray-50 flex flex-col items-center">
      {/* decorative blob */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 blur-3xl">
        <div
          className="mx-auto h-80 max-w-2xl rotate-6 bg-gradient-to-tr from-blue-500/30 via-indigo-400/30 to-emerald-400/30 opacity-60"
          style={{
            clipPath:
              "polygon(0% 20%, 15% 0%, 60% 10%, 100% 0%, 85% 65%, 20% 100%, 0% 75%)",
          }}
        />
      </div>

      {/* nav */}
      <nav className="flex w-full max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-blue-600" />
          <span className="text-sm font-semibold tracking-tight">UnitFix</span>
        </div>
        <a
          href="/signin"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Sign in
        </a>
      </nav>

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
              href="/signin"
              className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Get started — it’s free
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center rounded-lg px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              See how it works
            </a>
          </div>

          <div className="mt-10 text-xs uppercase tracking-wide text-gray-500 opacity-60">
            Trusted by small to mid-size property teams
          </div>
        </div>

        {/* example card */}
        <div className="mt-12 w-full max-w-4xl rounded-xl border bg-white/60 p-2 shadow-sm backdrop-blur mx-auto">
          <div className="grid items-center gap-6 p-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4 text-left">
              <p className="text-xs font-semibold text-gray-500">Example SMS</p>
              <div className="mt-3 space-y-3 text-sm">
                <div className="w-fit rounded-2xl bg-gray-50 px-3 py-2 text-gray-800">
                  Hi, the sink is leaking in 2B.
                </div>
                <div className="w-fit rounded-2xl bg-gray-50 px-3 py-2 italic text-gray-500">
                  [Photo attached]
                </div>
                <div className="ml-auto w-fit rounded-2xl bg-blue-600 px-3 py-2 text-white">
                  Got it! We created ticket #102394. We’ll follow up shortly.
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
                <li>• One number per property</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="w-full max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Text & photo ingestion", "Media stored securely and attached automatically."],
            ["Automatic triage", "Priority and category inferred from content."],
            ["Per-org phone number", "Provision or swap numbers instantly."],
            ["Property matching", "Know the building and unit automatically."],
            ["Subdomain & SSO", "Google Sign-In with role-based access."],
            ["Built for speed", "Instant search, filters, mobile-ready."],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section id="how-it-works" className="w-full max-w-5xl px-6 py-12 text-center mx-auto">
        <h2 className="text-2xl font-bold text-gray-900">How it works</h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            ["1", "Create an organization", "Set up your company and assign an organization owner in UnitFix."],
            ["2", "Add properties", "Create your properties and add tenants to each unit."],
            ["3", "Invite staff and tenants", "Send invitations so staff and tenants can access their accounts."],
            ["3", "Connect numbers to properties", "Provision a Twilio number and link it to each property."],
            ["4", "Share the number", "Tenants can now text photos and messages directly to create tickets."]
          ].map(([step, title, desc]) => (
            <div
              key={step}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {step}
              </div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <a
            href="/signin"
            className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Get started
          </a>
        </div>
      </section>

      {/* footer */}
      <footer className="w-full max-w-7xl px-6 py-10 text-sm text-gray-500 mx-auto">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p>© {new Date().getFullYear()} UnitFix</p>
          <div className="flex gap-5">
            <a href="/privacy" className="hover:text-gray-700">Privacy</a>
            <a href="/terms" className="hover:text-gray-700">Terms</a>
            <a href="mailto:support@unitfix.app" className="hover:text-gray-700">Support</a>
          </div>
        </div>
      </footer>
    </main>
  );
};
