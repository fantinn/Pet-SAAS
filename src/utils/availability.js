const INTERVALO_MINUTOS = 30; // Intervalo de 30 minutos
const ABERTURA_PADRAO = 8;
const FECHAMENTO_PADRAO = 18;

/**
 * Calcula horários disponíveis para agendamento
 * @param {string} data - Data no formato YYYY-MM-DD
 * @param {Array} agendamentos - Lista de agendamentos existentes
 * @param {number} duracaoServico - Duração do serviço em minutos
 * @param {Array} servicos - Lista de serviços para buscar duração
 * @param {Object} configuracoes - Horário de funcionamento do petshop
 * @returns {Array} - Lista de horários disponíveis no formato HH:MM
 */
export function calcularHorariosDisponiveis(data, agendamentos, duracaoServico, servicos, configuracoes = {}) {
  const abertura = configuracoes.horarioAbertura ?? ABERTURA_PADRAO;
  const fechamento = configuracoes.horarioFechamento ?? FECHAMENTO_PADRAO;

  // Filtra agendamentos do dia
  const agendamentosDoDia = agendamentos.filter(a => a.data === data && a.status !== "Cancelado");

  // Gera todos os horários possíveis do dia, respeitando o horário de funcionamento
  const horariosPossiveis = [];
  for (let hora = abertura; hora < fechamento; hora++) {
    for (let min = 0; min < 60; min += INTERVALO_MINUTOS) {
      const horario = `${String(hora).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      horariosPossiveis.push(horario);
    }
  }

  // Um serviço não pode invadir o horário de fechamento
  const limiteFim = fechamento * 60;

  return horariosPossiveis.filter(horario => {
    const [h, m] = horario.split(':').map(Number);
    if (h * 60 + m + duracaoServico > limiteFim) return false;
    return !temConflito(horario, duracaoServico, agendamentosDoDia, servicos);
  });
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