import { useState } from "react";
import {
  Plus, Trash2, Edit2, Package, AlertTriangle, Search,
  Check, X, ArrowDownToLine, ArrowUpFromLine, Scale, History,
} from "lucide-react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import EmptyState from "../../common/EmptyState";
import { CATEGORIAS_PRODUTO, MOTIVOS_MOVIMENTACAO } from "../../../data/constants";
import { formatCurrency, formatDateBR } from "../../../utils/format";
import { mesmoId } from "../../../utils/id";
import { useConfirmacao } from "../../../hooks/useConfirmacao";

const PRODUTO_VAZIO = {
  nome: "", categoria: CATEGORIAS_PRODUTO[0], precoCusto: "", precoVenda: "", quantidade: "", estoqueMinimo: "",
};

const classeSelect =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const COR_MOVIMENTACAO = {
  entrada: "text-green-700 bg-green-50",
  estorno: "text-green-700 bg-green-50",
  venda: "text-blue-700 bg-blue-50",
  perda: "text-red-700 bg-red-50",
  uso: "text-amber-700 bg-amber-50",
  ajuste: "text-gray-700 bg-gray-100",
};

function validar(produto, produtos, ignorarId) {
  const nomeRepetido = produtos.some(
    (p) => p.nome.trim().toLowerCase() === produto.nome.trim().toLowerCase() && !mesmoId(p.id, ignorarId)
  );
  return {
    nome: !produto.nome.trim()
      ? "Informe o nome do produto."
      : nomeRepetido
      ? "Já existe um produto com esse nome."
      : "",
    precoVenda: Number(produto.precoVenda) > 0 ? "" : "Informe o preço de venda.",
    precoCusto: Number(produto.precoCusto) >= 0 ? "" : "O custo não pode ser negativo.",
    quantidade: Number(produto.quantidade) >= 0 ? "" : "A quantidade não pode ser negativa.",
    estoqueMinimo: Number(produto.estoqueMinimo) >= 0 ? "" : "O estoque mínimo não pode ser negativo.",
  };
}

const temErro = (erros) => Object.values(erros).some(Boolean);

function Cartao({ icon: Icon, titulo, valor, tom = "neutro" }) {
  const tons = {
    neutro: "border-gray-200",
    alerta: "border-amber-200 bg-amber-50 text-amber-800",
  };
  return (
    <div className={`border rounded-xl p-4 ${tons[tom]}`}>
      <div className="flex items-center gap-2 text-xs opacity-70">
        <Icon size={14} /> {titulo}
      </div>
      <p className="font-semibold text-xl mt-1">{valor}</p>
    </div>
  );
}

