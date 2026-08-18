import { useState } from "react";
import { formatDate } from "../utils/format.js";

export function useCalendar() {
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [diaSelecionado, setDiaSelecionado] = useState(formatDate(hoje));

  function diasDoMes(base) {
    const ano = base.getFullYear(), mes = base.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const dias = [];
    for (let i = 0; i < primeiroDia.getDay(); i++) dias.push(null);
    for (let d = 1; d <= ultimoDia.getDate(); d++) dias.push(new Date(ano, mes, d));
    return dias;
  }

  function prevMes() {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
  }

  function nextMes() {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));
  }

  // Seleciona um dia (YYYY-MM-DD) e leva o calendário para o mês dele, para a
  // agenda do dia acompanhar a data escolhida no formulário.
  function irParaData(dataStr) {
    if (!dataStr) return;
    const [ano, mes, dia] = dataStr.split("-").map(Number);
    if (!ano || !mes || !dia) return;
    setDiaSelecionado(dataStr);
    setMesAtual(new Date(ano, mes - 1, 1));
  }

  return {
    mesAtual,
    diaSelecionado,
    setDiaSelecionado,
    irParaData,
    diasDoMes,
    prevMes,
    nextMes,
  };
}
