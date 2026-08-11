// Configuração de horário de funcionamento (pode ser dinâmico no futuro)
const HORARIO_ABERTURA = 8; // 8:00
const HORARIO_FECHAMENTO = 18; // 18:00
const INTERVALO_MINUTOS = 30; // Intervalo de 30 minutos

/**
 * Calcula horários disponíveis para agendamento
 * @param {string} data - Data no formato YYYY-MM-DD
 * @param {Array} agendamentos - Lista de agendamentos existentes
 * @param {number} duracaoServico - Duração do serviço em minutos
 * @param {Array} servicos - Lista de serviços para buscar duração
 * @returns {Array} - Lista de horários disponíveis no formato HH:MM
 */
export function calcularHorariosDisponiveis(data, agendamentos, duracaoServico, servicos) {
  // Filtra agendamentos do dia
  const agendamentosDoDia = agendamentos.filter(a => a.data === data && a.status !== "Cancelado");
  
  // Gera todos os horários possíveis do dia
  const horariosPossiveis = [];
  for (let hora = HORARIO_ABERTURA; hora < HORARIO_FECHAMENTO; hora++) {
    for (let min = 0; min < 60; min += INTERVALO_MINUTOS) {
      const horario = `${String(hora).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      horariosPossiveis.push(horario);
    }
  }
  
  // Filtra horários disponíveis
  const horariosDisponiveis = horariosPossiveis.filter(horario => {
    return !temConflito(horario, duracaoServico, agendamentosDoDia, servicos);
  });
  
  return horariosDisponiveis;
}

/**
 * Verifica se um horário tem conflito com agendamentos existentes
 * @param {string} horario - Horário no formato HH:MM
 * @param {number} duracao - Duração em minutos
 * @param {Array} agendamentosDoDia - Agendamentos do dia
 * @param {Array} servicos - Lista de serviços para buscar duração
 * @returns {boolean}
 */
function temConflito(horario, duracao, agendamentosDoDia, servicos) {
  const [hora, min] = horario.split(':').map(Number);
  const inicioMinutos = hora * 60 + min;
  const fimMinutos = inicioMinutos + duracao;
  
  for (const ag of agendamentosDoDia) {
    const [agHora, agMin] = ag.hora.split(':').map(Number);
    const agInicioMinutos = agHora * 60 + agMin;
    
    // Encontra a duração do serviço agendado
    const agServico = servicos.find(s => s.nome === ag.servico);
    const agDuracao = agServico ? agServico.duracao : 60;
    const agFimMinutos = agInicioMinutos + agDuracao;
    
    // Verifica sobreposição
    if (inicioMinutos < agFimMinutos && fimMinutos > agInicioMinutos) {
      return true;
    }
  }
  
  return false;
}

/**
 * Converte horário HH:MM para minutos desde meia-noite
 * @param {string} horario - Horário no formato HH:MM
 * @returns {number}
 */
export function horarioParaMinutos(horario) {
  const [hora, min] = horario.split(':').map(Number);
  return hora * 60 + min;
}

/**
 * Converte minutos desde meia-noite para horário HH:MM
 * @param {number} minutos - Minutos desde meia-noite
 * @returns {string}
 */
export function minutosParaHorario(minutos) {
  const hora = Math.floor(minutos / 60);
  const min = minutos % 60;
  return `${String(hora).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}