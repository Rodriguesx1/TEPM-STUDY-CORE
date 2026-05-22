export type CyclePhase = "menstrual" | "folicular" | "ovulatoria" | "lutea" | "indefinida";

const dayMs = 24 * 60 * 60 * 1000;

export function estimateCyclePhase(date: Date, lastPeriodStart?: string | null, averageCycleLength = 28, averagePeriodLength = 5): CyclePhase {
  if (!lastPeriodStart) return "indefinida";
  const start = new Date(`${lastPeriodStart}T00:00:00`);
  if (Number.isNaN(start.getTime())) return "indefinida";
  const days = Math.floor((date.getTime() - start.getTime()) / dayMs);
  const cycleDay = ((days % averageCycleLength) + averageCycleLength) % averageCycleLength;

  if (cycleDay < averagePeriodLength) return "menstrual";
  if (cycleDay < Math.max(averagePeriodLength + 7, 11)) return "folicular";
  if (cycleDay >= Math.max(averageCycleLength - 16, 10) && cycleDay <= Math.max(averageCycleLength - 12, 14)) return "ovulatoria";
  return "lutea";
}

export function buildCyclePredictions(lastPeriodStart?: string | null, averageCycleLength = 28, averagePeriodLength = 5, days = 35) {
  const today = new Date();
  const predictions = [];
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const iso = date.toISOString().slice(0, 10);
    predictions.push({
      predicted_date: iso,
      predicted_phase: estimateCyclePhase(date, lastPeriodStart, averageCycleLength, averagePeriodLength),
      confidence: lastPeriodStart ? "estimate" : "low",
      basis: { average_cycle_length: averageCycleLength, average_period_length: averagePeriodLength },
    });
  }
  return predictions;
}

export function studySuggestionForPhase(phase: CyclePhase, energyLevel?: number | null) {
  if (energyLevel && energyLevel <= 2) {
    return {
      intensity: "leve",
      nextAction: "Escolha uma revisao curta ou organize um material ja conhecido.",
      message: "Hoje pode ser melhor preservar energia e reduzir carga cognitiva.",
    };
  }

  const byPhase: Record<CyclePhase, { intensity: string; nextAction: string; message: string }> = {
    menstrual: {
      intensity: "leve",
      nextAction: "Revisao curta, leitura reflexiva ou diario rapido.",
      message: "Se fizer sentido para voce, mantenha um ritmo mais acolhedor hoje.",
    },
    folicular: {
      intensity: "profunda",
      nextAction: "Iniciar um PDF novo, criar trilha ou estudar um tema central.",
      message: "Pode ser um bom momento para abrir conteudo novo com clareza.",
    },
    ovulatoria: {
      intensity: "expressiva",
      nextAction: "Preparar apresentacao, revisar em voz alta ou organizar aplicacoes praticas.",
      message: "Se voce estiver com boa energia, transforme estudo em comunicacao.",
    },
    lutea: {
      intensity: "organizada",
      nextAction: "Revisar, fechar pendencias e estruturar proximas acoes.",
      message: "Uma rotina mais objetiva pode reduzir excesso de informacao.",
    },
    indefinida: {
      intensity: "moderada",
      nextAction: "Escolha uma sessao de 20 minutos e observe sua energia antes de aprofundar.",
      message: "Sem dados suficientes, a recomendacao permanece geral e ajustavel.",
    },
  };
  return byPhase[phase];
}
