import { useState } from "react";
import {
  LayoutDashboard, Calendar, Users, ShoppingCart,
  Package, Wallet, BarChart3, Tag, Settings,
  CreditCard, UserCog, Shield, ChevronLeft, ChevronRight, LogOut, X
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

export default function Sidebar({ tab, setTab, menuAberto, onFecharMenu }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const inicial = (user?.email || "?").charAt(0).toUpperCase();

  // No celular o menu vira uma gaveta sobreposta: uma sidebar fixa de 256px
  // não deixa espaço de leitura numa tela de 375px.
  function selecionar(id) {
    setTab(id);
    onFecharMenu();
  }

  return (
    <>
      {menuAberto && (
        <div
          onClick={onFecharMenu}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`bg-white border-r flex flex-col shrink-0
          fixed inset-y-0 z-40 w-64 transition-[left] duration-300
          ${menuAberto ? "left-0" : "-left-64"}
          lg:sticky lg:top-0 lg:left-auto lg:h-screen
          ${isCollapsed ? "lg:w-16" : "lg:w-64"}`}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between shrink-0">
          <h1 className={`text-lg font-semibold ${isCollapsed ? "lg:hidden" : ""}`}>🐾 Petshop SaaS</h1>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden lg:block"
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button
            onClick={onFecharMenu}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            title="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-6 flex-1 overflow-y-auto">
          {MENU_ITEMS.map((section) => (
            <div key={section.category}>
              <p className={`text-xs font-semibold text-gray-500 mb-2 px-3 ${isCollapsed ? "lg:hidden" : ""}`}>
                {section.category}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = tab === item.id;
                  const isDisabled = ["estoque", "relatorios", "assinatura", "usuarios", "permissoes"].includes(item.id);

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => !isDisabled && selecionar(item.id)}
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
                        <Icon size={20} className="shrink-0" />
                        <span className={`text-sm ${isCollapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                        {isDisabled && (
                          <span className={`text-xs text-gray-400 ml-auto ${isCollapsed ? "lg:hidden" : ""}`}>
                            Em breve
                          </span>
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
        <div className="p-4 border-t bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {inicial}
            </div>
            <div className={`flex-1 min-w-0 ${isCollapsed ? "lg:hidden" : ""}`}>
              <p className="text-sm font-medium truncate" title={user?.email}>{user?.email}</p>
              <button onClick={signOut} className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1">
                <LogOut size={12} /> Sair
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
