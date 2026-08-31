import { MessageCircle } from "lucide-react";
import { linkWhatsapp } from "../../utils/format";

export default function WhatsAppLink({ telefone, mensagem, children }) {
  const link = linkWhatsapp(telefone, mensagem);
  if (!link) return null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="text-green-600 hover:text-green-700 flex items-center gap-1"
    >
      <MessageCircle size={14} />
      {children || "WhatsApp"}
    </a>
  );
}