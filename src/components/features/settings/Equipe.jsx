import { useEffect, useState } from "react";
import { supabase } from "../../../services/supabaseClient.jsx";
import { useWorkspace } from "../../../context/WorkspaceProvider.jsx";
import Button from "../../common/Button.jsx";

export default function Equipe() {
  const { workspace } = useWorkspace();
  const [membros, setMembros] = useState([]);
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState("atendente");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  async function load() {
    const { data, error } = await supabase.from("membros").select("*").order("papel");
    if (error) setError("Não foi possível carregar a equipe.");
    else setMembros(data);
  }
  useEffect(() => { load().catch(() => setError("Sem conexão.")); }, []);
  async function invite() {
    setError(""); setLink("");
    try {
      const { data, error } = await supabase.rpc("convidar", { p_email: email, p_papel: papel });
      if (error) throw error;
      setLink(`${window.location.origin}${window.location.pathname}?convite=${data}`);
    } catch (e) { setError(e.message); }
  }
  async function remove(userId) {
    if (!window.confirm("Remover o acesso deste membro?")) return;
    try {
      const { error } = await supabase.rpc("remover_membro", { p_user: userId });
      if (error) throw error;
      await load();
    } catch (e) { setError(e.message); }
  }
  return <section className="space-y-4 max-w-2xl">
    <h2 className="text-xl font-semibold">Equipe e permissões</h2>
    <p>{workspace.nome} · {membros.length}/{workspace.limite_membros} membros</p>
    <p className="text-sm text-gray-600">Atendentes cuidam de clientes, pets, agenda e vendas. Administradores também gerenciam estoque, financeiro e configurações. Apenas o proprietário remove membros e convida administradores.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <label className="block">E-mail do convidado<input type="email" className="border p-2 rounded w-full" value={email} onChange={e => setEmail(e.target.value)} /></label>
    <label className="block">Permissão<select className="border p-2 rounded w-full" value={papel} onChange={e => setPapel(e.target.value)}>
      <option value="atendente">Atendente</option>
      {workspace.papel === "proprietario" && <option value="administrador">Administrador</option>}
    </select></label>
    <Button onClick={invite} disabled={!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)}>Gerar convite</Button>
    {link && <div role="status" className="bg-blue-50 p-4 rounded">
      <p>Compartilhe este link com {email}. Expira em 7 dias. Nenhum e-mail foi enviado.</p>
      <input aria-label="Link do convite" className="w-full border p-2 mt-2" readOnly value={link} onFocus={e => e.target.select()} />
    </div>}
    <ul className="space-y-2">{membros.map(m => <li key={m.user_id} className="border rounded p-3 flex flex-wrap gap-3 items-center justify-between">
      <span className="break-all text-sm">{m.papel} · {m.user_id}</span>
      {workspace.papel === "proprietario" && m.papel !== "proprietario" && <Button variant="danger" onClick={() => remove(m.user_id)}>Remover acesso</Button>}
    </li>)}</ul>
  </section>;
}
