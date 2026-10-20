import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthProvider.jsx";
import Button from "../common/Button.jsx";

export default function Login() {
  const { signIn, signUp, resetPassword, updatePassword, recovery, user, authError } = useAuth();
  const [modo, setModo] = useState(recovery ? "redefinir" : "entrar");
  useEffect(() => { if (recovery) setModo("redefinir"); }, [recovery]);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");
  const titulos = { entrar: "Entre na sua conta", cadastrar: "Crie sua conta", recuperar: "Recupere seu acesso", redefinir: "Defina sua nova senha" };
  async function submit(e) {
    e.preventDefault();
    if (carregando) return;
    setCarregando(true); setAviso(""); setErro("");
    try {
      if (modo === "recuperar") {
        await resetPassword(email.trim());
        setAviso("Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha.");
      } else if (modo === "redefinir") {
        if (!user) throw new Error("Link inválido ou expirado. Solicite um novo link.");
        if (senha !== confirmacao) throw new Error("As senhas não coincidem.");
        await updatePassword(senha);
      } else if (modo === "entrar") await signIn(email.trim(), senha);
      else if (await signUp(email.trim(), senha)) setAviso("Cadastro solicitado. Verifique seu e-mail para confirmar a conta.");
    } catch (error) { setErro(error.message || "Não foi possível conectar. Tente novamente."); }
    finally { setCarregando(false); }
  }
  function change(next) { setModo(next); setSenha(""); setConfirmacao(""); setErro(""); setAviso(""); }
  return <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="w-full max-w-sm bg-white border rounded-xl p-8 space-y-6">
      <h1 className="text-2xl font-semibold">🐾 Petshop SaaS</h1>
      <h2>{titulos[modo]}</h2>
      <form onSubmit={submit} className="space-y-4">
        {modo !== "redefinir" && <label className="block">E-mail
          <input type="email" className="w-full p-3 border rounded mt-1" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
        </label>}
        {modo !== "recuperar" && <label className="block">{modo === "redefinir" ? "Nova senha" : "Senha"}
          <input type="password" className="w-full p-3 border rounded mt-1" value={senha} onChange={e => setSenha(e.target.value)}
            minLength={modo === "entrar" ? 1 : 10} autoComplete={modo === "entrar" ? "current-password" : "new-password"} required />
        </label>}
        {modo === "redefinir" && <label className="block">Confirme a nova senha
          <input type="password" className="w-full p-3 border rounded mt-1" value={confirmacao} onChange={e => setConfirmacao(e.target.value)} autoComplete="new-password" required />
        </label>}
        {(erro || authError) && <p role="alert" className="text-red-700 text-sm">{erro || authError}</p>}
        {aviso && <p role="status" className="text-green-700 text-sm">{aviso}</p>}
        <Button type="submit" disabled={carregando} className="w-full">
          {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : modo === "cadastrar" ? "Criar conta" : modo === "recuperar" ? "Enviar link" : "Salvar nova senha"}
        </Button>
      </form>
      <div className="flex flex-col gap-3">
        <button className="text-blue-700 text-sm" onClick={() => change(modo === "entrar" ? "cadastrar" : "entrar")}>
          {modo === "entrar" ? "Criar uma conta" : "Voltar ao login"}
        </button>
        <button className="text-blue-700 text-sm" onClick={() => change("recuperar")}>Esqueci minha senha</button>
      </div>
    </div>
  </main>;
}
