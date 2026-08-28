import { useAuth } from "./context/AuthProvider.jsx";
import { AppProvider } from "./context/AppProvider.jsx";
import Login from "./components/auth/Login.jsx";
import App from "./App.jsx";

export default function Root() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Carregando...
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
