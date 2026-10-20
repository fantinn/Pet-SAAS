import { useAuth } from "./context/AuthProvider.jsx";
import { AppProvider } from "./context/AppProvider.jsx";
import Login from "./components/auth/Login.jsx";
import App from "./App.jsx";
import WorkspaceProvider from "./context/WorkspaceProvider.jsx";

export default function Root() {
  const { loading, user, recovery } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Carregando...
      </div>
    );
  }

  if (!user || recovery) return <Login />;

  return (
    <WorkspaceProvider key={user.id}><AppProvider>
      <App />
    </AppProvider></WorkspaceProvider>
  );
}
