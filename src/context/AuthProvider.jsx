import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = ainda carregando
  const [authError, setAuthError] = useState("");
  const [recovery, setRecovery] = useState(() => new URLSearchParams(window.location.search).has("recovery"));

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      setSession(data?.session ?? null);
      if (error) setAuthError("Sessão indisponível. Entre novamente.");
    }).catch(() => { setSession(null); setAuthError("Não foi possível recuperar a sessão."); });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (_event === "PASSWORD_RECOVERY") setRecovery(true);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    return !error;
  }

  async function signUp(email, password) {
    setAuthError("");
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}` },
    });
    if (error) setAuthError(error.message);
    return !error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError("Não foi possível sair. Tente novamente.");
  }

  const value = {
    recovery,
    resetPassword: async (email) => {
      const redirectTo = `${window.location.origin}${window.location.pathname}?recovery=1`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
    },
    updatePassword: async (password) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setRecovery(false);
      window.history.replaceState(null, "", window.location.pathname);
    },
    session,
    user: session?.user ?? null,
    loading: session === undefined,
    authError,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa ser usado dentro de <AuthProvider>");
  return ctx;
}
