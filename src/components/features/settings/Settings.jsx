import { useState } from "react";
import { Plus, Trash2, Clock, Edit2, Check, X, Settings as SettingsIcon, Tag, Scissors } from "lucide-react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import EmptyState from "../../common/EmptyState";
import { formatCurrency } from "../../../utils/format";
import { mesmoId } from "../../../utils/id";
import { useConfirmacao } from "../../../hooks/useConfirmacao";

const INTERVALOS = [15, 30, 60];
const classeSelect =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const SERVICO_VAZIO = { nome: "", preco: "", duracao: "" };
const PLANO_VAZIO = { nome: "", descricao: "", preco: "" };

function validarServico({ nome, preco, duracao }, servicos, ignorarId) {
  const nomeExiste = servicos.some(
    (s) => s.nome.trim().toLowerCase() === nome.trim().toLowerCase() && !mesmoId(s.id, ignorarId)
  );
  return {
    nome: !nome.trim() ? "Informe o nome do serviço." : nomeExiste ? "Já existe um serviço com esse nome." : "",
    preco: Number(preco) > 0 ? "" : "Informe um preço maior que zero.",
    duracao: Number(duracao) > 0 ? "" : "Informe a duração em minutos.",
  };
}

function validarPlano({ nome, descricao, preco }) {
  return {
    nome: nome.trim() ? "" : "Informe o nome do plano.",
    descricao: descricao.trim() ? "" : "Descreva o que o plano inclui.",
    preco: Number(preco) > 0 ? "" : "Informe um preço maior que zero.",
  };
}

