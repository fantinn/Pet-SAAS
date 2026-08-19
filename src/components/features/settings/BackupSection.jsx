import { useRef, useState } from "react";
import { Download, Upload, ShieldAlert, Check } from "lucide-react";
import Button from "../../common/Button";
import { baixarBackup, lerBackup, nomeDoArquivo } from "../../../services/backupService.js";
import { useConfirmacao } from "../../../hooks/useConfirmacao";

const plural = (n, singular, plural) => `${n} ${n === 1 ? singular : plural}`;

export default function BackupSection({ state, onRestaurar }) {
  const pedirConfirmacao = useConfirmacao();
  const inputRef = useRef(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  function exportar() {
    baixarBackup(state);
    setErro("");
    setMensagem(`Backup salvo como ${nomeDoArquivo()}.`);
  }

  function selecionarArquivo() {
    setErro("");
    setMensagem("");
    inputRef.current?.click();
  }

  async function aoEscolherArquivo(evento) {
    const arquivo = evento.target.files?.[0];
    // Limpa o input para permitir escolher o mesmo arquivo duas vezes seguidas.
    evento.target.value = "";
    if (!arquivo) return;

    const resultado = lerBackup(await arquivo.text());
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    const { resumo, estado } = resultado;
    pedirConfirmacao({
      titulo: "Restaurar este backup?",
      mensagem: "Todos os dados atuais serão substituídos pelos do arquivo. Não dá para desfazer.",
      detalhe: [
        `O arquivo contém ${plural(resumo.clientes, "cliente", "clientes")}, `,
        `${plural(resumo.pets, "pet", "pets")}, `,
        `${plural(resumo.agendamentos, "agendamento", "agendamentos")}, `,
        `${plural(resumo.vendas, "venda", "vendas")} e `,
        `${plural(resumo.despesas, "despesa", "despesas")}.`,
      ].join(""),
      textoConfirmar: "Restaurar backup",
      textoCancelar: "Voltar",
      aoConfirmar: () => {
        onRestaurar(estado);
        setMensagem("Backup restaurado.");
      },
    });
  }

  return (
    <section className="border rounded-xl p-4 sm:p-6">
      <h3 className="font-semibold mb-1">Backup dos dados</h3>
      <p className="text-sm text-gray-500 mb-4">
        Os dados ficam salvos apenas neste navegador. Exporte com frequência — limpar o histórico ou
        trocar de computador apaga tudo.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={exportar} className="w-full sm:w-auto">
          <Download size={16} /> Exportar backup
        </Button>
        <Button onClick={selecionarArquivo} variant="secondary" className="w-full sm:w-auto">
          <Upload size={16} /> Importar backup
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={aoEscolherArquivo}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {mensagem && (
        <p className="text-sm text-green-600 flex items-center gap-1 mt-3">
          <Check size={16} /> {mensagem}
        </p>
      )}
      {erro && (
        <p className="text-sm text-red-600 flex items-center gap-2 mt-3">
          <ShieldAlert size={16} className="shrink-0" /> {erro}
        </p>
      )}
    </section>
  );
}
