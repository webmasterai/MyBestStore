export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <div
              className="text-2xl font-black tracking-tight text-white mb-6"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              My Best Store
            </div>
            <p className="text-slate-400 leading-relaxed max-w-xs">
              The premium e-commerce destination in Pakistan. Quality meets modern design for an effortless shopping experience.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <a
                className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 grid place-items-center hover:bg-brand-primary hover:border-brand-primary transition-all"
                href="https://mybeststore.pk/"
                target="_blank"
                rel="noreferrer"
                aria-label="Website"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" /><path d="M2 12h20" /><path d="M12 2c3 3.5 4.5 7 4.5 10S15 18.5 12 22" /><path d="M12 2C9 5.5 7.5 9 7.5 12S9 18.5 12 22" /></svg>
              </a>
              <a
                className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 grid place-items-center hover:bg-brand-primary hover:border-brand-primary transition-all"
                href="#"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z" /><path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M17.5 6.5h.01" /></svg>
              </a>
              <a
                className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 grid place-items-center hover:bg-brand-primary hover:border-brand-primary transition-all"
                href="#"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v3H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1Z" /></svg>
              </a>
            </div>
          </div>

          <div>
            <div className="text-sm font-black text-white uppercase tracking-widest mb-6">Company</div>
            <ul className="space-y-4">
              <li><a className="hover:text-brand-primary transition-colors" href="#">Our story</a></li>
              <li><a className="hover:text-brand-primary transition-colors" href="#">Sustainability</a></li>
              <li><a className="hover:text-brand-primary transition-colors" href="#">Contact</a></li>
              <li><a className="hover:text-brand-primary transition-colors" href="#">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-black text-white uppercase tracking-widest mb-6">Support</div>
            <ul className="space-y-4">
              <li><a className="hover:text-brand-primary transition-colors" href="#">Shipping Policy</a></li>
              <li><a className="hover:text-brand-primary transition-colors" href="#">Returns & Exchanges</a></li>
              <li><a className="hover:text-brand-primary transition-colors" href="#">FAQs</a></li>
              <li><a className="hover:text-brand-primary transition-colors" href="#">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-black text-white uppercase tracking-widest mb-6">Stay Updated</div>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="h-12 flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 text-sm text-white outline-none focus:border-brand-primary transition-all"
              />
              <button
                type="button"
                className="h-12 px-6 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary-deep transition-all shadow-lg shadow-brand-primary/20"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} My Best Store. All rights reserved.</div>
          <div className="flex gap-6">
            <a className="hover:text-white" href="#">Privacy</a>
            <a className="hover:text-white" href="#">Terms</a>
            <a className="hover:text-white" href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