const temErro = (erros) => Object.values(erros).some(Boolean);

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
}) {
  const pedirConfirmacao = useConfirmacao();

  // Horário de funcionamento
  const [horario, setHorario] = useState({
    horarioAbertura: configuracoes.horarioAbertura,
    horarioFechamento: configuracoes.horarioFechamento,
    intervaloMinutos: configuracoes.intervaloMinutos ?? 30,
  });
  const [erroHorario, setErroHorario] = useState("");
  const [horarioSalvo, setHorarioSalvo] = useState(false);

  // Serviços
  const [novoServico, setNovoServico] = useState(SERVICO_VAZIO);
  const [errosServico, setErrosServico] = useState({});
  const [servicoEditandoId, setServicoEditandoId] = useState(null);
  const [servicoEditando, setServicoEditando] = useState(SERVICO_VAZIO);
  const [errosEdicaoServico, setErrosEdicaoServico] = useState({});

  // Planos
  const [novoPlano, setNovoPlano] = useState(PLANO_VAZIO);
  const [errosPlano, setErrosPlano] = useState({});
  const [planoEditandoId, setPlanoEditandoId] = useState(null);
  const [planoEditando, setPlanoEditando] = useState(PLANO_VAZIO);
  const [errosEdicaoPlano, setErrosEdicaoPlano] = useState({});

  function salvarHorario() {
    if (Number(horario.horarioAbertura) >= Number(horario.horarioFechamento)) {
      setErroHorario("O horário de fechamento precisa ser depois do de abertura.");
      setHorarioSalvo(false);
      return;
    }
    setErroHorario("");
    onUpdateConfiguracoes({
      horarioAbertura: Number(horario.horarioAbertura),
      horarioFechamento: Number(horario.horarioFechamento),
      intervaloMinutos: Number(horario.intervaloMinutos),
    });
    setHorarioSalvo(true);
  }

  function adicionarServico() {
    const validacao = validarServico(novoServico, servicos);
    setErrosServico(validacao);
    if (temErro(validacao)) return;
    onAddServico({ ...novoServico, nome: novoServico.nome.trim() });
    setNovoServico(SERVICO_VAZIO);
    setErrosServico({});
  }

  function salvarServico() {
    const validacao = validarServico(servicoEditando, servicos, servicoEditandoId);
    setErrosEdicaoServico(validacao);
    if (temErro(validacao)) return;
    onUpdateServico(servicoEditandoId, {
      nome: servicoEditando.nome.trim(),
      preco: Number(servicoEditando.preco),
      duracao: Number(servicoEditando.duracao),
    });
    setServicoEditandoId(null);
    setErrosEdicaoServico({});
  }

  function excluirServico(servico) {
    pedirConfirmacao({
      titulo: `Excluir o serviço ${servico.nome}?`,
      mensagem: "Ele deixa de aparecer em novos agendamentos e vendas.",
      detalhe: "Agendamentos já criados com este serviço continuam na agenda.",
      textoConfirmar: "Excluir serviço",
      aoConfirmar: () => onDeleteServico(servico.id),
    });
  }

  function adicionarPlano() {
    const validacao = validarPlano(novoPlano);
    setErrosPlano(validacao);
    if (temErro(validacao)) return;
    onAddPlano({ ...novoPlano, nome: novoPlano.nome.trim() });
    setNovoPlano(PLANO_VAZIO);
    setErrosPlano({});
  }

  function salvarPlano() {
    const validacao = validarPlano(planoEditando);
    setErrosEdicaoPlano(validacao);
    if (temErro(validacao)) return;
    onUpdatePlano(planoEditandoId, {
      nome: planoEditando.nome.trim(),
      descricao: planoEditando.descricao.trim(),
      preco: Number(planoEditando.preco),
    });
    setPlanoEditandoId(null);
    setErrosEdicaoPlano({});
  }

  function excluirPlano(plano) {
    pedirConfirmacao({
      titulo: `Excluir o plano ${plano.nome}?`,
      mensagem: "As assinaturas ativas deste plano serão canceladas.",
      textoConfirmar: "Excluir plano",
      aoConfirmar: () => onDeletePlano(plano.id),
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <SettingsIcon size={22} />
        <h2 className="text-xl font-semibold">Configurações</h2>
      </div>

      {/* Horário de funcionamento */}
      <section className="border rounded-xl p-4 sm:p-6">
        <h3 className="font-semibold mb-1">Horário de funcionamento</h3>
        <p className="text-sm text-gray-500 mb-4">
          Define quais horários a agenda oferece ao marcar um serviço.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Abertura">
            <select
              value={horario.horarioAbertura}
              onChange={(e) => {
                setHorario({ ...horario, horarioAbertura: e.target.value });
                setHorarioSalvo(false);
              }}
              className={classeSelect}
            >
              {Array.from({ length: 18 }, (_, i) => i + 5).map((hora) => (
                <option key={hora} value={hora}>
                  {String(hora).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </Input>
          <Input label="Fechamento">
            <select
              value={horario.horarioFechamento}
              onChange={(e) => {
                setHorario({ ...horario, horarioFechamento: e.target.value });
                setHorarioSalvo(false);
              }}
              className={classeSelect}
            >
              {Array.from({ length: 18 }, (_, i) => i + 6).map((hora) => (
                <option key={hora} value={hora}>
                  {String(hora).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </Input>
          <Input label="Intervalo entre horários">
            <select
              value={horario.intervaloMinutos}
              onChange={(e) => {
                setHorario({ ...horario, intervaloMinutos: e.target.value });
                setHorarioSalvo(false);
              }}
              className={classeSelect}
            >
              {INTERVALOS.map((min) => (
                <option key={min} value={min}>
                  {min} min
                </option>
              ))}
            </select>
          </Input>
        </div>

        {erroHorario && <p className="text-xs text-red-600 mt-2">{erroHorario}</p>}

        <div className="flex items-center gap-3 mt-4">
          <Button onClick={salvarHorario}>Salvar horários</Button>
          {horarioSalvo && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <Check size={16} /> Salvo
            </span>
          )}
        </div>
      </section>

      {/* Serviços */}
      <section className="border rounded-xl p-4 sm:p-6">
        <h3 className="font-semibold mb-4">Serviços oferecidos</h3>

        <div className="bg-gray-50 border rounded-xl p-4 mb-5">
          <p className="text-sm font-medium mb-3">Novo serviço</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Nome"
              placeholder="Ex.: Banho"
              value={novoServico.nome}
              erro={errosServico.nome}
              onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && adicionarServico()}
            />
            <Input
              label="Preço (R$)"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={novoServico.preco}
              erro={errosServico.preco}
              onChange={(e) => setNovoServico({ ...novoServico, preco: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && adicionarServico()}
            />
            <Input
              label="Duração (min)"
              type="number"
              min="5"
              step="5"
              inputMode="numeric"
              value={novoServico.duracao}
              erro={errosServico.duracao}
              onChange={(e) => setNovoServico({ ...novoServico, duracao: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && adicionarServico()}
            />
          </div>
          <Button onClick={adicionarServico} className="mt-3 w-full sm:w-auto">
            <Plus size={16} /> Adicionar serviço
          </Button>
        </div>

        {servicos.length === 0 ? (
          <EmptyState icon={Scissors} titulo="Nenhum serviço cadastrado" />
        ) : (
          <div className="space-y-2">
            {servicos.map((servico) => {
              const editando = mesmoId(servicoEditandoId, servico.id);
              return (
                <div key={servico.id} className="border rounded-xl p-4">
                  {editando ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                          label="Nome"
                          value={servicoEditando.nome}
                          erro={errosEdicaoServico.nome}
                          onChange={(e) => setServicoEditando({ ...servicoEditando, nome: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && salvarServico()}
                        />
                        <Input
                          label="Preço (R$)"
                          type="number"
                          min="0"
                          step="0.01"
                          value={servicoEditando.preco}
                          erro={errosEdicaoServico.preco}
                          onChange={(e) => setServicoEditando({ ...servicoEditando, preco: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && salvarServico()}
                        />
                        <Input
                          label="Duração (min)"
                          type="number"
                          min="5"
                          step="5"
                          value={servicoEditando.duracao}
                          erro={errosEdicaoServico.duracao}
                          onChange={(e) => setServicoEditando({ ...servicoEditando, duracao: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && salvarServico()}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={salvarServico} variant="success" size="sm">
                          <Check size={14} /> Salvar
                        </Button>
                        <Button onClick={() => setServicoEditandoId(null)} variant="secondary" size="sm">
                          <X size={14} /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{servico.nome}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-3">
                          <span>{formatCurrency(servico.preco)}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {servico.duracao} min
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          title="Editar serviço"
                          aria-label={`Editar ${servico.nome}`}
                          onClick={() => {
                            setServicoEditandoId(servico.id);
                            setServicoEditando({
                              nome: servico.nome,
                              preco: String(servico.preco),
                              duracao: String(servico.duracao),
                            });
                            setErrosEdicaoServico({});
                          }}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          onClick={() => excluirServico(servico)}
                          variant="danger"
                          size="sm"
                          title="Excluir serviço"
                          aria-label={`Excluir ${servico.nome}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Planos */}
      <section className="border rounded-xl p-4 sm:p-6">
        <h3 className="font-semibold mb-4">Planos de assinatura</h3>

        <div className="bg-gray-50 border rounded-xl p-4 mb-5">
          <p className="text-sm font-medium mb-3">Novo plano</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nome"
              placeholder="Ex.: Premium"
              value={novoPlano.nome}
              erro={errosPlano.nome}
              onChange={(e) => setNovoPlano({ ...novoPlano, nome: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && adicionarPlano()}
            />
            <Input
              label="Preço mensal (R$)"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={novoPlano.preco}
              erro={errosPlano.preco}
              onChange={(e) => setNovoPlano({ ...novoPlano, preco: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && adicionarPlano()}
            />
          </div>
          <Input
            label="Descrição"
            className="mt-3"
            placeholder="O que está incluso no plano"
            value={novoPlano.descricao}
            erro={errosPlano.descricao}
            onChange={(e) => setNovoPlano({ ...novoPlano, descricao: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && adicionarPlano()}
          />
          <Button onClick={adicionarPlano} className="mt-3 w-full sm:w-auto">
            <Plus size={16} /> Adicionar plano
          </Button>
        </div>

        {planos.length === 0 ? (
          <EmptyState icon={Tag} titulo="Nenhum plano cadastrado" />
        ) : (
          <div className="space-y-2">
            {planos.map((plano) => {
              const editando = mesmoId(planoEditandoId, plano.id);
              return (
                <div key={plano.id} className="border rounded-xl p-4">
                  {editando ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Nome"
                          value={planoEditando.nome}
                          erro={errosEdicaoPlano.nome}
                          onChange={(e) => setPlanoEditando({ ...planoEditando, nome: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && salvarPlano()}
                        />
                        <Input
                          label="Preço mensal (R$)"
                          type="number"
                          min="0"
                          step="0.01"
                          value={planoEditando.preco}
                          erro={errosEdicaoPlano.preco}
                          onChange={(e) => setPlanoEditando({ ...planoEditando, preco: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && salvarPlano()}
                        />
                      </div>
                      <Input
                        label="Descrição"
                        value={planoEditando.descricao}
                        erro={errosEdicaoPlano.descricao}
                        onChange={(e) => setPlanoEditando({ ...planoEditando, descricao: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && salvarPlano()}
                      />
                      <div className="flex gap-2">
                        <Button onClick={salvarPlano} variant="success" size="sm">
                          <Check size={14} /> Salvar
                        </Button>
                        <Button onClick={() => setPlanoEditandoId(null)} variant="secondary" size="sm">
                          <X size={14} /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{plano.nome}</p>
                        <p className="text-sm text-gray-500">{plano.descricao}</p>
                        <p className="text-sm font-medium text-blue-600 mt-1">
                          {formatCurrency(plano.preco)}/mês
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          title="Editar plano"
                          aria-label={`Editar ${plano.nome}`}
                          onClick={() => {
                            setPlanoEditandoId(plano.id);
                            setPlanoEditando({
                              nome: plano.nome,
                              descricao: plano.descricao,
                              preco: String(plano.preco),
                            });
                            setErrosEdicaoPlano({});
                          }}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          onClick={() => excluirPlano(plano)}
                          variant="danger"
                          size="sm"
                          title="Excluir plano"
                          aria-label={`Excluir ${plano.nome}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
