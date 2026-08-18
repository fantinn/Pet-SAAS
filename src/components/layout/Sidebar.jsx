import { useState } from "react";
import {
  LayoutDashboard, Calendar, Users, Dog, ShoppingCart,
  Package, Wallet, BarChart3, Tag, Settings,
  CreditCard, UserCog, Shield, ChevronLeft, ChevronRight, X,
} from "lucide-react";

const MENU_ITEMS = [
  {
    category: "PRINCIPAL",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    category: "OPERAÇÃO",
    items: [
      { id: "agendamentos", label: "Agendamentos", icon: Calendar },
      { id: "clientes", label: "Clientes", icon: Users },
      { id: "pets", label: "Pets", icon: Dog },
      { id: "vendas", label: "Vendas", icon: ShoppingCart },
      { id: "estoque", label: "Estoque", icon: Package, emBreve: true },
    ],
  },
  {
    category: "GESTÃO",
    items: [
      { id: "financeiro", label: "Financeiro", icon: Wallet },
      { id: "relatorios", label: "Relatórios", icon: BarChart3, emBreve: true },
      { id: "planos", label: "Planos", icon: Tag },
    ],
  },
  {
    category: "SISTEMA",
    items: [
      { id: "settings", label: "Configurações", icon: Settings },
      { id: "assinatura", label: "Assinatura", icon: CreditCard, emBreve: true },
      { id: "usuarios", label: "Usuários", icon: UserCog, emBreve: true },
      { id: "permissoes", label: "Permissões", icon: Shield, emBreve: true },
    ],
  },
];

export default function Sidebar({ tab, setTab, menuAberto, fecharMenu }) {
  const [recolhida, setRecolhida] = useState(false);

  function selecionar(id) {
    setTab(id);
    fecharMenu();
  }

  return (
    <>
      {/* Fundo escuro só no mobile, quando o menu está aberto */}
      {menuAberto && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={fecharMenu}
          role="presentation"
        />
      )}

      <aside
        // `invisible` quando fechado tira o menu da ordem de tabulação e dos
        // leitores de tela — só deslocá-lo para fora da tela não faz isso.
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r transition-all duration-300
          lg:static lg:translate-x-0 lg:visible
          ${menuAberto ? "translate-x-0 visible" : "-translate-x-full invisible"}
          ${recolhida ? "lg:w-16" : "lg:w-64"} w-64`}
      >
        <div className="p-4 border-b flex items-center justify-between gap-2 shrink-0">
          {!recolhida && <h1 className="text-lg font-semibold whitespace-nowrap">🐾 Petshop SaaS</h1>}
          <button
            type="button"
            onClick={() => setRecolhida(!recolhida)}
            className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={recolhida ? "Expandir menu" : "Recolher menu"}
            aria-label={recolhida ? "Expandir menu" : "Recolher menu"}
          >
            {recolhida ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button
            type="button"
            onClick={fecharMenu}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {MENU_ITEMS.map((section) => (
            <div key={section.category}>
              {!recolhida && (
                <p className="text-xs font-semibold text-gray-400 mb-2 px-3">{section.category}</p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const ativo = tab === item.id;

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => !item.emBreve && selecionar(item.id)}
                        disabled={item.emBreve}
                        aria-current={ativo ? "page" : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            ativo
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : item.emBreve
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        title={recolhida ? item.label : undefined}
                      >
                        <Icon size={20} className="shrink-0" />
                        {!recolhida && <span className="text-sm truncate">{item.label}</span>}
                        {item.emBreve && !recolhida && (
                          <span className="text-[10px] text-gray-400 ml-auto shrink-0">Em breve</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              A
            </div>
            {!recolhida && (
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">Admin</p>
                <p className="text-xs text-gray-500 truncate">Administrador</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
