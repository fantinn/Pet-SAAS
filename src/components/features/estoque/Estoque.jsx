import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, Minus, PackageCheck, Pencil, Plus, Search, Trash2, Wallet, X } from "lucide-react";
import Button from "../../common/Button";
import { formatBRL } from "../../../utils/format";

const FORM_VAZIO = { nome: "", categoria: "", quantidade: "", estoqueMinimo: "", precoCusto: "", precoVenda: "" };

function Cartao({ icone: Icone, label, valor, detalhe, alerta }) {
  return (
    <div className={`border rounded-lg p-3 ${alerta ? "border-red-200 bg-red-50" : ""}`}>
      <div className={`flex items-center gap-1.5 mb-1 ${alerta ? "text-red-400" : "text-gray-400"}`}>
        <Icone size={13} />
        <p className="text-xs">{label}</p>
      </div>
      <p className="font-semibold text-lg leading-tight">{valor}</p>
      {detalhe && <p className="text-xs text-gray-400 mt-0.5">{detalhe}</p>}
    </div>
  );
}

export default function Estoque({ produtos, disponivel, onAdd, onUpdate, onAjustar, onDelete }) {
  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [apenasBaixo, setApenasBaixo] = useState(false);

  const resumo = useMemo(() => {
    const baixo = produtos.filter((p) => p.quantidade <= p.estoqueMinimo);
    return {
      itens: produtos.length,
      unidades: produtos.reduce((s, p) => s + p.quantidade, 0),
      valorCusto: produtos.reduce((s, p) => s + p.quantidade * p.precoCusto, 0),
      valorVenda: produtos.reduce((s, p) => s + p.quantidade * p.precoVenda, 0),
      baixo: baixo.length,
    };
  }, [produtos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter(
      (p) =>
        (!apenasBaixo || p.quantidade <= p.estoqueMinimo) &&
        (!termo || p.nome.toLowerCase().includes(termo) || p.categoria.toLowerCase().includes(termo))
    );
  }, [produtos, busca, apenasBaixo]);

  if (!disponivel) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Estoque</h2>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          <p className="font-medium mb-1">A tabela de produtos ainda não existe no banco.</p>
          <p>
            Rode o arquivo <code className="bg-amber-100 px-1 rounded">supabase/migrations/20260930_produtos_estoque.sql</code>{" "}
            no SQL Editor do Supabase e recarregue a página.
          </p>
        </div>
      </div>
    );
  }

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  function limpar() {
    setForm(FORM_VAZIO);
    setEditandoId(null);
  }

  function iniciarEdicao(p) {
    setEditandoId(p.id);
    setForm({
      nome: p.nome,
      categoria: p.categoria,
      quantidade: String(p.quantidade),
      estoqueMinimo: String(p.estoqueMinimo),
      precoCusto: String(p.precoCusto),
      precoVenda: String(p.precoVenda),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvar() {
    if (!form.nome.trim()) return;
    const dados = {
      nome: form.nome.trim(),
      categoria: form.categoria.trim(),
      estoqueMinimo: Math.max(0, parseInt(form.estoqueMinimo, 10) || 0),
      precoCusto: Math.max(0, Number(form.precoCusto) || 0),
      precoVenda: Math.max(0, Number(form.precoVenda) || 0),
    };
    if (editandoId) {
      if (!await onUpdate(editandoId, dados)) return;
    } else {
      if (!await onAdd({ ...dados, quantidade: Math.max(0, parseInt(form.quantidade, 10) || 0) })) return;
    }
    limpar();
  }

  function confirmarExclusao(p) {
    if (!window.confirm(`Excluir "${p.nome}" do estoque? Não dá para desfazer.`)) return;
    onDelete(p.id);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Estoque</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Cartao icone={Boxes} label="Produtos" valor={resumo.itens} detalhe={`${resumo.unidades} unidades`} />
        <Cartao icone={Wallet} label="Valor em estoque" valor={formatBRL(resumo.valorCusto)} detalhe="a preço de custo" />
        <Cartao
          icone={PackageCheck}
          label="Potencial de venda"
          valor={formatBRL(resumo.valorVenda)}
          detalhe={`margem ${formatBRL(resumo.valorVenda - resumo.valorCusto)}`}
        />
        <Cartao
          icone={AlertTriangle}
          label="Repor"
          valor={resumo.baixo}
          detalhe={resumo.baixo === 1 ? "produto no mínimo" : "produtos no mínimo"}
          alerta={resumo.baixo > 0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{editandoId ? "Editar produto" : "Novo produto"}</h3>
            {editandoId && (
              <button onClick={limpar} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
                <X size={12} /> cancelar
              </button>
            )}
          </div>
          <div className="space-y-3">
            <input type="text" placeholder="Nome (ex.: Ração Premium 15kg)" value={form.nome} onChange={set("nome")} className="w-full px-4 py-2 border rounded-lg" />
            <input type="text" placeholder="Categoria (ex.: Ração, Higiene)" value={form.categoria} onChange={set("categoria")} className="w-full px-4 py-2 border rounded-lg" />
            {!editandoId && (
              <input type="number" min="0" placeholder="Quantidade inicial" value={form.quantidade} onChange={set("quantidade")} className="w-full px-4 py-2 border rounded-lg" />
            )}
            <input type="number" min="0" placeholder="Estoque mínimo (alerta)" value={form.estoqueMinimo} onChange={set("estoqueMinimo")} className="w-full px-4 py-2 border rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min="0" step="0.01" placeholder="Custo" value={form.precoCusto} onChange={set("precoCusto")} className="w-full px-4 py-2 border rounded-lg" />
              <input type="number" min="0" step="0.01" placeholder="Venda" value={form.precoVenda} onChange={set("precoVenda")} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <Button onClick={salvar} variant="primary" className="w-full" disabled={!form.nome.trim()}>
              <Plus size={16} /> {editandoId ? "Salvar alterações" : "Adicionar produto"}
            </Button>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="relative flex-1 min-w-[12rem]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produto ou categoria"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input type="checkbox" checked={apenasBaixo} onChange={(e) => setApenasBaixo(e.target.checked)} />
              só o que precisa repor
            </label>
          </div>

          <div className="space-y-2">
            {filtrados.map((p) => {
              const zerado = p.quantidade === 0;
              const baixo = p.quantidade <= p.estoqueMinimo;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-3 p-4 rounded-lg border ${
                    zerado ? "bg-red-50 border-red-200" : baixo ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-transparent"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.nome}</p>
                    <p className="text-sm text-gray-500">
                      {p.categoria || "Sem categoria"} · custo {formatBRL(p.precoCusto)} · venda {formatBRL(p.precoVenda)}
                    </p>
                    {baixo && (
                      <p className={`text-xs mt-0.5 flex items-center gap-1 ${zerado ? "text-red-600" : "text-amber-700"}`}>
                        <AlertTriangle size={12} />
                        {zerado ? "Acabou" : `Abaixo do mínimo (${p.estoqueMinimo})`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border rounded-lg bg-white">
                      <button
                        onClick={() => onAjustar(p.id, -1)}
                        disabled={zerado}
                        className="p-2 hover:bg-gray-100 disabled:text-gray-300 rounded-l-lg"
                        title="Retirar 1 unidade"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{p.quantidade}</span>
                      <button
                        onClick={() => onAjustar(p.id, 1)}
                        className="p-2 hover:bg-gray-100 rounded-r-lg"
                        title="Adicionar 1 unidade"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => iniciarEdicao(p)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg" title="Editar">
                      <Pencil size={16} />
                    </button>
                    <Button onClick={() => confirmarExclusao(p)} variant="danger" title="Excluir">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              );
            })}
            {filtrados.length === 0 && (
              <p className="text-gray-500 text-center py-6 bg-gray-50 rounded-lg">
                {produtos.length === 0 ? "Nenhum produto cadastrado ainda." : "Nada encontrado com esse filtro."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
