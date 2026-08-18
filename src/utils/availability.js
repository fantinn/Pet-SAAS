const INTERVALO_PADRAO = 30; // grade de horários, em minutos

/**
 * Calcula os horários livres para encaixar um serviço em uma data.
 *
 * @param {Object}   params
 * @param {string}   params.data          - Data no formato YYYY-MM-DD
 * @param {Array}    params.agendamentos  - Agendamentos existentes
 * @param {Array}    params.servicos      - Serviços cadastrados (para achar a duração de cada agendamento)
 * @param {number}   params.duracao       - Duração do serviço que se quer agendar, em minutos
 * @param {Object}   params.configuracoes - { horarioAbertura, horarioFechamento, intervaloMinutos }
 * @param {Date}     [params.agora]       - "Momento atual" (injetável para testes)
 * @returns {string[]} Horários livres no formato HH:MM
 */
export function calcularHorariosDisponiveis({
  data,
  agendamentos = [],
  servicos = [],
  duracao = 60,
  configuracoes = {},
  agora = new Date(),
}) {
  if (!data) return [];

  const abertura = Number(configuracoes.horarioAbertura ?? 8);
  const fechamento = Number(configuracoes.horarioFechamento ?? 18);
  const intervalo = Number(configuracoes.intervaloMinutos ?? INTERVALO_PADRAO);
  if (!(fechamento > abertura) || intervalo <= 0) return [];

  const aberturaMin = abertura * 60;
  const fechamentoMin = fechamento * 60;

  // Cancelados liberam a agenda novamente.
  const agendamentosDoDia = agendamentos.filter((a) => a.data === data && a.status !== "Cancelado");

  // Em uma data passada nada está disponível; hoje, só o que ainda não passou.
  const hojeStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(
    agora.getDate()
  ).padStart(2, "0")}`;
  if (data < hojeStr) return [];
  const minimoMin = data === hojeStr ? agora.getHours() * 60 + agora.getMinutes() : -Infinity;

  const horarios = [];
  for (let inicio = aberturaMin; inicio + duracao <= fechamentoMin; inicio += intervalo) {
    if (inicio < minimoMin) continue;
    if (temConflito(inicio, duracao, agendamentosDoDia, servicos)) continue;
    horarios.push(minutosParaHorario(inicio));
  }
  return horarios;
}

/** Verifica sobreposição do intervalo [inicio, inicio+duracao) com a agenda do dia. */
function temConflito(inicioMinutos, duracao, agendamentosDoDia, servicos) {
  const fimMinutos = inicioMinutos + duracao;

  return agendamentosDoDia.some((ag) => {
    const agInicio = horarioParaMinutos(ag.hora);
    if (!Number.isFinite(agInicio)) return false;
    const agDuracao = servicos.find((s) => s.nome === ag.servico)?.duracao ?? 60;
    return inicioMinutos < agInicio + agDuracao && fimMinutos > agInicio;
  });
}

/** "14:30" -> 870 */
export function horarioParaMinutos(horario) {
  const [hora, min] = String(horario || "").split(":").map(Number);
  if (!Number.isFinite(hora) || !Number.isFinite(min)) return NaN;
  return hora * 60 + min;
}

/** 870 -> "14:30" */
export function minutosParaHorario(minutos) {
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}
