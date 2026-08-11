import { MessageCircle } from "lucide-react";

export default function WhatsAppLink({ telefone }) {
  const digits = (telefone || "").replace(/\D/g, "");
  if (!digits) return null;
  
  const link = `https://wa.me/${digits.startsWith("55") ? digits : "55" + digits}`;
  
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="text-green-600 hover:text-green-700 flex items-center gap-1"
    >
      <MessageCircle size={14} />
      WhatsApp
    </a>
  );
}