export default function Estoque({
  produtos,
  movimentacoes,
  produtosEmFalta,
  valorDoEstoque,
  onAddProduto,
  onUpdateProduto,
  onDeleteProduto,
  onMovimentar,
  onAjustar,
}) {
  const pedirConfirmacao = useConfirmacao();
  const [busca, setBusca] = useState("");
  const [novoProduto, setNovoProduto] = useState(PRODUTO_VAZIO);
  const [erros, setErros] = useState({});
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [produtoEditando, setProdutoEditando] = useState(PRODUTO_VAZIO);
  const [errosEdicao, setErrosEdicao] = useState({});

  // Movimentação aberta: { produtoId, tipo }
  const [movimento, setMovimento] = useState(null);
  const [formMovimento, setFormMovimento] = useState({ quantidade: "", observacao: "" });
  const [erroMovimento, setErroMovimento] = useState("");

  const termo = busca.trim().toLowerCase();
  const filtrados = produtos.filter(
    (p) => p.nome.toLowerCase().includes(termo) || (p.categoria || "").toLowerCase().includes(termo)
  );

  function adicionar() {
    const validacao = validar(novoProduto, produtos);
    setErros(validacao);
    if (temErro(validacao)) return;
    onAddProduto({ ...novoProduto, nome: novoProduto.nome.trim() });
    setNovoProduto(PRODUTO_VAZIO);
    setErros({});
    setMostrarFormulario(false);
  }

  function salvarEdicao() {
    const validacao = validar(produtoEditando, produtos, editandoId);
    delete validacao.quantidade; // a quantidade não é editada pelo cadastro
    setErrosEdicao(validacao);
    if (temErro(validacao)) return;
    onUpdateProduto(editandoId, {
      nome: produtoEditando.nome.trim(),
      categoria: produtoEditando.categoria,
      precoCusto: produtoEditando.precoCusto,
      precoVenda: produtoEditando.precoVenda,
      estoqueMinimo: produtoEditando.estoqueMinimo,
    });
    setEditandoId(null);
  }

  function abrirMovimento(produto, tipo) {
    setMovimento({ produtoId: produto.id, tipo });
    setFormMovimento({ quantidade: "", observacao: "" });
    setErroMovimento("");
  }

  function confirmarMovimento(produto) {
    const qtd = Number(formMovimento.quantidade);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      setErroMovimento("Informe uma quantidade maior que zero.");
      return;
    }
    if (movimento.tipo === "ajuste") {
      onAjustar({ produtoId: produto.id, novaQuantidade: qtd, observacao: formMovimento.observacao });
    } else {
      if (movimento.tipo !== "entrada" && qtd > produto.quantidade) {
        setErroMovimento(`Só há ${produto.quantidade} em estoque.`);
        return;
      }
      onMovimentar({
        produtoId: produto.id,
        tipo: movimento.tipo,
        quantidade: qtd,
        observacao: formMovimento.observacao,
      });
    }
    setMovimento(null);
  }

  function excluir(produto) {
    pedirConfirmacao({
      titulo: `Excluir ${produto.nome}?`,
      mensagem: "Esta ação não pode ser desfeita.",
      detalhe: "O histórico de movimentações do produto some junto. As vendas já registradas continuam no financeiro.",
      textoConfirmar: "Excluir produto",
      aoConfirmar: () => onDeleteProduto(produto.id),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Estoque</h2>
        <Button onClick={() => setMostrarFormulario(!mostrarFormulario)}>
          <Plus size={16} /> Novo produto
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Cartao icon={Package} titulo="Produtos" valor={produtos.length} />
        <Cartao icon={Scale} titulo="Valor em estoque (custo)" valor={formatCurrency(valorDoEstoque)} />
        <Cartao
          icon={AlertTriangle}
          titulo="Precisa repor"
          valor={produtosEmFalta.length}
          tom={produtosEmFalta.length ? "alerta" : "neutro"}
        />
      </div>

      {produtosEmFalta.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
            <AlertTriangle size={16} /> Produtos no estoque mínimo ou abaixo
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {produtosEmFalta.map((p) => (
              <span key={p.id} className="px-3 py-1 bg-white border border-amber-200 rounded-full text-sm">
                {p.nome}: <strong>{p.quantidade}</strong> (mín. {p.estoqueMinimo})
              </span>
            ))}
          </div>
        </div>
      )}

      {mostrarFormulario && (
        <div className="border rounded-xl p-4 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Novo produto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Input
              label="Nome"
              placeholder="Ex.: Ração Premium 10kg"
              value={novoProduto.nome}
              erro={erros.nome}
              onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && adicionar()}
            />
            <Input label="Categoria">
              <select
                value={novoProduto.categoria}
                onChange={(e) => setNovoProduto({ ...novoProduto, categoria: e.target.value })}
                className={classeSelect}
              >
                {CATEGORIAS_PRODUTO.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Input>
            <Input
              label="Preço de custo (R$)"
              type="number" min="0" step="0.01" inputMode="decimal"
              value={novoProduto.precoCusto}
              erro={erros.precoCusto}
              onChange={(e) => setNovoProduto({ ...novoProduto, precoCusto: e.target.value })}
            />
            <Input
              label="Preço de venda (R$)"
              type="number" min="0" step="0.01" inputMode="decimal"
              value={novoProduto.precoVenda}
              erro={erros.precoVenda}
              onChange={(e) => setNovoProduto({ ...novoProduto, precoVenda: e.target.value })}
            />
            <Input
              label="Quantidade inicial"
              type="number" min="0" step="1" inputMode="numeric"
              value={novoProduto.quantidade}
              erro={erros.quantidade}
              onChange={(e) => setNovoProduto({ ...novoProduto, quantidade: e.target.value })}
            />
            <Input
              label="Estoque mínimo"
              type="number" min="0" step="1" inputMode="numeric"
              value={novoProduto.estoqueMinimo}
              erro={erros.estoqueMinimo}
              onChange={(e) => setNovoProduto({ ...novoProduto, estoqueMinimo: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && adicionar()}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={adicionar}>
              <Plus size={16} /> Adicionar produto
            </Button>
            <Button variant="secondary" onClick={() => { setMostrarFormulario(false); setErros({}); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Buscar por produto ou categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-3">
        {filtrados.map((produto) => {
          const editando = mesmoId(editandoId, produto.id);
          const movendo = movimento && mesmoId(movimento.produtoId, produto.id);
          const emFalta = produto.quantidade <= produto.estoqueMinimo;

          return (
            <div key={produto.id} className="border rounded-xl bg-white overflow-hidden">
              <div className="p-4">
                {editando ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Input
                        label="Nome" value={produtoEditando.nome} erro={errosEdicao.nome}
                        onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
                      />
                      <Input label="Categoria">
                        <select
                          value={produtoEditando.categoria}
                          onChange={(e) => setProdutoEditando({ ...produtoEditando, categoria: e.target.value })}
                          className={classeSelect}
                        >
                          {CATEGORIAS_PRODUTO.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </Input>
                      <Input
                        label="Custo (R$)" type="number" min="0" step="0.01"
                        value={produtoEditando.precoCusto} erro={errosEdicao.precoCusto}
                        onChange={(e) => setProdutoEditando({ ...produtoEditando, precoCusto: e.target.value })}
                      />
                      <Input
                        label="Venda (R$)" type="number" min="0" step="0.01"
                        value={produtoEditando.precoVenda} erro={errosEdicao.precoVenda}
                        onChange={(e) => setProdutoEditando({ ...produtoEditando, precoVenda: e.target.value })}
                      />
                      <Input
                        label="Estoque mínimo" type="number" min="0" step="1"
                        value={produtoEditando.estoqueMinimo} erro={errosEdicao.estoqueMinimo}
                        onChange={(e) => setProdutoEditando({ ...produtoEditando, estoqueMinimo: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={salvarEdicao} variant="success" size="sm">
                        <Check size={14} /> Salvar
                      </Button>
                      <Button onClick={() => setEditandoId(null)} variant="secondary" size="sm">
                        <X size={14} /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{produto.nome}</p>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          {produto.categoria}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Venda {formatCurrency(produto.precoVenda)} · Custo {formatCurrency(produto.precoCusto)}
                      </p>
                      <p className={`text-sm mt-1 font-medium ${emFalta ? "text-amber-700" : "text-gray-700"}`}>
                        {produto.quantidade} em estoque
                        <span className="font-normal text-gray-400"> (mín. {produto.estoqueMinimo})</span>
                        {emFalta && <span className="ml-2 text-xs">precisa repor</span>}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => abrirMovimento(produto, "entrada")}>
                        <ArrowDownToLine size={14} /> Entrada
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => abrirMovimento(produto, "perda")}>
                        <ArrowUpFromLine size={14} /> Baixa
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => abrirMovimento(produto, "ajuste")}>
                        <Scale size={14} /> Ajustar
                      </Button>
                      <Button
                        size="sm" variant="secondary" title="Editar produto"
                        aria-label={`Editar ${produto.nome}`}
                        onClick={() => {
                          setEditandoId(produto.id);
                          setProdutoEditando({
                            nome: produto.nome,
                            categoria: produto.categoria || CATEGORIAS_PRODUTO[0],
                            precoCusto: String(produto.precoCusto),
                            precoVenda: String(produto.precoVenda),
                            quantidade: String(produto.quantidade),
                            estoqueMinimo: String(produto.estoqueMinimo),
                          });
                          setErrosEdicao({});
                        }}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        size="sm" variant="danger" title="Excluir produto"
                        aria-label={`Excluir ${produto.nome}`}
                        onClick={() => excluir(produto)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {movendo && (
                <div className="px-4 py-3 bg-gray-50 border-t">
                  <p className="text-sm font-medium mb-2">
                    {movimento.tipo === "entrada" && "Entrada de estoque"}
                    {movimento.tipo === "perda" && "Baixa de estoque"}
                    {movimento.tipo === "ajuste" && "Ajuste de inventário"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label={movimento.tipo === "ajuste" ? "Quantidade contada" : "Quantidade"}
                      type="number" min="0" step="1" inputMode="numeric"
                      value={formMovimento.quantidade}
                      erro={erroMovimento}
                      onChange={(e) => setFormMovimento({ ...formMovimento, quantidade: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && confirmarMovimento(produto)}
                    />
                    {movimento.tipo === "perda" ? (
                      <Input label="Motivo">
                        <select
                          value={formMovimento.observacao}
                          onChange={(e) => setFormMovimento({ ...formMovimento, observacao: e.target.value })}
                          className={classeSelect}
                        >
                          <option value="">Selecione o motivo</option>
                          <option value="Perda / vencimento">Perda / vencimento</option>
                          <option value="Uso interno">Uso interno</option>
                        </select>
                      </Input>
                    ) : (
                      <Input
                        label="Observação (opcional)"
                        placeholder={movimento.tipo === "ajuste" ? "Ex.: contagem do mês" : "Ex.: nota 1234"}
                        value={formMovimento.observacao}
                        onChange={(e) => setFormMovimento({ ...formMovimento, observacao: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && confirmarMovimento(produto)}
                      />
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() =>
                        confirmarMovimento(
                          produto,
                        )
                      }
                    >
                      <Check size={14} /> Confirmar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setMovimento(null)}>
                      <X size={14} /> Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtrados.length === 0 && (
          <EmptyState
            icon={Package}
            titulo={busca ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            descricao={busca ? "Tente outro nome ou categoria." : "Cadastre o primeiro produto para controlar o estoque."}
          />
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <History size={16} /> Últimas movimentações
        </h3>
        {movimentacoes.length === 0 ? (
          <EmptyState icon={History} titulo="Nenhuma movimentação registrada" />
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {movimentacoes.slice(0, 50).map((m) => {
              const produto = produtos.find((p) => mesmoId(p.id, m.produtoId));
              const entrada = m.quantidadeFinal > m.quantidadeAnterior;
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-white">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{produto?.nome || "Produto removido"}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateBR(m.data)}
                      {m.observacao ? ` · ${m.observacao}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full ${COR_MOVIMENTACAO[m.tipo] || "bg-gray-100"}`}>
                      {MOTIVOS_MOVIMENTACAO[m.tipo] || m.tipo}
                    </span>
                    <span className="text-sm font-medium tabular-nums">
                      {entrada ? "+" : "−"}
                      {m.quantidade}
                    </span>
                    <span className="text-xs text-gray-400 tabular-nums w-16 text-right">
                      → {m.quantidadeFinal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
