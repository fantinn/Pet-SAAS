import { Plus, Trash2, Edit2, Dog, User, Phone } from "lucide-react";
import Button from "../../common/Button";
import { useState } from "react";

export default function Pets({ 
  pets, 
  clientes, 
  buscaPet, 
  setBuscaPet, 
  novoPet, 
  setNovoPet, 
  addPet, 
  delPet, 
  petDetalheId, 
  setPetDetalheId, 
  atualizarObs,
  updatePet
}) {
  const [editandoId, setEditandoId] = useState(null);
  const [petEditando, setPetEditando] = useState({ nome: "", especie: "Cachorro", raca: "", clienteId: "" });

  const petsFiltrados = pets.filter((p) =>
    p.nome.toLowerCase().includes(buscaPet.toLowerCase())
  );

  function iniciarEdicao(pet) {
    setEditandoId(pet.id);
    setPetEditando({ 
      nome: pet.nome, 
      especie: pet.especie, 
      raca: pet.raca, 
      clienteId: String(pet.clienteId) 
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setPetEditando({ nome: "", especie: "Cachorro", raca: "", clienteId: "" });
  }

  function salvarEdicao() {
    if (!petEditando.nome || !petEditando.clienteId) return;
    updatePet(editandoId, petEditando);
    cancelarEdicao();
  }

  function getClienteInfo(clienteId) {
    return clientes.find(c => c.id === Number(clienteId));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Pets</h2>
      
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Buscar pet..."
          value={buscaPet}
          onChange={(e) => setBuscaPet(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nome"
            value={novoPet.nome}
            onChange={(e) => setNovoPet({ ...novoPet, nome: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          />
          <select
            value={novoPet.especie}
            onChange={(e) => setNovoPet({ ...novoPet, especie: e.target.value })}
            className="px-4 py-2 border rounded-lg"
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
            className="px-4 py-2 border rounded-lg"
          />
          <select
            value={novoPet.clienteId}
            onChange={(e) => setNovoPet({ ...novoPet, clienteId: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Selecione o cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          <Button onClick={addPet} variant="primary">
            <Plus size={16} /> Adicionar
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {petsFiltrados.map((pet) => {
          const cliente = getClienteInfo(pet.clienteId);
          const estaEditando = editandoId === pet.id;

          return (
            <div key={pet.id} className="border rounded-lg overflow-hidden">
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {estaEditando ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={petEditando.nome}
                          onChange={(e) => setPetEditando({ ...petEditando, nome: e.target.value })}
                          className="px-3 py-2 border rounded-lg"
                          placeholder="Nome"
                        />
                        <select
                          value={petEditando.especie}
                          onChange={(e) => setPetEditando({ ...petEditando, especie: e.target.value })}
                          className="px-3 py-2 border rounded-lg"
                        >
                          <option value="Cachorro">Cachorro</option>
                          <option value="Gato">Gato</option>
                          <option value="Outro">Outro</option>
                        </select>
                        <input
                          type="text"
                          value={petEditando.raca}
                          onChange={(e) => setPetEditando({ ...petEditando, raca: e.target.value })}
                          className="px-3 py-2 border rounded-lg"
                          placeholder="Raça"
                        />
                        <select
                          value={petEditando.clienteId}
                          onChange={(e) => setPetEditando({ ...petEditando, clienteId: e.target.value })}
                          className="px-3 py-2 border rounded-lg"
                        >
                          <option value="">Selecione o cliente</option>
                          {clientes.map((c) => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Dog size={16} className="text-gray-400" />
                          <p className="font-medium">{pet.nome}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{pet.especie} - {pet.raca}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
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
                        <Button
                          onClick={() => setPetDetalheId(petDetalheId === pet.id ? null : pet.id)}
                          variant="secondary"
                          className="text-xs"
                        >
                          {petDetalheId === pet.id ? "Ocultar" : "Detalhes"}
                        </Button>
                        <Button onClick={() => iniciarEdicao(pet)} variant="secondary" className="text-xs">
                          <Edit2 size={14} />
                        </Button>
                        <Button onClick={() => delPet(pet.id)} variant="danger" className="text-xs">
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Informações do dono */}
              {cliente && !estaEditando && (
                <div className="px-4 py-3 bg-blue-50 border-t">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-blue-600" />
                    <p className="text-sm font-medium text-blue-800">Dono: {cliente.nome}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-blue-400" />
                    <p className="text-xs text-blue-600">{cliente.telefone}</p>
                  </div>
                </div>
              )}

              {/* Observações */}
              {petDetalheId === pet.id && (
                <div className="px-4 pb-4 bg-gray-50 border-t">
                  <textarea
                    value={pet.observacoes}
                    onChange={(e) => atualizarObs(pet.id, e.target.value)}
                    placeholder="Observações..."
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>
              )}
            </div>
          );
        })}
        {petsFiltrados.length === 0 && (
          <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
            Nenhum pet encontrado
          </p>
        )}
      </div>
    </div>
  );
}