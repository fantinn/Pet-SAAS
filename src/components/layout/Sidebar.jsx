import { useState } from "react";
import {
  LayoutDashboard, Calendar, Users, ShoppingCart,
  Package, Wallet, BarChart3, Tag, Settings,
  CreditCard, UserCog, Shield, ChevronLeft, ChevronRight, LogOut
} from "lucide-react";
import { useAuth } from "../../context/AuthProvider.jsx";

const MENU_ITEMS = [
  {
    category: "PRINCIPAL",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    category: "OPERAÇÃO",
    items: [
      { id: "agendamentos", label: "Agendamentos", icon: Calendar },
      { id: "clientes", label: "Clientes", icon: Users },
      { id: "vendas", label: "Vendas", icon: ShoppingCart },
      { id: "estoque", label: "Estoque", icon: Package },
    ],
  },
  {
    category: "GESTÃO",
    items: [
      { id: "financeiro", label: "Financeiro", icon: Wallet },
      { id: "relatorios", label: "Relatórios", icon: BarChart3 },
      { id: "planos", label: "Planos", icon: Tag },
    ],
  },
  {
    category: "SISTEMA",
    items: [
      { id: "settings", label: "Configurações", icon: Settings },
      { id: "assinatura", label: "Assinatura", icon: CreditCard },
      { id: "usuarios", label: "Usuários", icon: UserCog },
      { id: "permissoes", label: "Permissões", icon: Shield },
    ],
  },
];

export default function Sidebar({ tab, setTab }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const inicial = (user?.email || "?").charAt(0).toUpperCase();

  return (
    <aside 
      className={`bg-white border-r transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold">🐾 Petshop SaaS</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="p-4 space-y-6">
        {MENU_ITEMS.map((section) => (
          <div key={section.category}>
            {!isCollapsed && (
              <p className="text-xs font-semibold text-gray-500 mb-2 px-3">
                {section.category}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = tab === item.id;
                const isDisabled = ["estoque", "relatorios", "assinatura", "usuarios", "permissoes"].includes(item.id);

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => !isDisabled && setTab(item.id)}
                      disabled={isDisabled}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : isDisabled
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      title={isCollapsed ? item.label : ""}
                    >
                      <Icon size={20} />
                      {!isCollapsed && <span className="text-sm">{item.label}</span>}
                      {isDisabled && !isCollapsed && (
                        <span className="text-xs text-gray-400 ml-auto">Em breve</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {inicial}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" title={user?.email}>{user?.email}</p>
              <button onClick={signOut} className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1">
                <LogOut size={12} /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
