import { useState } from "react";
import { useAuth } from "../../context/AuthProvider.jsx";
import Button from "../common/Button.jsx";

export default function Login() {
  const { signIn, signUp, authError } = useAuth();
  const [modo, setModo] = useState("entrar"); // "entrar" | "cadastrar"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [avisoCadastro, setAvisoCadastro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !senha) return;
    setCarregando(true);
    setAvisoCadastro("");

    if (modo === "entrar") {
      await signIn(email, senha);
    } else {
      const ok = await signUp(email, senha);
      if (ok) setAvisoCadastro("Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.");
    }

    setCarregando(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border rounded-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">🐾 Petshop SaaS</h1>
          <p className="text-sm text-gray-500 mt-1">
            {modo === "entrar" ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="voce@petshop.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="••••••••"
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>

          {authError && <p className="text-sm text-red-600">{authError}</p>}
          {avisoCadastro && <p className="text-sm text-green-600">{avisoCadastro}</p>}

          <Button type="submit" variant="primary" className="w-full justify-center" disabled={carregando}>
            {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <button
          onClick={() => {
            setModo(modo === "entrar" ? "cadastrar" : "entrar");
            setAvisoCadastro("");
          }}
          className="text-sm text-blue-600 hover:underline w-full text-center"
        >
          {modo === "entrar" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
