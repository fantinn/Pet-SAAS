import { useState } from "react";

export function useCalendar() {
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [diaSelecionado, setDiaSelecionado] = useState(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`
  );

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

  return {
    mesAtual,
    diaSelecionado,
    setDiaSelecionado,
    diasDoMes,
    prevMes,
    nextMes,
  };
}