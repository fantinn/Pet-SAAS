import { createContext, useCallback, useContext, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";

const ConfirmacaoContext = createContext(null);

// Um único diálogo para o app inteiro: as telas só pedem a confirmação e
// recebem o callback de volta, sem repetir estado de modal em cada uma.
export function ConfirmacaoProvider({ children }) {
  const [pedido, setPedido] = useState(null);

  const pedirConfirmacao = useCallback((config) => setPedido(config), []);
  const cancelar = useCallback(() => setPedido(null), []);
  const confirmar = useCallback(() => {
    pedido?.aoConfirmar?.();
    setPedido(null);
  }, [pedido]);

  const value = useMemo(() => pedirConfirmacao, [pedirConfirmacao]);

  return (
    <ConfirmacaoContext.Provider value={value}>
      {children}
      <ConfirmDialog
        aberto={Boolean(pedido)}
        titulo={pedido?.titulo}
        mensagem={pedido?.mensagem}
        detalhe={pedido?.detalhe}
        textoConfirmar={pedido?.textoConfirmar}
        textoCancelar={pedido?.textoCancelar}
        variante={pedido?.variante}
        onConfirmar={confirmar}
        onCancelar={cancelar}
      />
    </ConfirmacaoContext.Provider>
  );
}

/**
 * Retorna a função que abre o diálogo:
 * pedirConfirmacao({ titulo, mensagem, detalhe, textoConfirmar, aoConfirmar })
 */
export function useConfirmacao() {
  const ctx = useContext(ConfirmacaoContext);
  if (!ctx) throw new Error("useConfirmacao precisa ser usado dentro de <ConfirmacaoProvider>");
  return ctx;
}
