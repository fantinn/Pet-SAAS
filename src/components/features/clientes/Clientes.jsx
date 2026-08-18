import { useState } from "react";
import { Plus, Trash2, Edit2, Dog, Phone, User, Search, X, Check } from "lucide-react";
import WhatsAppLink from "../../common/WhatsAppLink";
import Button from "../../common/Button";
import Input from "../../common/Input";
import EmptyState from "../../common/EmptyState";
import { formatPhone, telefoneValido } from "../../../utils/format";
import { mesmoId } from "../../../utils/id";
import { useConfirmacao } from "../../../hooks/useConfirmacao";

const SEM_ERROS = { nome: "", telefone: "" };

function validar({ nome, telefone }) {
  return {
    nome: nome.trim().length < 2 ? "Informe o nome do cliente." : "",
    telefone: telefoneValido(telefone) ? "" : "Telefone incompleto (use DDD + número).",
  };
}

const temErro = (erros) => Object.values(erros).some(Boolean);

export default function Clientes({
  clientes,
  pets,
  agendamentos = [],
  buscaCliente,
  setBuscaCliente,
  novoCliente,
  setNovoCliente,
  addCliente,
  delCliente,
  updateCliente,
}) {
  const pedirConfirmacao = useConfirmacao();
  const [erros, setErros] = useState(SEM_ERROS);
  const [editandoId, setEditandoId] = useState(null);
  const [clienteEditando, setClienteEditando] = useState({ nome: "", telefone: "" });
  const [errosEdicao, setErrosEdicao] = useState(SEM_ERROS);

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(buscaCliente.trim().toLowerCase())
  );

  function submeterNovo() {
    const validacao = validar(novoCliente);
    setErros(validacao);
    if (temErro(validacao)) return;
    addCliente({ ...novoCliente, nome: novoCliente.nome.trim() });
    setErros(SEM_ERROS);
  }

  function iniciarEdicao(cliente) {
    setEditandoId(cliente.id);
    setClienteEditando({ nome: cliente.nome, telefone: cliente.telefone || "" });
    setErrosEdicao(SEM_ERROS);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setClienteEditando({ nome: "", telefone: "" });
    setErrosEdicao(SEM_ERROS);
  }

  function salvarEdicao() {
    const validacao = validar(clienteEditando);
    setErrosEdicao(validacao);
    if (temErro(validacao)) return;
    updateCliente(editandoId, { ...clienteEditando, nome: clienteEditando.nome.trim() });
    cancelarEdicao();
  }

  function confirmarExclusao(cliente) {
    const petsDoCliente = pets.filter((p) => mesmoId(p.clienteId, cliente.id));
    const agendamentosVinculados = agendamentos.filter((a) =>
      petsDoCliente.some((p) => mesmoId(p.id, a.petId))
    );

    const vinculos = [
      petsDoCliente.length && `${petsDoCliente.length} pet(s)`,
      agendamentosVinculados.length && `${agendamentosVinculados.length} agendamento(s)`,
    ].filter(Boolean);

    pedirConfirmacao({
      titulo: `Excluir ${cliente.nome}?`,
      mensagem: "Esta ação não pode ser desfeita.",
      detalhe: vinculos.length
        ? `Também serão removidos: ${vinculos.join(" e ")}. As vendas continuam no histórico financeiro.`
        : undefined,
      textoConfirmar: "Excluir cliente",
      aoConfirmar: () => delCliente(cliente.id),
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Clientes</h2>

      {/* Cadastro */}
      <div className="border rounded-xl p-4 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Novo cliente</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto] gap-3 lg:items-start">
          <Input
            label="Nome"
            placeholder="Nome do cliente"
            value={novoCliente.nome}
            erro={erros.nome}
            onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submeterNovo()}
          />
          <Input
            label="Telefone"
            placeholder="(00) 00000-0000"
            type="tel"
            inputMode="numeric"
            value={novoCliente.telefone}
            erro={erros.telefone}
            onChange={(e) => setNovoCliente({ ...novoCliente, telefone: formatPhone(e.target.value) })}
            onKeyDown={(e) => e.key === "Enter" && submeterNovo()}
          />
          <Button onClick={submeterNovo} className="w-full lg:w-auto lg:mt-5">
            <Plus size={16} /> Adicionar
          </Button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Buscar cliente..."
          value={buscaCliente}
          onChange={(e) => setBuscaCliente(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {clientesFiltrados.map((cliente) => {
          const petsDoCliente = pets.filter((p) => mesmoId(p.clienteId, cliente.id));
          const estaEditando = mesmoId(editandoId, cliente.id);

          return (
            <div key={cliente.id} className="border rounded-xl overflow-hidden bg-white">
              <div className="p-4">
                {estaEditando ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Nome"
                        value={clienteEditando.nome}
                        erro={errosEdicao.nome}
                        onChange={(e) => setClienteEditando({ ...clienteEditando, nome: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && salvarEdicao()}
                      />
                      <Input
                        label="Telefone"
                        type="tel"
                        inputMode="numeric"
                        value={clienteEditando.telefone}
                        erro={errosEdicao.telefone}
                        onChange={(e) =>
                          setClienteEditando({ ...clienteEditando, telefone: formatPhone(e.target.value) })
                        }
                        onKeyDown={(e) => e.key === "Enter" && salvarEdicao()}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={salvarEdicao} variant="success" size="sm">
                        <Check size={14} /> Salvar
                      </Button>
                      <Button onClick={cancelarEdicao} variant="secondary" size="sm">
                        <X size={14} /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User size={16} className="text-gray-400 shrink-0" />
                        <p className="font-medium truncate">{cliente.nome}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400 shrink-0" />
                        <p className="text-sm text-gray-500">{cliente.telefone || "Sem telefone"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <WhatsAppLink telefone={cliente.telefone} />
                      <Button
                        onClick={() => iniciarEdicao(cliente)}
                        variant="secondary"
                        size="sm"
                        title="Editar cliente"
                        aria-label={`Editar ${cliente.nome}`}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        onClick={() => confirmarExclusao(cliente)}
                        variant="danger"
                        size="sm"
                        title="Excluir cliente"
                        aria-label={`Excluir ${cliente.nome}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {petsDoCliente.length > 0 && !estaEditando && (
                <div className="px-4 py-3 bg-gray-50 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Dog size={16} className="text-gray-400" />
                    <p className="text-sm font-medium text-gray-600">
                      {petsDoCliente.length} {petsDoCliente.length === 1 ? "pet" : "pets"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {petsDoCliente.map((pet) => (
                      <span key={pet.id} className="px-3 py-1 bg-white border rounded-full text-sm">
                        {pet.nome} · {pet.especie}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {clientesFiltrados.length === 0 && (
          <EmptyState
            icon={User}
            titulo={buscaCliente ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            descricao={
              buscaCliente ? "Tente buscar por outro nome." : "Cadastre o primeiro cliente no formulário acima."
            }
          />
        )}
      </div>
    </div>
  );
}
