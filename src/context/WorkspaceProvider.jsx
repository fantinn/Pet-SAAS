import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient.jsx";
import { useAuth } from "./AuthProvider.jsx";
import Button from "../components/common/Button.jsx";

const Context = createContext(null);
export const useWorkspace = () => useContext(Context);

export default function WorkspaceProvider({ children }) {
  const { signOut } = useAuth();
  const [workspace, setWorkspace] = useState(undefined);
  const [error, setError] = useState("");
  const [nome, setNome] = useState("");
  const [token, setToken] = useState(() => new URLSearchParams(window.location.search).get("convite") || "");
  const refresh = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("workspace");
      if (error) throw error;
      setWorkspace(data);
      setError("");
    } catch {
      setError("Não foi possível carregar seu petshop. Verifique a conexão e a aplicação das migrations.");
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  async function setup(invite) {
    try {
      const { error } = invite
        ? await supabase.rpc("aceitar_convite", { p_token: token.trim() })
        : await supabase.rpc("criar_petshop", { p_nome: nome.trim() });
      if (error) throw error;
      window.history.replaceState(null, "", window.location.pathname);
      await refresh();
    } catch (error) { setError(error.message); }
  }
  if (!workspace || workspace.acesso === "suspenso") return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white border rounded-xl p-6 space-y-4 max-w-lg w-full">
        <h1 className="text-2xl font-semibold">Seu petshop</h1>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {workspace === undefined ? <Button onClick={refresh}>Carregar petshop</Button> :
          workspace?.acesso === "suspenso" ? <p>O acesso deste petshop está suspenso. Entre em contato com o responsável pelo sistema.</p> :
          <>
            <label className="block">Nome do estabelecimento
              <input className="border rounded p-3 w-full mt-1" value={nome} maxLength={200} onChange={e => setNome(e.target.value)} />
            </label>
            <Button disabled={!nome.trim()} onClick={() => setup(false)}>Criar meu petshop</Button>
            <hr />
            <label className="block">Código de convite da equipe
              <input className="border rounded p-3 w-full mt-1" value={token} onChange={e => setToken(e.target.value)} />
            </label>
            <Button disabled={!token.trim()} onClick={() => setup(true)}>Aceitar convite</Button>
            <p className="text-sm text-gray-600">Use a conta com o mesmo e-mail confirmado do convite. Cada conta participa de um petshop.</p>
          </>}
        <Button variant="secondary" onClick={signOut}>Sair</Button>
      </div>
    </main>
  );
  return <Context.Provider value={{ workspace, refresh, manager: workspace.papel !== "atendente" }}>{children}</Context.Provider>;
}
