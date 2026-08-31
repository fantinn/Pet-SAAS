import { Plus, Trash2, MessageCircle, Edit2, Dog, Phone, User, ChevronDown, ChevronUp, CalendarClock } from "lucide-react";
import WhatsAppLink from "../../common/WhatsAppLink";
import Button from "../../common/Button";
import { useState } from "react";
import { formatDataBR, formatDiaMes } from "../../../utils/format";

const PET_VAZIO = { nome: "", especie: "Cachorro", raca: "" };

const EMOJI_ESPECIE = { Cachorro: "🐶", Gato: "🐱", Outro: "🐾" };

const plural = (n, singular, pluralForma) => `${n} ${n === 1 ? singular : pluralForma}`;

export default function Clientes({
  clientes,
  pets,
  agendamentos,
  hojeStr,
  buscaCliente,
  setBuscaCliente,
  novoCliente,
  setNovoCliente,
  addCliente,
  delCliente,
  updateCliente,
  addPet,
  delPet,
  updatePet,
  atualizarObs,
}) {
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [clienteEditando, setClienteEditando] = useState({ nome: "", telefone: "" });

  const [expandidoId, setExpandidoId] = useState(null);
  const [novoPet, setNovoPet] = useState(PET_VAZIO);

  const [editandoPetId, setEditandoPetId] = useState(null);
  const [petEditando, setPetEditando] = useState(PET_VAZIO);
  const [petDetalheId, setPetDetalheId] = useState(null);

  // Observações ficam em rascunho local enquanto se digita: gravar a cada tecla
  // dispara um UPDATE por caractere e faz o campo travar esperando o servidor.
  const [obsRascunho, setObsRascunho] = useState({});
  const [obsSalva, setObsSalva] = useState(null);

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(buscaCliente.toLowerCase())
  );

  function textoObs(pet) {
    return obsRascunho[pet.id] ?? pet.observacoes ?? "";
  }

  function salvarObs(pet) {
    const rascunho = obsRascunho[pet.id];
    setObsRascunho((r) => {
      const { [pet.id]: _, ...resto } = r;
      return resto;
    });
    if (rascunho === undefined || rascunho === (pet.observacoes ?? "")) return;
    atualizarObs(pet.id, rascunho);
    setObsSalva(pet.id);
    setTimeout(() => setObsSalva((atual) => (atual === pet.id ? null : atual)), 2000);
  }

  // Os agendamentos já chegam ordenados por data e hora.
  function proximoDoCliente(clienteId) {
    const idsPets = new Set(getPetsDoCliente(clienteId).map((p) => p.id));
    return agendamentos.find(
      (a) => idsPets.has(a.petId) && a.status === "Agendado" && a.data >= hojeStr
    );
  }

  function ultimaVisita(petId) {
    for (let i = agendamentos.length - 1; i >= 0; i--) {
      const a = agendamentos[i];
      if (a.petId === petId && a.status === "Concluído") return a;
    }
    return null;
  }

  function confirmarExclusaoCliente(cliente) {
    const petsDoCliente = getPetsDoCliente(cliente.id);
    const idsPets = new Set(petsDoCliente.map((p) => p.id));
    const qtdAgendamentos = agendamentos.filter((a) => idsPets.has(a.petId)).length;

    const perdas = [
      petsDoCliente.length && plural(petsDoCliente.length, "pet", "pets"),
      qtdAgendamentos && plural(qtdAgendamentos, "agendamento", "agendamentos"),
    ].filter(Boolean);

    const detalhe = perdas.length ? ` Isso também apaga ${perdas.join(" e ")}.` : "";
    if (!window.confirm(`Excluir ${cliente.nome}?${detalhe} Não dá para desfazer.`)) return;
    delCliente(cliente.id);
  }

  function confirmarExclusaoPet(pet) {
    const qtd = agendamentos.filter((a) => a.petId === pet.id).length;
    const detalhe = qtd ? ` Isso também apaga ${plural(qtd, "agendamento", "agendamentos")}.` : "";
    if (!window.confirm(`Excluir ${pet.nome}?${detalhe} Não dá para desfazer.`)) return;
    delPet(pet.id);
  }

  function iniciarEdicao(cliente) {
    setEditandoId(cliente.id);
    setClienteEditando({ nome: cliente.nome, telefone: cliente.telefone });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setClienteEditando({ nome: "", telefone: "" });
  }

  function salvarEdicao() {
    if (!clienteEditando.nome) return;
    updateCliente(editandoId, clienteEditando);
    cancelarEdicao();
  }

  function getPetsDoCliente(clienteId) {
    return pets.filter((p) => p.clienteId === clienteId);
  }

  function toggleExpandido(clienteId) {
    setExpandidoId(expandidoId === clienteId ? null : clienteId);
    setNovoPet(PET_VAZIO);
    setEditandoPetId(null);
    setPetDetalheId(null);
  }

  function handleAddPet(clienteId) {
    if (!novoPet.nome) return;
    addPet({ ...novoPet, clienteId });
    setNovoPet(PET_VAZIO);
  }

  function iniciarEdicaoPet(pet) {
    setEditandoPetId(pet.id);
    setPetEditando({ nome: pet.nome, especie: pet.especie, raca: pet.raca });
  }

  function cancelarEdicaoPet() {
    setEditandoPetId(null);
    setPetEditando(PET_VAZIO);
  }

  function salvarEdicaoPet(petId) {
    if (!petEditando.nome) return;
    updatePet(petId, petEditando);
    cancelarEdicaoPet();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Clientes</h2>

      {/* Buscar é o que mais se faz aqui; o cadastro fica atrás de um botão
          para não empurrar a lista para fora da tela no celular. */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={buscaCliente}
            onChange={(e) => setBuscaCliente(e.target.value)}
            className="flex-1 min-w-0 px-4 py-2 border rounded-lg"
          />
          <Button
            onClick={() => setFormAberto((v) => !v)}
            variant={formAberto ? "secondary" : "primary"}
            className="shrink-0"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Novo cliente</span>
          </Button>
        </div>

        {formAberto && (
          <div className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 border rounded-lg">
            <input
              type="text"
              placeholder="Nome"
              value={novoCliente.nome}
              onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
              className="flex-1 min-w-0 px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Telefone"
              value={novoCliente.telefone}
              onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
              className="flex-1 min-w-0 px-4 py-2 border rounded-lg"
            />
            <Button onClick={addCliente} variant="primary" className="shrink-0">
              <Plus size={16} /> Adicionar
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {clientesFiltrados.map((cliente) => {
          const petsDoCliente = getPetsDoCliente(cliente.id);
          const estaEditando = editandoId === cliente.id;
          const estaExpandido = expandidoId === cliente.id;
          const proximo = proximoDoCliente(cliente.id);

          return (
            <div key={cliente.id} className="border rounded-lg overflow-hidden">
              <div className="p-4 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {estaEditando ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={clienteEditando.nome}
                          onChange={(e) => setClienteEditando({ ...clienteEditando, nome: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded-lg"
                          placeholder="Nome"
                        />
                        <input
                          type="text"
                          value={clienteEditando.telefone}
                          onChange={(e) => setClienteEditando({ ...clienteEditando, telefone: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded-lg"
                          placeholder="Telefone"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User size={16} className="text-gray-400" />
                          <p className="font-medium">{cliente.nome}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          <p className="text-sm text-gray-500">{cliente.telefone}</p>
                        </div>
                        {proximo && (
                          <div className="flex items-center gap-2 mt-1">
                            <CalendarClock size={14} className="text-blue-500 shrink-0" />
                            <p className="text-sm text-blue-700">
                              {proximo.data === hojeStr ? "Hoje" : formatDiaMes(proximo.data)} às {proximo.hora}
                              <span className="text-gray-500">
                                {" "}· {pets.find((p) => p.id === proximo.petId)?.nome} · {proximo.servico}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {estaEditando ? (
                      <>
                        <Button onClick={salvarEdicao} variant="success" className="text-xs">
                          Salvar
                        </Button>
                        <Button onClick={cancelarEdicao} variant="secondary" className="text-xs">
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <WhatsAppLink telefone={cliente.telefone} />
                        <Button onClick={() => iniciarEdicao(cliente)} variant="secondary" className="text-xs">
                          <Edit2 size={14} />
                        </Button>
                        <Button onClick={() => confirmarExclusaoCliente(cliente)} variant="danger" className="text-xs">
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Pets do cliente */}
              <div className="px-4 py-3 bg-gray-50 border-t">
                <button
                  onClick={() => toggleExpandido(cliente.id)}
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-600"
                >
                  <span className="flex items-center gap-2">
                    <Dog size={16} className="text-gray-400" />
                    {petsDoCliente.length} {petsDoCliente.length === 1 ? "pet" : "pets"}
                  </span>
                  {estaExpandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {!estaExpandido && petsDoCliente.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {petsDoCliente.map((pet) => (
                      <div key={pet.id} className="px-3 py-1 bg-white border rounded-full text-sm">
                        {EMOJI_ESPECIE[pet.especie] || EMOJI_ESPECIE.Outro} {pet.nome} ({pet.especie})
                      </div>
                    ))}
                  </div>
                )}

                {estaExpandido && (
                  <div className="mt-3 space-y-3">
                    {petsDoCliente.map((pet) => {
                      const estaEditandoPet = editandoPetId === pet.id;
                      const visita = ultimaVisita(pet.id);
                      const temObs = Boolean((pet.observacoes || "").trim());
                      return (
                        <div key={pet.id} className="border rounded-lg bg-white overflow-hidden">
                          <div className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            {estaEditandoPet ? (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 sm:mr-2">
                                <input
                                  type="text"
                                  value={petEditando.nome}
                                  onChange={(e) => setPetEditando({ ...petEditando, nome: e.target.value })}
                                  className="px-2 py-1 border rounded-lg text-sm"
                                  placeholder="Nome"
                                />
                                <select
                                  value={petEditando.especie}
                                  onChange={(e) => setPetEditando({ ...petEditando, especie: e.target.value })}
                                  className="px-2 py-1 border rounded-lg text-sm"
                                >
                                  <option value="Cachorro">Cachorro</option>
                                  <option value="Gato">Gato</option>
                                  <option value="Outro">Outro</option>
                                </select>
                                <input
                                  type="text"
                                  value={petEditando.raca}
                                  onChange={(e) => setPetEditando({ ...petEditando, raca: e.target.value })}
                                  className="px-2 py-1 border rounded-lg text-sm"
                                  placeholder="Raça"
                                />
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2">
                                  <Dog size={14} className="text-gray-400" />
                                  <p className="text-sm font-medium">{pet.nome}</p>
                                </div>
                                <p className="text-xs text-gray-500 ml-6">
                                  {pet.especie} - {pet.raca}
                                </p>
                                <p className="text-xs text-gray-400 ml-6">
                                  {visita ? `Última visita: ${formatDataBR(visita.data)} · ${visita.servico}` : "Ainda não foi atendido"}
                                </p>
                              </div>
                            )}

                            <div className="flex gap-2 shrink-0">
                              {estaEditandoPet ? (
                                <>
                                  <Button onClick={() => salvarEdicaoPet(pet.id)} variant="success" className="text-xs">
                                    Salvar
                                  </Button>
                                  <Button onClick={cancelarEdicaoPet} variant="secondary" className="text-xs">
                                    Cancelar
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    onClick={() => setPetDetalheId(petDetalheId === pet.id ? null : pet.id)}
                                    variant={temObs ? "warning" : "secondary"}
                                    className="text-xs"
                                    title={temObs ? "Este pet tem observações" : "Adicionar observações"}
                                  >
                                    {petDetalheId === pet.id ? "Ocultar" : temObs ? "Obs •" : "Obs"}
                                  </Button>
                                  <Button onClick={() => iniciarEdicaoPet(pet)} variant="secondary" className="text-xs">
                                    <Edit2 size={14} />
                                  </Button>
                                  <Button onClick={() => confirmarExclusaoPet(pet)} variant="danger" className="text-xs">
                                    <Trash2 size={14} />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {petDetalheId === pet.id && (
                            <div className="px-3 pb-3 border-t bg-gray-50">
                              <textarea
                                value={textoObs(pet)}
                                onChange={(e) => setObsRascunho((r) => ({ ...r, [pet.id]: e.target.value }))}
                                onBlur={() => salvarObs(pet)}
                                placeholder="Ex.: morde ao secar, alérgico a shampoo comum..."
                                className="w-full mt-2 px-3 py-2 border rounded-lg text-sm"
                                rows={2}
                              />
                              <p className="text-xs text-gray-400">
                                {obsSalva === pet.id ? "Observações salvas" : "Salva ao sair do campo"}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {petsDoCliente.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-2">Nenhum pet cadastrado</p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Nome do pet"
                        value={novoPet.nome}
                        onChange={(e) => setNovoPet({ ...novoPet, nome: e.target.value })}
                        className="flex-1 min-w-0 px-3 py-2 border rounded-lg text-sm"
                      />
                      <select
                        value={novoPet.especie}
                        onChange={(e) => setNovoPet({ ...novoPet, especie: e.target.value })}
                        className="px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="Cachorro">Cachorro</option>
                        <option value="Gato">Gato</option>
                        <option value="Outro">Outro</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Raça"
                        value={novoPet.raca}
                        onChange={(e) => setNovoPet({ ...novoPet, raca: e.target.value })}
                        className="min-w-0 px-3 py-2 border rounded-lg text-sm"
                      />
                      <Button onClick={() => handleAddPet(cliente.id)} variant="primary" className="text-xs shrink-0">
                        <Plus size={14} /> Adicionar pet
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {clientesFiltrados.length === 0 && (
          <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
            Nenhum cliente encontrado
          </p>
        )}
      </div>
    </div>
  );
}
