import { useState } from "react";
import { Plus, Trash2, Edit2, Dog, User, Phone, Search, X, Check, ClipboardList } from "lucide-react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import EmptyState from "../../common/EmptyState";
import { ESPECIES } from "../../../data/constants";
import { mesmoId } from "../../../utils/id";
import { useConfirmacao } from "../../../hooks/useConfirmacao";

const SEM_ERROS = { nome: "", clienteId: "" };

function validar({ nome, clienteId }) {
  return {
    nome: nome.trim().length < 2 ? "Informe o nome do pet." : "",
    clienteId: clienteId ? "" : "Selecione o dono do pet.",
  };
}

const temErro = (erros) => Object.values(erros).some(Boolean);

const classeSelect = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function Pets({
  pets,
  clientes,
  agendamentos = [],
  buscaPet,
  setBuscaPet,
  novoPet,
  setNovoPet,
  addPet,
  delPet,
  petDetalheId,
  setPetDetalheId,
  atualizarObs,
  updatePet,
}) {
  const pedirConfirmacao = useConfirmacao();
  const [erros, setErros] = useState(SEM_ERROS);
  const [editandoId, setEditandoId] = useState(null);
  const [petEditando, setPetEditando] = useState({ nome: "", especie: "Cachorro", raca: "", clienteId: "" });
  const [errosEdicao, setErrosEdicao] = useState(SEM_ERROS);

  const busca = buscaPet.trim().toLowerCase();
  const petsFiltrados = pets.filter((p) => {
    const dono = clientes.find((c) => mesmoId(c.id, p.clienteId));
    return (
      p.nome.toLowerCase().includes(busca) ||
      (p.raca || "").toLowerCase().includes(busca) ||
      (dono?.nome || "").toLowerCase().includes(busca)
    );
  });

  const semClientes = clientes.length === 0;

  function submeterNovo() {
    const validacao = validar(novoPet);
    setErros(validacao);
    if (temErro(validacao)) return;
    addPet({ ...novoPet, nome: novoPet.nome.trim() });
    setErros(SEM_ERROS);
  }

  function iniciarEdicao(pet) {
    setEditandoId(pet.id);
    setPetEditando({
      nome: pet.nome,
      especie: pet.especie || ESPECIES[0],
      raca: pet.raca || "",
      clienteId: String(pet.clienteId ?? ""),
    });
    setErrosEdicao(SEM_ERROS);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setPetEditando({ nome: "", especie: "Cachorro", raca: "", clienteId: "" });
    setErrosEdicao(SEM_ERROS);
  }

  function salvarEdicao() {
    const validacao = validar(petEditando);
    setErrosEdicao(validacao);
    if (temErro(validacao)) return;
    updatePet(editandoId, { ...petEditando, nome: petEditando.nome.trim() });
    cancelarEdicao();
  }

  function confirmarExclusao(pet) {
    const vinculados = agendamentos.filter((a) => mesmoId(a.petId, pet.id));
    pedirConfirmacao({
      titulo: `Excluir ${pet.nome}?`,
      mensagem: "Esta ação não pode ser desfeita.",
      detalhe: vinculados.length
        ? `${vinculados.length} agendamento(s) deste pet também serão removidos.`
        : undefined,
      textoConfirmar: "Excluir pet",
      aoConfirmar: () => delPet(pet.id),
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Pets</h2>

      {/* Cadastro */}
      <div className="border rounded-xl p-4 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Novo pet</h3>
        {semClientes ? (
          <p className="text-sm text-gray-500">
            Cadastre um cliente antes: todo pet precisa de um dono.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input
                label="Nome"
                placeholder="Nome do pet"
                value={novoPet.nome}
                erro={erros.nome}
                onChange={(e) => setNovoPet({ ...novoPet, nome: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && submeterNovo()}
              />
              <Input label="Espécie">
                <select
                  value={novoPet.especie}
                  onChange={(e) => setNovoPet({ ...novoPet, especie: e.target.value })}
                  className={classeSelect}
                >
                  {ESPECIES.map((especie) => (
                    <option key={especie} value={especie}>
                      {especie}
                    </option>
                  ))}
                </select>
              </Input>
              <Input
                label="Raça"
                placeholder="Opcional"
                value={novoPet.raca}
                onChange={(e) => setNovoPet({ ...novoPet, raca: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && submeterNovo()}
              />
              <Input label="Dono" erro={erros.clienteId}>
                <select
                  value={novoPet.clienteId}
                  onChange={(e) => setNovoPet({ ...novoPet, clienteId: e.target.value })}
                  className={classeSelect}
                >
                  <option value="">Selecione o cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </Input>
            </div>
            <Button onClick={submeterNovo} className="mt-3 w-full sm:w-auto">
              <Plus size={16} /> Adicionar
            </Button>
          </>
        )}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Buscar por pet, raça ou dono..."
          value={buscaPet}
          onChange={(e) => setBuscaPet(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {petsFiltrados.map((pet) => {
          const dono = clientes.find((c) => mesmoId(c.id, pet.clienteId));
          const estaEditando = mesmoId(editandoId, pet.id);
          const mostrandoObs = mesmoId(petDetalheId, pet.id);

          return (
            <div key={pet.id} className="border rounded-xl overflow-hidden bg-white">
              <div className="p-4">
                {estaEditando ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Input
                        label="Nome"
                        value={petEditando.nome}
                        erro={errosEdicao.nome}
                        onChange={(e) => setPetEditando({ ...petEditando, nome: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && salvarEdicao()}
                      />
                      <Input label="Espécie">
                        <select
                          value={petEditando.especie}
                          onChange={(e) => setPetEditando({ ...petEditando, especie: e.target.value })}
                          className={classeSelect}
                        >
                          {ESPECIES.map((especie) => (
                            <option key={especie} value={especie}>
                              {especie}
                            </option>
                          ))}
                        </select>
                      </Input>
                      <Input
                        label="Raça"
                        value={petEditando.raca}
                        onChange={(e) => setPetEditando({ ...petEditando, raca: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && salvarEdicao()}
                      />
                      <Input label="Dono" erro={errosEdicao.clienteId}>
                        <select
                          value={petEditando.clienteId}
                          onChange={(e) => setPetEditando({ ...petEditando, clienteId: e.target.value })}
                          className={classeSelect}
                        >
                          <option value="">Selecione o cliente</option>
                          {clientes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nome}
                            </option>
                          ))}
                        </select>
                      </Input>
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
                        <Dog size={16} className="text-gray-400 shrink-0" />
                        <p className="font-medium truncate">{pet.nome}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {[pet.especie, pet.raca].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setPetDetalheId(mostrandoObs ? null : pet.id)}
                        variant="secondary"
                        size="sm"
                      >
                        <ClipboardList size={14} />
                        {mostrandoObs ? "Ocultar" : "Observações"}
                      </Button>
                      <Button
                        onClick={() => iniciarEdicao(pet)}
                        variant="secondary"
                        size="sm"
                        title="Editar pet"
                        aria-label={`Editar ${pet.nome}`}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        onClick={() => confirmarExclusao(pet)}
                        variant="danger"
                        size="sm"
                        title="Excluir pet"
                        aria-label={`Excluir ${pet.nome}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {!estaEditando && (
                <div className="px-4 py-3 bg-blue-50 border-t">
                  {dono ? (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-2 text-sm font-medium text-blue-800">
                        <User size={14} className="text-blue-600" /> {dono.nome}
                      </span>
                      {dono.telefone && (
                        <span className="flex items-center gap-2 text-xs text-blue-600">
                          <Phone size={12} /> {dono.telefone}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-blue-800">Dono não encontrado.</p>
                  )}
                </div>
              )}

              {mostrandoObs && !estaEditando && (
                <div className="px-4 py-3 bg-gray-50 border-t">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Observações (alergias, comportamento, preferências)
                  </label>
                  <textarea
                    value={pet.observacoes || ""}
                    onChange={(e) => atualizarObs(pet.id, e.target.value)}
                    placeholder="Ex.: alérgico a shampoo comum, não gosta de secador..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              )}
            </div>
          );
        })}

        {petsFiltrados.length === 0 && (
          <EmptyState
            icon={Dog}
            titulo={buscaPet ? "Nenhum pet encontrado" : "Nenhum pet cadastrado"}
            descricao={buscaPet ? "Tente buscar por outro nome, raça ou dono." : "Cadastre o primeiro pet acima."}
          />
        )}
      </div>
    </div>
  );
}
