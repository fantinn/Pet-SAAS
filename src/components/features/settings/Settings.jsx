import { useState } from "react";
import { Plus, Trash2, Clock, DollarSign, Settings as SettingsIcon, Database } from "lucide-react";
import Button from "../../common/Button";
import { buildSeedData } from "../../../data/seedData.jsx";

export default function Settings({
  servicos,
  planos,
  configuracoes,
  onAddServico,
  onUpdateServico,
  onDeleteServico,
  onAddPlano,
  onUpdatePlano,
  onDeletePlano,
  onUpdateConfiguracoes,
  onLoadState,
}) {
  const [novoServico, setNovoServico] = useState({ nome: "", preco: "", duracao: "" });
  const [novoPlano, setNovoPlano] = useState({ id: "", nome: "", descricao: "", preco: "" });
  const [horarioAbertura, setHorarioAbertura] = useState(configuracoes.horarioAbertura || 8);
  const [horarioFechamento, setHorarioFechamento] = useState(configuracoes.horarioFechamento || 18);

  function handleAddServico() {
    if (!novoServico.nome || !novoServico.preco || !novoServico.duracao) return;
    onAddServico({
      id: Date.now(),
      nome: novoServico.nome,
      preco: Number(novoServico.preco),
      duracao: Number(novoServico.duracao)
    });
    setNovoServico({ nome: "", preco: "", duracao: "" });
  }

  function handleUpdateServico(id, campo, valor) {
    const servico = servicos.find(s => s.id === id);
    onUpdateServico(id, { ...servico, [campo]: valor });
  }

  function handleAddPlano() {
    if (!novoPlano.id || !novoPlano.nome || !novoPlano.descricao || !novoPlano.preco) return;
    onAddPlano({
      id: novoPlano.id,
      nome: novoPlano.nome,
      descricao: novoPlano.descricao,
      preco: Number(novoPlano.preco)
    });
    setNovoPlano({ id: "", nome: "", descricao: "", preco: "" });
  }

  function handleUpdatePlano(id, campo, valor) {
    const plano = planos.find(p => p.id === id);
    onUpdatePlano(id, { ...plano, [campo]: valor });
  }

  function handleSaveConfiguracoes() {
    onUpdateConfiguracoes({
      horarioAbertura: Number(horarioAbertura),
      horarioFechamento: Number(horarioFechamento)
    });
  }

  function handleLoadSeedData() {
    if (!window.confirm("Isso vai substituir todos os dados atuais (clientes, pets, vendas, etc) pelos dados de demonstração. Continuar?")) {
      return;
    }
    onLoadState(buildSeedData());
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <SettingsIcon size={24} />
        <h2 className="text-xl font-semibold">Configurações</h2>
      </div>

      {/* Dados de Demonstração */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Database size={18} /> Dados de Demonstração
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Preenche o sistema com clientes, pets, agendamentos, vendas, assinaturas e despesas fictícios,
          só para você visualizar como o app fica em uso. Substitui os dados atuais.
        </p>
        <Button onClick={handleLoadSeedData} variant="secondary">
          <Database size={16} /> Carregar dados de demonstração
        </Button>
      </div>

      {/* Horário de Funcionamento */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-4">Horário de Funcionamento</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Abertura</label>
            <select
              value={horarioAbertura}
              onChange={(e) => setHorarioAbertura(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {Array.from({ length: 12 }, (_, i) => i + 6).map(hora => (
                <option key={hora} value={hora}>{String(hora).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fechamento</label>
            <select
              value={horarioFechamento}
              onChange={(e) => setHorarioFechamento(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {Array.from({ length: 12 }, (_, i) => i + 12).map(hora => (
                <option key={hora} value={hora}>{String(hora).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
        </div>
        <Button onClick={handleSaveConfiguracoes} variant="primary" className="mt-4">
          Salvar Horários
        </Button>
      </div>

      {/* Serviços */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-4">Serviços Oferecidos</h3>
        
        <div className="mb-6 p-4 bg-white rounded-lg border">
          <h4 className="font-medium mb-3">Adicionar Novo Serviço</h4>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Nome do serviço"
              value={novoServico.nome}
              onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Preço (R$)"
              value={novoServico.preco}
              onChange={(e) => setNovoServico({ ...novoServico, preco: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Duração (min)"
              value={novoServico.duracao}
              onChange={(e) => setNovoServico({ ...novoServico, duracao: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
          <Button onClick={handleAddServico} variant="primary" className="mt-3">
            <Plus size={16} /> Adicionar Serviço
          </Button>
        </div>

        <div className="space-y-3">
          {servicos.map((servico) => (
            <div key={servico.id} className="flex items-center gap-3 p-4 bg-white rounded-lg border">
              <div className="flex-1">
                <input
                  type="text"
                  value={servico.nome}
                  onChange={(e) => handleUpdateServico(servico.id, 'nome', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-medium"
                />
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-green-600" />
                <input
                  type="number"
                  value={servico.preco}
                  onChange={(e) => handleUpdateServico(servico.id, 'preco', Number(e.target.value))}
                  className="w-20 px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                <input
                  type="number"
                  value={servico.duracao}
                  onChange={(e) => handleUpdateServico(servico.id, 'duracao', Number(e.target.value))}
                  className="w-20 px-3 py-2 border rounded-lg"
                />
                <span className="text-sm text-gray-500">min</span>
              </div>
              <Button onClick={() => onDeleteServico(servico.id)} variant="danger">
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Planos de Assinatura */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-4">Planos de Assinatura</h3>
        
        <div className="mb-6 p-4 bg-white rounded-lg border">
          <h4 className="font-medium mb-3">Adicionar Novo Plano</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="ID do plano (ex: premium)"
              value={novoPlano.id}
              onChange={(e) => setNovoPlano({ ...novoPlano, id: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Nome do plano"
              value={novoPlano.nome}
              onChange={(e) => setNovoPlano({ ...novoPlano, nome: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
          <input
            type="text"
            placeholder="Descrição do plano"
            value={novoPlano.descricao}
            onChange={(e) => setNovoPlano({ ...novoPlano, descricao: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg mb-3"
          />
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Preço mensal (R$)"
              value={novoPlano.preco}
              onChange={(e) => setNovoPlano({ ...novoPlano, preco: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <Button onClick={handleAddPlano} variant="primary">
              <Plus size={16} /> Adicionar Plano
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {planos.map((plano) => (
            <div key={plano.id} className="p-4 bg-white rounded-lg border">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  value={plano.id}
                  onChange={(e) => handleUpdatePlano(plano.id, 'id', e.target.value)}
                  className="px-3 py-2 border rounded-lg font-medium"
                  placeholder="ID"
                />
                <input
                  type="text"
                  value={plano.nome}
                  onChange={(e) => handleUpdatePlano(plano.id, 'nome', e.target.value)}
                  className="px-3 py-2 border rounded-lg font-medium"
                  placeholder="Nome"
                />
              </div>
              <textarea
                value={plano.descricao}
                onChange={(e) => handleUpdatePlano(plano.id, 'descricao', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-3"
                rows={2}
                placeholder="Descrição"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-green-600" />
                  <input
                    type="number"
                    value={plano.preco}
                    onChange={(e) => handleUpdatePlano(plano.id, 'preco', Number(e.target.value))}
                    className="w-24 px-3 py-2 border rounded-lg"
                  />
                  <span className="text-sm text-gray-500">/mês</span>
                </div>
                <Button onClick={() => onDeletePlano(plano.id)} variant="danger">
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}