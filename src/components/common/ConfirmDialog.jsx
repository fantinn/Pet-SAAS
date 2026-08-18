import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "./Button";

// Diálogo de confirmação usado antes de qualquer exclusão. Fecha no Esc e no
// clique fora, e já vem com o foco no botão de cancelar (opção segura).
export default function ConfirmDialog({
  aberto,
  titulo = "Confirmar ação",
  mensagem,
  detalhe,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  variante = "danger",
  onConfirmar,
  onCancelar,
}) {
  const cancelarRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    cancelarRef.current?.focus();
    const aoTeclar = (e) => {
      if (e.key === "Escape") onCancelar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, onCancelar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={onCancelar}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-titulo"
        className="w-full max-w-md bg-white rounded-xl shadow-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3">
          <div
            className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${
              variante === "danger" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0">
            <h3 id="confirm-titulo" className="font-semibold text-gray-900">
              {titulo}
            </h3>
            {mensagem && <p className="text-sm text-gray-600 mt-1">{mensagem}</p>}
            {detalhe && (
              <p className="text-xs text-gray-500 mt-2 bg-gray-50 border rounded-lg p-2">{detalhe}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            ref={cancelarRef}
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            {textoCancelar}
          </button>
          <Button onClick={onConfirmar} variant={variante}>
            {textoConfirmar}
          </Button>
        </div>
      </div>
    </div>
  );
}
