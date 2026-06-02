"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "./SiteFooter";
import SiteNavbar from "./SiteNavbar";

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const isAppShell = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");

  return (
    <>
      {!isAppShell && <SiteNavbar />}
      {children}
      {!isAppShell && <SiteFooter />}

      {/* Floating WhatsApp Support Button */}
      {!isAppShell && (
        <a
          href="https://wa.me/919876543210?text=Hello!%20I%20have%20a%20question%20about%20Nexus%20Capital."
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_4px_24px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(37,211,102,0.6)] group"
          aria-label="Contact us on WhatsApp"
        >
          {/* Ripple Pulse Effect */}
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25d366] opacity-35"></span>

          {/* WhatsApp SVG path */}
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.528 2.012 14.077.99 11.474.99 6.037.99 1.612 5.36 1.608 10.79c-.001 1.682.449 3.32 1.302 4.737L1.864 21.03l5.093-1.334zM18.09 15.39c-.299-.15-1.77-.874-2.046-.975-.276-.102-.477-.152-.676.152-.199.303-.769.975-.943 1.177-.174.202-.347.227-.646.077-2.993-1.498-4.93-3.076-5.87-4.693-.248-.426-.025-.658.19-.872.193-.193.428-.499.642-.749.215-.25.286-.425.429-.708.143-.282.072-.53-.036-.73-.107-.2-.943-2.27-1.293-3.116-.34-.824-.687-.712-.943-.725-.246-.013-.529-.015-.813-.015-.284 0-.745.106-1.133.53-.388.425-1.482 1.45-1.482 3.535 0 2.085 1.517 4.09 1.728 4.375.212.285 2.986 4.56 7.234 6.39 1.01.436 1.798.696 2.414.892.98.311 1.872.268 2.576.162.784-.117 2.42-.99 2.76-1.944.339-.955.339-1.77.239-1.945-.1-.175-.37-.275-.668-.425z" />
          </svg>

          {/* Hover Tooltip */}
          <span className="absolute right-16 scale-0 rounded-lg bg-slate-900 border border-white/10 px-3 py-1.5 text-xs font-bold text-white shadow-xl transition-all duration-200 group-hover:scale-100 whitespace-nowrap">
            Chat with us!
          </span>
        </a>
      )}
    </>
  );
}
