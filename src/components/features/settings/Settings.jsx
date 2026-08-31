import { useState } from "react";
import { Plus, Trash2, Clock, DollarSign, Settings as SettingsIcon, Database } from "lucide-react";
import Button from "../../common/Button";

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
  onLoadDemoData,
}) {
  const [novoServico, setNovoServico] = useState({ nome: "", preco: "", duracao: "" });
  const [novoPlano, setNovoPlano] = useState({ nome: "", descricao: "", preco: "" });
  const [horarioAbertura, setHorarioAbertura] = useState(configuracoes.horarioAbertura || 8);
  const [horarioFechamento, setHorarioFechamento] = useState(configuracoes.horarioFechamento || 18);
  const [horarioSalvo, setHorarioSalvo] = useState(false);

  // Edições em campos de texto ficam em rascunho local e só vão para o banco
  // quando o campo perde o foco — digitar não pode disparar um UPDATE por tecla.
  const [rascunhos, setRascunhos] = useState({});

  const valorCampo = (tipo, item, campo) => rascunhos[`${tipo}:${item.id}:${campo}`] ?? item[campo] ?? "";

  const editarCampo = (tipo, item, campo, valor) =>
    setRascunhos((r) => ({ ...r, [`${tipo}:${item.id}:${campo}`]: valor }));

  function confirmarCampo(tipo, item, campo, salvar) {
    const chave = `${tipo}:${item.id}:${campo}`;
    const rascunho = rascunhos[chave];
    setRascunhos((r) => {
      const { [chave]: _, ...resto } = r;
      return resto;
    });
    if (rascunho === undefined || String(rascunho) === String(item[campo] ?? "")) return;
    salvar(rascunho);
  }

  function handleAddServico() {
    if (!novoServico.nome || !novoServico.preco || !novoServico.duracao) return;
    onAddServico({
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
    if (!novoPlano.nome || !novoPlano.descricao || !novoPlano.preco) return;
    onAddPlano({
      nome: novoPlano.nome,
      descricao: novoPlano.descricao,
      preco: Number(novoPlano.preco)
    });
    setNovoPlano({ nome: "", descricao: "", preco: "" });
  }

  function handleUpdatePlano(id, campo, valor) {
    const plano = planos.find(p => p.id === id);
    onUpdatePlano(id, { ...plano, [campo]: valor });
  }

  async function handleSaveConfiguracoes() {
    await onUpdateConfiguracoes({
      horarioAbertura: Number(horarioAbertura),
      horarioFechamento: Number(horarioFechamento)
    });
    setHorarioSalvo(true);
    setTimeout(() => setHorarioSalvo(false), 2500);
  }

  function handleLoadSeedData() {
    if (!window.confirm("Isso vai substituir todos os dados atuais (clientes, pets, vendas, etc) pelos dados de demonstração. Continuar?")) {
      return;
    }
    onLoadDemoData();
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
        <div className="flex items-center gap-3 mt-4">
          <Button onClick={handleSaveConfiguracoes} variant="primary">
            Salvar Horários
          </Button>
          {horarioSalvo && (
            <span className="text-sm text-green-600 font-medium">Horários salvos</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Os horários oferecidos ao agendar respeitam esta faixa.
        </p>
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
                  value={valorCampo("servico", servico, "nome")}
                  onChange={(e) => editarCampo("servico", servico, "nome", e.target.value)}
                  onBlur={() => confirmarCampo("servico", servico, "nome", (v) => v && handleUpdateServico(servico.id, "nome", v))}
                  className="w-full px-3 py-2 border rounded-lg font-medium"
                />
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-green-600" />
                <input
                  type="number"
                  value={valorCampo("servico", servico, "preco")}
                  onChange={(e) => editarCampo("servico", servico, "preco", e.target.value)}
                  onBlur={() => confirmarCampo("servico", servico, "preco", (v) => handleUpdateServico(servico.id, "preco", Number(v) || 0))}
                  className="w-20 px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                <input
                  type="number"
                  value={valorCampo("servico", servico, "duracao")}
                  onChange={(e) => editarCampo("servico", servico, "duracao", e.target.value)}
                  onBlur={() => confirmarCampo("servico", servico, "duracao", (v) => handleUpdateServico(servico.id, "duracao", Number(v) || 30))}
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
          <input
            type="text"
            placeholder="Nome do plano"
            value={novoPlano.nome}
            onChange={(e) => setNovoPlano({ ...novoPlano, nome: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg mb-3"
          />
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
              <input
                type="text"
                value={valorCampo("plano", plano, "nome")}
                onChange={(e) => editarCampo("plano", plano, "nome", e.target.value)}
                onBlur={() => confirmarCampo("plano", plano, "nome", (v) => v && handleUpdatePlano(plano.id, "nome", v))}
                className="w-full px-3 py-2 border rounded-lg font-medium mb-3"
                placeholder="Nome"
              />
              <textarea
                value={valorCampo("plano", plano, "descricao")}
                onChange={(e) => editarCampo("plano", plano, "descricao", e.target.value)}
                onBlur={() => confirmarCampo("plano", plano, "descricao", (v) => handleUpdatePlano(plano.id, "descricao", v))}
                className="w-full px-3 py-2 border rounded-lg mb-3"
                rows={2}
                placeholder="Descrição"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-green-600" />
                  <input
                    type="number"
                    value={valorCampo("plano", plano, "preco")}
                    onChange={(e) => editarCampo("plano", plano, "preco", e.target.value)}
                    onBlur={() => confirmarCampo("plano", plano, "preco", (v) => handleUpdatePlano(plano.id, "preco", Number(v) || 0))}
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