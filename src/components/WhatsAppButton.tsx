import { MessageCircle } from 'lucide-react';

const whatsappUrl = "https://wa.me/2347061145813?text=Hi%20Kreative%20Hub%2C%20I%27d%20like%20to%20enquire%20about%20a%20tattoo%20appointment.";

export default function WhatsAppButton() {
  return <a href={whatsappUrl} target="_blank" rel="noreferrer noopener" aria-label="Chat with Kreative Hub on WhatsApp" className="group fixed bottom-5 right-5 z-50 inline-flex items-center gap-3">
    <span className="pointer-events-none translate-x-2 border border-[#25D366] bg-[#0a0a0a] px-3 py-2 text-xs text-white opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100">Chat with Us</span>
    <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-black shadow-[0_0_0_8px_rgba(37,211,102,0.12)] transition duration-200 group-hover:scale-105"><span className="absolute inset-0 animate-ping rounded-full border border-[#25D366] opacity-30" /><MessageCircle className="relative h-7 w-7" fill="currentColor" /></span>
  </a>;
}
