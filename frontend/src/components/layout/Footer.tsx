export const Footer = () => {
  return (
    <footer className="w-full max-w-7xl px-6 py-10 text-sm text-gray-500 mx-auto">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p>© {new Date().getFullYear()} UnitFix</p>
        <div className="flex gap-5">
          <a href="/privacy" className="hover:text-gray-700 transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-gray-700 transition-colors">
            Terms
          </a>
          <a href="mailto:support@unitfix.app" className="hover:text-gray-700 transition-colors">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
};