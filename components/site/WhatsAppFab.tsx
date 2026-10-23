"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { whatsappLink } from "@/lib/site";

/** Botão flutuante de WhatsApp: surge depois de rolar a página. */
export default function WhatsAppFab() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const on = () => setShow(window.scrollY > 520);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.a
          key="fab"
          href={whatsappLink("Olá! Vim pelo site e gostaria de agendar uma consulta 😊")}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar pelo WhatsApp"
          className="no-print group fixed bottom-5 right-5 z-40 flex items-center gap-3 sm:bottom-7 sm:right-7"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <span className="pointer-events-none hidden translate-x-2 rounded-full bg-navy-900 px-4 py-2 text-sm text-ivory-50 opacity-0 shadow-xl transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block">
            Fale com a Dra.
          </span>
          <span className="relative grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_12px_30px_-8px_rgba(37,211,102,0.7)] transition-transform duration-300 group-hover:scale-110">
            <span className="absolute inset-0 animate-ping-soft rounded-full bg-[#25d366]" />
            <WhatsAppIcon className="relative h-7 w-7" />
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
