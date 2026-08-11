import { Plus, Trash2, MessageCircle, Edit2, Dog, Phone, User } from "lucide-react";
import WhatsAppLink from "../../common/WhatsAppLink";
import Button from "../../common/Button";
import { useState } from "react";

export default function Clientes({ 
  clientes, 
  pets,
  buscaCliente, 
  setBuscaCliente, 
  novoCliente, 
  setNovoCliente, 
  addCliente, 
  delCliente,
  updateCliente
}) {
  const [editandoId, setEditandoId] = useState(null);
  const [clienteEditando, setClienteEditando] = useState({ nome: "", telefone: "" });

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(buscaCliente.toLowerCase())
  );

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
    return pets.filter(p => p.clienteId === clienteId);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Clientes</h2>
      
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={buscaCliente}
          onChange={(e) => setBuscaCliente(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nome"
            value={novoCliente.nome}
            onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Telefone"
            value={novoCliente.telefone}
            onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          />
          <Button onClick={addCliente} variant="primary">
            <Plus size={16} /> Adicionar
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {clientesFiltrados.map((cliente) => {
          const petsDoCliente = getPetsDoCliente(cliente.id);
          const estaEditando = editandoId === cliente.id;

          return (
            <div key={cliente.id} className="border rounded-lg overflow-hidden">
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {estaEditando ? (
                      <div className="flex gap-2">
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
                        <WhatsAppLink telefone={cliente.telefone} />
                        <Button onClick={() => iniciarEdicao(cliente)} variant="secondary" className="text-xs">
                          <Edit2 size={14} />
                        </Button>
                        <Button onClick={() => delCliente(cliente.id)} variant="danger" className="text-xs">
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Pets do cliente */}
              {petsDoCliente.length > 0 && (
                <div className="px-4 pb-4 bg-gray-50 border-t">
                  <div className="flex items-center gap-2 mb-2 mt-3">
                    <Dog size={16} className="text-gray-400" />
                    <p className="text-sm font-medium text-gray-600">
                      {petsDoCliente.length} {petsDoCliente.length === 1 ? 'pet' : 'pets'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {petsDoCliente.map((pet) => (
                      <div 
                        key={pet.id} 
                        className="px-3 py-1 bg-white border rounded-full text-sm"
                      >
                        🐶 {pet.nome} ({pet.especie})
                      </div>
                    ))}
                  </div>
                </div>
              )}
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