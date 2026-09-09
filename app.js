/* ==========================================================================
     ESTADO GLOBAL E CONFIGURAÇÕES DA PLATAFORMA CCO
     ========================================================================== */
  let currentTab = 'mod-malha';
  let notificationCount = 0;
  let ccoEvents = [];
  let selectedCcoEventId = null;
  let ccoDecisionTimer = null;
  let ccoAssumeTimer = null;
  let ccoDecisionSeconds = 0;
  let ccoAssumeSeconds = 0;
  let ecoChartInstance = null;
  let vibrationChart = null;
  let ccoSomAtivo = true;

  const gameState = {
    operador: '',
    operadorNome: '',
    isAdmin: false,
    emExecucao: false,
    pontuacao: 0,
    bloqueado: false,
    tempoBloqueio: 0,
    bloqueiosPorAba: {},
    cardsAtivos: [],
    cardsAguardados: [],
    intervaloCards: null,
    historicoTreinamento: [],
    ranking: [
      { nome: 'Carlos M.', pontos: 1250 },
      { nome: 'Ana P.', pontos: 980 },
      { nome: 'Lucas R.', pontos: 820 }
    ]
  };

  const whitelist = [
    "adm@vale.com",
    "hanry.ramos@vale.com",
    "operador1@vale.com",
    "operador2@vale.com",
    "gerente.cco@vale.com"
  ];

  const bancoIncidentes = [
    { id: 1, titulo: '🚂 Gargalo de Pátio RAMP', criticidade: 'grave', descricao: 'Ocupação do pátio ultrapassou a faixa nominal e há risco de retenção das próximas composições.', opcoes: [{ texto: 'Redirecionar parte do fluxo para a Via Secundária 2 e acompanhar a capacidade.', correta: true, pontos: 100 }, { texto: 'Forçar a entrada da próxima composição para tentar liberar o pátio.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 2, titulo: '🚂 Ocupação Elevada de Trecho', criticidade: 'moderado', descricao: 'A ocupação do trecho está acima da faixa planejada para o próximo ciclo.', opcoes: [{ texto: 'Controlar novas entradas e reorganizar a sequência das composições.', correta: true, pontos: 70 }, { texto: 'Manter todas as entradas para evitar qualquer atraso.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 3, titulo: '🚂 Conflito de Rota', criticidade: 'grave', descricao: 'Dois movimentos planejados apresentam conflito de rota em uma mesma janela operacional.', opcoes: [{ texto: 'Reordenar os movimentos e liberar a rota com menor risco operacional.', correta: true, pontos: 100 }, { texto: 'Liberar os dois movimentos simultaneamente.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 4, titulo: '🚂 Inconsistência de Sinalização', criticidade: 'grave', descricao: 'A indicação de sinalização diverge do planejamento operacional recebido.', opcoes: [{ texto: 'Interromper o avanço e validar a condição da rota antes de prosseguir.', correta: true, pontos: 100 }, { texto: 'Prosseguir com base apenas no planejamento original.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 5, titulo: '🚂 Trem Aguardando Liberação', criticidade: 'moderado', descricao: 'Uma composição permanece parada aguardando autorização para avançar.', opcoes: [{ texto: 'Verificar a condição da rota e liberar somente após confirmação operacional.', correta: true, pontos: 70 }, { texto: 'Liberar imediatamente sem validar a rota.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 6, titulo: '🚂 Pátio Próximo da Capacidade', criticidade: 'grave', descricao: 'A ocupação do pátio está próxima do limite e novas composições se aproximam.', opcoes: [{ texto: 'Reduzir novas entradas e priorizar a reorganização do pátio.', correta: true, pontos: 100 }, { texto: 'Manter o fluxo máximo de entrada.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 7, titulo: '🚂 Janela Operacional Reduzida', criticidade: 'moderado', descricao: 'A janela disponível para um movimento foi reduzida por restrição operacional.', opcoes: [{ texto: 'Replanejar a sequência respeitando a nova janela disponível.', correta: true, pontos: 70 }, { texto: 'Ignorar a redução e manter o planejamento original.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 8, titulo: '🚂 Aproximação Simultânea de Trens', criticidade: 'grave', descricao: 'Duas composições se aproximam de uma região com capacidade limitada.', opcoes: [{ texto: 'Coordenar a sequência e manter uma composição em condição segura de espera.', correta: true, pontos: 100 }, { texto: 'Permitir que as duas avancem para ganhar tempo.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 9, titulo: '🚂 Atraso na Formação', criticidade: 'moderado', descricao: 'A formação de uma composição apresenta atraso em relação ao planejamento.', opcoes: [{ texto: 'Reorganizar a sequência e avaliar alternativas sem comprometer a segurança.', correta: true, pontos: 70 }, { texto: 'Acelerar todas as etapas sem análise operacional.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 10, titulo: '🚂 Bloqueio Parcial de Trecho', criticidade: 'grave', descricao: 'Parte da malha fica temporariamente indisponível para circulação.', opcoes: [{ texto: 'Redirecionar o fluxo e atualizar a sequência operacional.', correta: true, pontos: 100 }, { texto: 'Manter os movimentos previstos como se o trecho estivesse livre.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 11, titulo: '🚂 Prioridades Operacionais Conflitantes', criticidade: 'grave', descricao: 'Dois movimentos possuem prioridade operacional semelhante na mesma janela.', opcoes: [{ texto: 'Avaliar impacto global e definir a sequência com menor risco.', correta: true, pontos: 100 }, { texto: 'Escolher o movimento mais próximo sem analisar o restante da malha.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 12, titulo: '🚂 Ocupação Crítica de Pátio', criticidade: 'critico', descricao: 'A capacidade disponível do pátio está próxima do limite máximo.', opcoes: [{ texto: 'Restringir entradas e executar um plano imediato de descompressão do pátio.', correta: true, pontos: 150 }, { texto: 'Continuar a entrada normal até que a capacidade seja atingida.', correta: false, penalidade: -100 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 13, titulo: '🤖 HotBox em Elevação', criticidade: 'grave', descricao: 'A temperatura de um rolamento apresenta tendência de aumento contínuo.', opcoes: [{ texto: 'Reduzir o risco operacional e encaminhar a composição para avaliação preditiva.', correta: true, pontos: 100 }, { texto: 'Ignorar a tendência enquanto não houver alarme máximo.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 14, titulo: '🤖 HotBox Acima do Padrão', criticidade: 'critico', descricao: 'O monitoramento indica temperatura significativamente acima do comportamento esperado.', opcoes: [{ texto: 'Interromper a progressão operacional e direcionar a composição para inspeção.', correta: true, pontos: 150 }, { texto: 'Manter a velocidade nominal e aguardar nova leitura.', correta: false, penalidade: -100 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 15, titulo: '🤖 Impacto WILD Acima do Padrão', criticidade: 'grave', descricao: 'O sistema identifica impacto de roda acima do limite operacional esperado.', opcoes: [{ texto: 'Reduzir a exposição ao risco e solicitar avaliação da composição.', correta: true, pontos: 100 }, { texto: 'Manter o movimento normal sem intervenção.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 16, titulo: '🤖 Queda de Confiabilidade do Sensor', criticidade: 'moderado', descricao: 'A confiabilidade de um sensor caiu e os dados apresentam maior incerteza.', opcoes: [{ texto: 'Validar a informação com outras fontes antes de tomar uma decisão crítica.', correta: true, pontos: 70 }, { texto: 'Tratar a leitura como totalmente confiável.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 17, titulo: '🤖 HotBox + WILD Simultâneo', criticidade: 'critico', descricao: 'O mesmo trem apresenta sinais anormais de temperatura e impacto de roda.', opcoes: [{ texto: 'Classificar como prioridade crítica e direcionar para avaliação imediata.', correta: true, pontos: 150 }, { texto: 'Continuar a viagem e observar os indicadores.', correta: false, penalidade: -100 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 18, titulo: '🤖 Tendência Anormal de Temperatura', criticidade: 'moderado', descricao: 'O modelo preditivo identifica crescimento contínuo de temperatura em um componente.', opcoes: [{ texto: 'Aumentar o monitoramento e programar intervenção antes da condição crítica.', correta: true, pontos: 70 }, { texto: 'Aguardar o indicador atingir o limite máximo.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 19, titulo: '🤖 Anomalia Recorrente Detectada', criticidade: 'grave', descricao: 'A IA identifica comportamento anormal repetido em um equipamento.', opcoes: [{ texto: 'Investigar a recorrência e programar intervenção preventiva.', correta: true, pontos: 100 }, { texto: 'Desconsiderar por já ter ocorrido anteriormente.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 20, titulo: '🤖 Previsão de Falha Mecânica', criticidade: 'critico', descricao: 'O modelo indica alta probabilidade de falha caso o movimento continue.', opcoes: [{ texto: 'Interromper ou restringir o movimento e solicitar avaliação técnica.', correta: true, pontos: 150 }, { texto: 'Prosseguir para evitar impacto no cronograma.', correta: false, penalidade: -100 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 21, titulo: '🤖 Sensor com Leitura Inconsistente', criticidade: 'moderado', descricao: 'Os dados recebidos apresentam variações incompatíveis com o histórico recente.', opcoes: [{ texto: 'Comparar com sensores correlatos e validar a informação.', correta: true, pontos: 70 }, { texto: 'Usar o último valor recebido como verdade absoluta.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 22, titulo: '🤖 Degradação de Componente', criticidade: 'grave', descricao: 'O modelo identifica tendência de deterioração em um componente ferroviário.', opcoes: [{ texto: 'Registrar a tendência e antecipar a manutenção recomendada.', correta: true, pontos: 100 }, { texto: 'Aguardar uma falha para confirmar o diagnóstico.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 23, titulo: '🤖 Alerta Preditivo de Roda', criticidade: 'grave', descricao: 'O sistema detecta comportamento fora do padrão em um conjunto de rodas.', opcoes: [{ texto: 'Reduzir o risco e encaminhar para avaliação do conjunto.', correta: true, pontos: 100 }, { texto: 'Manter o movimento sem análise adicional.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 24, titulo: '🤖 Anomalia Múltipla no Trem', criticidade: 'critico', descricao: 'Diferentes indicadores apontam simultaneamente para risco operacional.', opcoes: [{ texto: 'Tratar o evento como prioridade e realizar avaliação integrada.', correta: true, pontos: 150 }, { texto: 'Analisar cada indicador isoladamente e manter o movimento.', correta: false, penalidade: -100 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 25, titulo: '🌱 Consumo Acima da Meta', criticidade: 'moderado', descricao: 'O consumo energético acumulado está acima da meta planejada para o trecho.', opcoes: [{ texto: 'Ajustar o perfil de condução e buscar recuperação de eficiência.', correta: true, pontos: 70 }, { texto: 'Manter a condução atual até o fim do trecho.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 26, titulo: '🌱 Aceleração Acima do Recomendado', criticidade: 'moderado', descricao: 'O perfil de condução apresenta aceleração desnecessariamente elevada.', opcoes: [{ texto: 'Reduzir a demanda de tração e adotar condução mais eficiente.', correta: true, pontos: 70 }, { texto: 'Manter a aceleração máxima disponível.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 27, titulo: '🌱 Velocidade Fora do Perfil Econômico', criticidade: 'moderado', descricao: 'A composição opera acima da faixa considerada ideal para eficiência energética.', opcoes: [{ texto: 'Adequar a velocidade ao perfil econômico e às condições da via.', correta: true, pontos: 70 }, { texto: 'Aumentar ainda mais a velocidade para ganhar tempo.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 28, titulo: '🌱 Frenagem Antecipada Necessária', criticidade: 'moderado', descricao: 'O perfil da via indica necessidade de antecipar a redução de velocidade.', opcoes: [{ texto: 'Antecipar a frenagem de forma gradual e controlada.', correta: true, pontos: 70 }, { texto: 'Esperar a aproximação do ponto crítico para frear.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 29, titulo: '🌱 Recuperação de Atraso', criticidade: 'grave', descricao: 'A composição está atrasada e existe pressão para recuperar tempo.', opcoes: [{ texto: 'Recuperar o atraso respeitando o perfil seguro e eficiente de condução.', correta: true, pontos: 100 }, { texto: 'Acelerar ao máximo durante todo o trecho.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 30, titulo: '🌱 Curva + Aceleração', criticidade: 'grave', descricao: 'A composição se aproxima de uma curva enquanto mantém aceleração elevada.', opcoes: [{ texto: 'Reduzir a tração e adequar a velocidade antes da curva.', correta: true, pontos: 100 }, { texto: 'Manter a aceleração até entrar na curva.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 31, titulo: '🌱 Marcha Ineficiente', criticidade: 'moderado', descricao: 'A condição operacional permite reduzir o esforço de tração sem comprometer a marcha.', opcoes: [{ texto: 'Ajustar a condução para reduzir consumo mantendo o desempenho necessário.', correta: true, pontos: 70 }, { texto: 'Manter o esforço máximo de tração.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 32, titulo: '🌱 Consumo Crítico', criticidade: 'grave', descricao: 'O consumo acumulado está muito acima da meta e compromete a eficiência do ciclo.', opcoes: [{ texto: 'Revisar imediatamente o perfil de condução e reduzir desperdícios.', correta: true, pontos: 100 }, { texto: 'Ignorar o indicador para preservar a velocidade.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 33, titulo: '🌱 Parada Não Planejada', criticidade: 'moderado', descricao: 'A composição precisa realizar uma parada fora do planejamento original.', opcoes: [{ texto: 'Recalcular o perfil de condução e reduzir o impacto energético da parada.', correta: true, pontos: 70 }, { texto: 'Manter o mesmo perfil como se a parada não existisse.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 34, titulo: '🌱 Restrição Operacional à Frente', criticidade: 'grave', descricao: 'Uma restrição exige adequação do perfil de velocidade nos próximos quilômetros.', opcoes: [{ texto: 'Antecipar a redução de velocidade e ajustar a condução.', correta: true, pontos: 100 }, { texto: 'Esperar chegar à restrição para reagir.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 35, titulo: '🌱 Forte Demanda de Tração', criticidade: 'grave', descricao: 'O perfil atual exige elevado esforço de tração por período prolongado.', opcoes: [{ texto: 'Reavaliar o perfil de condução e usar a tração de forma eficiente.', correta: true, pontos: 100 }, { texto: 'Manter potência máxima continuamente.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 36, titulo: '🌱 Atraso + Restrição de Velocidade', criticidade: 'critico', descricao: 'O trem atrasado se aproxima de uma região com restrição operacional.', opcoes: [{ texto: 'Priorizar segurança e eficiência, ajustando o perfil sem ultrapassar a restrição.', correta: true, pontos: 150 }, { texto: 'Acelerar antes da restrição para compensar todo o atraso.', correta: false, penalidade: -100 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 37, titulo: '🛤️ Vibração Elevada no Truque', criticidade: 'grave', descricao: 'O sensor identifica vibração acima do comportamento normal no truque.', opcoes: [{ texto: 'Reduzir o risco e encaminhar a composição para avaliação.', correta: true, pontos: 100 }, { texto: 'Manter a velocidade e aguardar nova ocorrência.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 38, titulo: '🛤️ Temperatura Elevada em Componente', criticidade: 'grave', descricao: 'A temperatura de um componente apresenta elevação anormal durante o movimento.', opcoes: [{ texto: 'Reduzir a exposição ao risco e solicitar inspeção.', correta: true, pontos: 100 }, { texto: 'Ignorar enquanto não atingir o limite máximo.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 39, titulo: '🛤️ Comportamento Anormal de Roda', criticidade: 'grave', descricao: 'O sistema identifica comportamento fora do padrão esperado em uma roda.', opcoes: [{ texto: 'Solicitar avaliação do conjunto e adequar o movimento.', correta: true, pontos: 100 }, { texto: 'Continuar normalmente sem intervenção.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 40, titulo: '🛤️ Emergência Mecânica', criticidade: 'critico', descricao: 'Indícios apontam para possível falha mecânica durante o movimento.', opcoes: [{ texto: 'Executar protocolo de emergência e priorizar a integridade da composição.', correta: true, pontos: 150 }, { texto: 'Manter o movimento para evitar atraso.', correta: false, penalidade: -100 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 41, titulo: '🛤️ Vibração Crescente', criticidade: 'moderado', descricao: 'A vibração apresenta tendência de aumento contínuo.', opcoes: [{ texto: 'Aumentar o monitoramento e avaliar intervenção antes do agravamento.', correta: true, pontos: 70 }, { texto: 'Aguardar o valor atingir o limite crítico.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 42, titulo: '🛤️ Assimetria entre Rodas', criticidade: 'grave', descricao: 'Sensores indicam comportamento diferente entre conjuntos de rodas.', opcoes: [{ texto: 'Reduzir o risco e solicitar inspeção direcionada.', correta: true, pontos: 100 }, { texto: 'Desconsiderar a assimetria como variação normal.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 43, titulo: '🛤️ Desgaste Fora do Padrão', criticidade: 'moderado', descricao: 'Indicadores apontam desgaste superior ao esperado em componente ferroviário.', opcoes: [{ texto: 'Registrar a anomalia e antecipar avaliação de manutenção.', correta: true, pontos: 70 }, { texto: 'Continuar até o próximo ciclo sem registrar o alerta.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 44, titulo: '🛤️ Temperatura + Vibração', criticidade: 'critico', descricao: 'Dois indicadores mecânicos apresentam alterações simultaneamente.', opcoes: [{ texto: 'Tratar como ocorrência crítica e direcionar para avaliação imediata.', correta: true, pontos: 150 }, { texto: 'Avaliar somente o indicador menos grave.', correta: false, penalidade: -100 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 45, titulo: '🛤️ Impacto Elevado em Roda', criticidade: 'grave', descricao: 'O impacto registrado apresenta valor acima do padrão operacional.', opcoes: [{ texto: 'Adequar o movimento e solicitar avaliação da roda.', correta: true, pontos: 100 }, { texto: 'Manter o movimento sem intervenção.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 46, titulo: '🛤️ Anomalia no Truque', criticidade: 'grave', descricao: 'O sistema identifica comportamento anormal no conjunto do truque.', opcoes: [{ texto: 'Reduzir o risco e solicitar inspeção técnica.', correta: true, pontos: 100 }, { texto: 'Ignorar o alerta enquanto não houver falha.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 47, titulo: '🛤️ Oscilação Anormal do Vagão', criticidade: 'grave', descricao: 'O monitoramento identifica oscilação acima do comportamento esperado.', opcoes: [{ texto: 'Reduzir a exposição ao risco e avaliar a composição.', correta: true, pontos: 100 }, { texto: 'Aumentar a velocidade para estabilizar o movimento.', correta: false, penalidade: -80 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 48, titulo: '🛤️ Falha de Monitoramento', criticidade: 'moderado', descricao: 'O sistema perde temporariamente dados de um equipamento monitorado.', opcoes: [{ texto: 'Reduzir a dependência do dado perdido e validar a condição por outras fontes.', correta: true, pontos: 70 }, { texto: 'Assumir que o equipamento está normal.', correta: false, penalidade: -50 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 49, titulo: '🛤️ Múltiplos Alertas Mecânicos', criticidade: 'critico', descricao: 'Mais de um componente apresenta sinais simultâneos de anormalidade.', opcoes: [{ texto: 'Priorizar a integridade do trem e iniciar avaliação integrada.', correta: true, pontos: 150 }, { texto: 'Tratar cada alerta isoladamente e manter o movimento.', correta: false, penalidade: -100 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
    { id: 50, titulo: '🛤️ Risco Elevado de Integridade do Trem', criticidade: 'critico', descricao: 'O conjunto de indicadores aponta necessidade de intervenção imediata.', opcoes: [{ texto: 'Executar a resposta operacional de maior segurança e solicitar avaliação.', correta: true, pontos: 150 }, { texto: 'Prosseguir normalmente para evitar impacto no cronograma.', correta: false, penalidade: -100 }], risco: 'Risco operacional associado à ocorrência. Requer acompanhamento e decisão do operador.' },
  ];

  /*
   * OCORRÊNCIAS DE RACIOCÍNIO — PEGADINHAS E EFEITOS COLATERAIS
   * Opções plausíveis, porém incorretas, para exigir análise do impacto
   * sobre outras operações. São cenários didáticos do CCO 4.0.
   */
  const pegadinhasIncidentes = {
    1: 'Liberar a próxima composição para ganhar tempo e, depois, reorganizar o pátio.',
    3: 'Priorizar o movimento mais atrasado sem avaliar o conflito com a outra composição.',
    6: 'Acelerar a saída das composições para abrir espaço, mantendo todas as novas entradas.',
    8: 'Liberar o trem com menor atraso primeiro e decidir sobre o segundo somente quando ele chegar à região.',
    11: 'Escolher a prioridade com maior impacto local, mesmo que isso aumente o risco no restante da malha.',
    12: 'Aceitar mais uma entrada para evitar fila externa e tratar a ocupação crítica depois.',
    13: 'Reduzir pouco a velocidade e manter o movimento até o próximo ponto de monitoramento.',
    14: 'Esperar uma segunda confirmação automática antes de restringir a circulação.',
    15: 'Manter a composição em movimento e registrar o impacto para análise posterior.',
    17: 'Usar o último valor confiável do sensor como se ele ainda representasse a condição atual.',
    18: 'Ignorar o alerta isolado porque os demais indicadores continuam dentro da faixa esperada.',
    21: 'Reduzir o consumo de uma composição mesmo que isso transfira o esforço para outra operação crítica.',
    24: 'Recuperar o atraso aumentando a velocidade antes de verificar a restrição que vem na sequência.',
    26: 'Manter potência elevada até próximo do limite para garantir margem de velocidade.',
    29: 'Recuperar todo o atraso de uma vez, aproveitando os trechos de maior velocidade.',
    30: 'Entrar na curva com a aceleração atual e reduzir somente depois de estabilizar o movimento.',
    32: 'Manter o perfil atual para não comprometer o prazo e compensar o consumo em outra etapa.',
    34: 'Esperar a confirmação visual da restrição para só então iniciar a adequação do perfil.',
    36: 'Acelerar antes da restrição e aceitar uma margem operacional menor para recuperar o atraso.',
    44: 'Tratar a temperatura e a vibração separadamente para evitar interromper duas frentes de operação.',
    49: 'Priorizar apenas o alerta de maior valor e deixar os demais para uma análise posterior.',
    50: 'Manter a circulação para evitar impacto no cronograma e intervir somente se outro indicador piorar.'
  };

  Object.entries(pegadinhasIncidentes).forEach(([id, texto]) => {
    const item = bancoIncidentes.find(x => Number(x.id) === Number(id));
    if (item && Array.isArray(item.opcoes) && !item.opcoes.some(o => o.texto === texto)) {
      item.opcoes.push({ texto, correta: false, penalidade: item.criticidade === 'critico' ? -120 : -70 });
    }
  });


  /*
   * BANCO DE OCORRÊNCIAS DO TREINAMENTO
   * Cada clique em "SIMULAR" sorteia uma situação diferente.
   * A dificuldade define o valor do acerto e a penalidade.
   */
  const bancoOcorrencias = {
    'mod-malha': [
      {
        id: 'malha-ramp',
        dificuldade: 'grave',
        titulo: '⚠️ Gargalo de Pátio RAMP',
        mensagem: 'Ocupação do Pátio RAMP ultrapassou a capacidade nominal e há risco de retenção das próximas composições.',
        recomendacao: 'Redistribuir o fluxo e controlar a entrada de novas composições até a normalização da capacidade.',
        pergunta: 'Qual decisão reduz o risco sem agravar o congestionamento?',
        opcoes: [
          { texto: 'Redirecionar parte do fluxo para a Via Secundária 2 e acompanhar a capacidade.', correta: true, pontos: 100 },
          { texto: 'Aumentar a entrada das composições para liberar o pátio mais rapidamente.', correta: false, penalidade: -80 }
        ],
        banner: 'ALERTA: Gargalo operacional no Pátio RAMP (KM 42).',
        visual: 'ramp'
      },
      {
        id: 'malha-ocupacao',
        dificuldade: 'moderado',
        titulo: '🟡 Ocupação Elevada de Trecho',
        mensagem: 'A ocupação do trecho operacional está acima da faixa planejada para o próximo ciclo.',
        recomendacao: 'Reduzir o fluxo de entrada e reorganizar a sequência das composições.',
        pergunta: 'Qual ação é mais adequada para recuperar a margem operacional?',
        opcoes: [
          { texto: 'Reorganizar a sequência e controlar novas entradas até reduzir a ocupação.', correta: true, pontos: 60 },
          { texto: 'Manter todas as entradas para evitar qualquer atraso no pátio.', correta: false, penalidade: -45 }
        ],
        banner: 'ATENÇÃO: Ocupação elevada detectada no trecho operacional.',
        visual: 'ocupacao'
      },
      {
        id: 'malha-rota',
        dificuldade: 'critico',
        titulo: '🚨 Conflito de Rota',
        mensagem: 'Duas composições se aproximam de uma região com conflito operacional de rota.',
        recomendacao: 'Priorizar a composição com maior restrição operacional e manter a outra em condição segura.',
        pergunta: 'Qual decisão deve ser tomada diante do conflito?',
        opcoes: [
          { texto: 'Manter uma composição em condição segura e liberar a rota prioritária de forma controlada.', correta: true, pontos: 180 },
          { texto: 'Liberar as duas composições simultaneamente para reduzir o tempo de espera.', correta: false, penalidade: -140 }
        ],
        banner: 'CRÍTICO: Conflito de rota exige intervenção do CCO.',
        visual: 'conflito'
      },
      {
        id: 'malha-sinal',
        dificuldade: 'grave',
        titulo: '🚦 Inconsistência de Sinalização',
        mensagem: 'Foi identificada indicação inconsistente em um ponto de sinalização da malha.',
        recomendacao: 'Restringir a circulação no ponto e solicitar verificação antes de normalizar a rota.',
        pergunta: 'Qual resposta preserva a segurança operacional?',
        opcoes: [
          { texto: 'Restringir a circulação e solicitar verificação da sinalização antes de liberar a rota.', correta: true, pontos: 110 },
          { texto: 'Manter a circulação normal enquanto aguarda uma nova atualização do sistema.', correta: false, penalidade: -90 }
        ],
        banner: 'ALERTA: Inconsistência de sinalização identificada na malha.',
        visual: 'sinal'
      }
    ],
    'mod-ia': [
      {
        id: 'ia-hotbox',
        dificuldade: 'grave',
        titulo: '🔥 HotBox em Elevação',
        mensagem: 'O monitoramento preditivo identificou temperatura elevada no rolamento do vagão VL-862.',
        recomendacao: 'Reduzir o risco operacional e encaminhar a composição para inspeção preventiva.',
        pergunta: 'Qual ação deve ser tomada diante da elevação térmica?',
        opcoes: [
          { texto: 'Reduzir o risco e encaminhar a composição para inspeção preventiva.', correta: true, pontos: 120 },
          { texto: 'Manter a velocidade nominal enquanto a temperatura não ultrapassar o limite máximo.', correta: false, penalidade: -100 }
        ],
        banner: 'ALERTA: HotBox em elevação detectado pela IA preditiva.',
        visual: 'hotbox'
      },
      {
        id: 'ia-wild',
        dificuldade: 'grave',
        titulo: '📈 Impacto WILD Acima do Padrão',
        mensagem: 'O detector WILD identificou impacto de roda acima do comportamento esperado no vagão VL-862.',
        recomendacao: 'Programar inspeção do conjunto de roda antes da continuidade normal da operação.',
        pergunta: 'Qual decisão reduz a probabilidade de agravamento?',
        opcoes: [
          { texto: 'Encaminhar o conjunto para inspeção e restringir a condição operacional até a avaliação.', correta: true, pontos: 130 },
          { texto: 'Continuar a operação e aguardar uma nova leitura para confirmar a tendência.', correta: false, penalidade: -100 }
        ],
        banner: 'ALERTA: Impacto WILD acima do padrão detectado.',
        visual: 'wild'
      },
      {
        id: 'ia-saude',
        dificuldade: 'moderado',
        titulo: '🧠 Queda de Confiabilidade da Composição',
        mensagem: 'O modelo preditivo identificou redução da confiabilidade estimada da composição.',
        recomendacao: 'Antecipar a inspeção preventiva e acompanhar a tendência dos sensores.',
        pergunta: 'Como agir diante da queda de confiabilidade preditiva?',
        opcoes: [
          { texto: 'Antecipar a inspeção preventiva e manter o monitoramento contínuo.', correta: true, pontos: 80 },
          { texto: 'Ignorar a previsão até que um sensor físico indique uma falha confirmada.', correta: false, penalidade: -60 }
        ],
        banner: 'ATENÇÃO: Queda de confiabilidade preditiva detectada.',
        visual: 'saude'
      },
      {
        id: 'ia-combinada',
        dificuldade: 'critico',
        titulo: '🚨 Anomalia Combinada HotBox + WILD',
        mensagem: 'Temperatura elevada e impacto de roda acima do padrão foram detectados simultaneamente.',
        recomendacao: 'Tratar a ocorrência como prioritária e encaminhar a composição para avaliação técnica.',
        pergunta: 'Qual resposta é mais adequada diante das duas evidências simultâneas?',
        opcoes: [
          { texto: 'Priorizar a composição, restringir sua condição operacional e solicitar avaliação técnica.', correta: true, pontos: 200 },
          { texto: 'Aguardar a confirmação de uma terceira variável antes de alterar a condição operacional.', correta: false, penalidade: -160 }
        ],
        banner: 'CRÍTICO: Anomalia combinada detectada pela IA.',
        visual: 'combinada'
      }
    ],
    'mod-eco': [
      {
        id: 'eco-consumo',
        dificuldade: 'moderado',
        titulo: '⛽ Consumo Acima da Meta',
        mensagem: 'A condução atual está elevando o consumo de combustível acima da meta do trecho.',
        recomendacao: 'Aplicar condução econômica progressiva e acompanhar a resposta do consumo.',
        pergunta: 'Qual ação melhora a eficiência sem comprometer a operação?',
        opcoes: [
          { texto: 'Aplicar condução econômica progressiva e acompanhar o consumo.', correta: true, pontos: 70 },
          { texto: 'Manter potência elevada durante todo o trecho para criar margem de velocidade.', correta: false, penalidade: -50 }
        ],
        banner: 'ALERTA: Consumo acima da meta no trecho atual.',
        visual: 'consumo'
      },
      {
        id: 'eco-restricao',
        dificuldade: 'grave',
        titulo: '🛤️ Restrição Operacional à Frente',
        mensagem: 'O sistema identificou uma redução de velocidade prevista no trecho à frente.',
        recomendacao: 'Antecipar a redução de potência e realizar a transição de velocidade de forma progressiva.',
        pergunta: 'Como preservar eficiência e controle do trem?',
        opcoes: [
          { texto: 'Antecipar a redução de potência e ajustar a velocidade progressivamente.', correta: true, pontos: 100 },
          { texto: 'Manter potência até a proximidade da restrição e frear de forma mais intensa.', correta: false, penalidade: -80 }
        ],
        banner: 'ATENÇÃO: Restrição operacional prevista à frente.',
        visual: 'restricao'
      },
      {
        id: 'eco-atraso',
        dificuldade: 'grave',
        titulo: '⏱️ Recuperação de Atraso',
        mensagem: 'A composição apresenta atraso operacional e o algoritmo identificou oportunidade de recuperação.',
        recomendacao: 'Recuperar o atraso de forma gradual, evitando picos desnecessários de consumo.',
        pergunta: 'Qual estratégia equilibra tempo e eficiência?',
        opcoes: [
          { texto: 'Recuperar o atraso gradualmente, mantendo a condução dentro da faixa eficiente.', correta: true, pontos: 100 },
          { texto: 'Aplicar potência máxima até eliminar completamente o atraso acumulado.', correta: false, penalidade: -75 }
        ],
        banner: 'ATENÇÃO: Atraso operacional exige ajuste de condução.',
        visual: 'atraso'
      },
      {
        id: 'eco-curva',
        dificuldade: 'critico',
        titulo: '🚨 Curva + Aceleração Inadequada',
        mensagem: 'O perfil do trecho combina uma curva próxima com aceleração acima da estratégia recomendada.',
        recomendacao: 'Antecipar a redução de potência e estabilizar a composição antes da curva.',
        pergunta: 'Qual é a melhor resposta operacional?',
        opcoes: [
          { texto: 'Antecipar a redução de potência e estabilizar a composição antes da curva.', correta: true, pontos: 170 },
          { texto: 'Manter aceleração para atravessar a curva rapidamente e recuperar tempo.', correta: false, penalidade: -130 }
        ],
        banner: 'CRÍTICO: Perfil de condução inadequado antes de curva.',
        visual: 'curva'
      }
    ],
    'mod-descarrilamento': [
      {
        id: 'desc-vibracao',
        dificuldade: 'grave',
        titulo: '📳 Vibração Elevada no Truque',
        mensagem: 'O sensor triaxial identificou vibração acima do padrão no conjunto monitorado.',
        recomendacao: 'Reduzir a condição operacional e solicitar inspeção do truque afetado.',
        pergunta: 'Qual é a resposta mais segura para a anomalia?',
        opcoes: [
          { texto: 'Reduzir a condição operacional e acionar inspeção do truque afetado.', correta: true, pontos: 130 },
          { texto: 'Continuar a operação até o próximo ponto de manutenção programada.', correta: false, penalidade: -110 }
        ],
        banner: 'ALERTA: Vibração elevada detectada no truque.',
        visual: 'vibracao'
      },
      {
        id: 'desc-temperatura',
        dificuldade: 'grave',
        titulo: '🌡️ Temperatura do Truque Elevada',
        mensagem: 'O monitoramento identificou temperatura acima do comportamento nominal no conjunto do truque.',
        recomendacao: 'Restringir a operação e verificar o conjunto antes de liberar a composição.',
        pergunta: 'Como responder à elevação de temperatura?',
        opcoes: [
          { texto: 'Restringir a operação e encaminhar o conjunto para inspeção.', correta: true, pontos: 120 },
          { texto: 'Aumentar a velocidade para reduzir rapidamente o tempo de exposição ao trecho.', correta: false, penalidade: -100 }
        ],
        banner: 'ALERTA: Temperatura elevada no truque.',
        visual: 'temperatura'
      },
      {
        id: 'desc-roda',
        dificuldade: 'grave',
        titulo: '🛞 Comportamento Anormal de Roda',
        mensagem: 'O sensor DED indicou comportamento anormal em uma roda da composição.',
        recomendacao: 'Retirar a composição da condição operacional normal e inspecionar o conjunto.',
        pergunta: 'Qual ação deve ser priorizada?',
        opcoes: [
          { texto: 'Retirar a composição da condição normal e inspecionar o conjunto afetado.', correta: true, pontos: 140 },
          { texto: 'Liberar a composição após uma verificação visual rápida e seguir viagem.', correta: false, penalidade: -120 }
        ],
        banner: 'ALERTA: Comportamento anormal de roda detectado.',
        visual: 'roda'
      },
      {
        id: 'desc-combinada',
        dificuldade: 'critico',
        titulo: '🚨 Emergência Mecânica Combinada',
        mensagem: 'Vibração elevada, temperatura anormal e comportamento de roda foram identificados na mesma composição.',
        recomendacao: 'Manter a composição em condição segura e acionar avaliação técnica imediata.',
        pergunta: 'Qual resposta deve ser priorizada diante do conjunto de sinais?',
        opcoes: [
          { texto: 'Manter a composição em condição segura e acionar avaliação técnica imediata.', correta: true, pontos: 220 },
          { texto: 'Continuar até um ponto mais conveniente para inspeção, monitorando os sensores.', correta: false, penalidade: -180 }
        ],
        banner: 'CRÍTICO: Conjunto de anomalias mecânicas exige intervenção imediata.',
        visual: 'combinada'
      }
    ]
  };

  function sortearOcorrencia(tab) {
    const lista = bancoOcorrencias[tab] || [];
    if (!lista.length) return null;

    // Evita repetir a mesma ocorrência duas vezes seguidas no mesmo módulo.
    const anteriores = ccoEvents.filter(e => e.origemTab === tab).slice(0, 2).map(e => e.ocorrenciaId);
    const disponiveis = lista.filter(item => !anteriores.includes(item.id));
    const pool = disponiveis.length ? disponiveis : lista;

    return { ...pool[Math.floor(Math.random() * pool.length)] };
  }

  const decisoesCCO = {
    ramp: {
      pergunta: 'Qual é a melhor decisão operacional para normalizar o pátio?',
      opcoes: [
        { texto: 'Redirecionar parte do fluxo para a Via Secundária 2 e acompanhar a capacidade.', correta: true, pontos: 100 },
        { texto: 'Forçar a entrada da composição principal para liberar o pátio mais rapidamente.', correta: false, penalidade: -80 }
      ]
    },
    ia: {
      pergunta: 'Diante da indicação preditiva, qual ação deve ser tomada?',
      opcoes: [
        { texto: 'Reduzir o risco e encaminhar a composição para inspeção preventiva.', correta: true, pontos: 150 },
        { texto: 'Manter a velocidade nominal e aguardar uma confirmação de falha física.', correta: false, penalidade: -100 }
      ]
    },
    eco: {
      pergunta: 'Qual decisão reduz o consumo sem comprometer a operação?',
      opcoes: [
        { texto: 'Aplicar a recomendação Eco-Driving e acompanhar o consumo no trecho.', correta: true, pontos: 70 },
        { texto: 'Manter potência máxima para garantir margem operacional durante todo o trecho.', correta: false, penalidade: -50 }
      ]
    },
    descarrilamento: {
      pergunta: 'Qual é a resposta mais segura para a anomalia mecânica detectada?',
      opcoes: [
        { texto: 'Manter a composição em condição segura e acionar inspeção do truque/eixo afetado.', correta: true, pontos: 150 },
        { texto: 'Liberar a composição após uma verificação rápida, sem inspeção do conjunto afetado.', correta: false, penalidade: -120 }
      ]
    }
  };

  const gameChannel = new BroadcastChannel('trem_simulation_channel');

  document.addEventListener('DOMContentLoaded', () => {
    initEcoChart();
    initVibrationChart();
    updateUIForCurrentTab();
    renderizarEventosCCO();
    if (currentTab === 'mod-cco-center') iniciarPrazosAssumirCCO();
    atualizarStatusCentralCCO();

    inicializarTelaLogin();

    // Restaura a preferência de som de alerta salva no dispositivo.
    try { ccoSomAtivo = localStorage.getItem('cco40_som') !== '0'; } catch (e) {}
    const btnSom = document.getElementById('btn-sound');
    if (btnSom) {
      btnSom.textContent = ccoSomAtivo ? '🔊' : '🔇';
      btnSom.classList.toggle('muted', !ccoSomAtivo);
      btnSom.title = ccoSomAtivo ? 'Desativar som de alerta' : 'Ativar som de alerta';
    }

    atualizarTabSlider();
    window.addEventListener('resize', () => { atualizarTabSlider(); });
  });

  /* ==========================================================================
     GERENCIAMENTO DE NAVEGAÇÃO ENTRE MÓDULOS (ABAS)
     ========================================================================== */
  function switchTab(tabId, element) {
    currentTab = tabId;

    // Feedback de "carregamento" sutil ao trocar de módulo.
    const loader = document.getElementById('module-loader');
    if (loader) {
      loader.classList.remove('visible');
      void loader.offsetWidth;
      loader.classList.add('visible');
      clearTimeout(loader._shimmerT);
      loader._shimmerT = setTimeout(() => loader.classList.remove('visible'), 600);
    }

    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));

    if (element) {
      element.classList.add('active');
    } else {
      const targetBtn = Array.from(tabButtons).find(btn => 
        btn.getAttribute('onclick')?.includes(tabId)
      );
      if (targetBtn) targetBtn.classList.add('active');
    }

    const modules = document.querySelectorAll('.module');
    modules.forEach(mod => mod.classList.remove('active'));

    const activeModule = document.getElementById(tabId);
    if (activeModule) {
      activeModule.classList.add('active');
    }

    if (tabId === 'mod-ia') {
      simularModuloIA(true);
    } else if (tabId === 'mod-eco') {
      simularModuloEco(true);
    } else if (tabId === 'mod-descarrilamento') {
      // Ao retornar à página 4, o estado visual volta ao normal e a animação é retomada.
      simularModuloDescarrilamento(true);
      retomarAnimacaoTrem();
    } else if (tabId === 'mod-cco-center') {
      // O prazo para assumir começa quando o operador ENTRA na Central CCO,
      // e não quando a simulação foi disparada. Assim o operador sempre recebe
      // o prazo completo para analisar e assumir a ocorrência.
      iniciarPrazosAssumirCCO();
    }

    updateUIForCurrentTab();
    atualizarBloqueioVisual();
    setTimeout(() => animarContadoresNoModulo(activeModule), 260);
    atualizarTabSlider();
  }

  function animarContadoresNoModulo(moduloEl) {
    if (!moduloEl) return;
    moduloEl.querySelectorAll('.metric-value, .metric-val').forEach(el => {
      const alvoOriginal = (el.innerText || '').trim();
      const alvo = alvoOriginal.replace(/([+-])\s+/, '$1');
      const m = /^(-?\d+(?:\.\d+)?)([\s\S]*)$/.exec(alvo);
      if (!m) return;
      const fim = parseFloat(m[1]);
      if (isNaN(fim) || fim === 0) return;
      const sufixo = m[2];
      const duracao = 650;
      const inicio = performance.now();
      const animar = agora => {
        const p = Math.min((agora - inicio) / duracao, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const atual = fim * eased;
        el.innerText = (fim % 1 === 0 ? String(Math.round(atual)) : atual.toFixed(1)) + sufixo;
        if (p < 1) requestAnimationFrame(animar);
        else el.innerText = alvoOriginal;
      };
      requestAnimationFrame(animar);
    });
  }

  function atualizarTabSlider() {
    const nav = document.querySelector('.nav-tabs');
    const slider = document.getElementById('tab-slider');
    if (!nav || !slider) return;

    const activeBtn = nav.querySelector('.tab-btn.active');
    if (!activeBtn) {
      slider.style.opacity = '0';
      return;
    }

    slider.style.opacity = '1';
    slider.style.left = activeBtn.offsetLeft + 'px';
    slider.style.width = activeBtn.offsetWidth + 'px';
  }

  function updateUIForCurrentTab() {
    const btn1 = document.getElementById('btn-action-1');
    const btn2 = document.getElementById('btn-action-2');
    const bannerText = document.getElementById('banner-text');

    if (!btn1 || !btn2 || !bannerText) return;

    btn1.style.display = 'inline-block';
    // O botão verde (simulação de IA) existe apenas na página 4 — Prevenção de Descarrilamento.
    btn2.style.display = currentTab === 'mod-descarrilamento' ? 'inline-block' : 'none';

    // A Central CCO é uma tela de monitoramento: não possui ações de simulação.
    const controlPanel = document.querySelector('.control-panel');
    if (controlPanel) {
      controlPanel.style.display = currentTab === 'mod-cco-center' ? 'none' : 'flex';
    }

    switch (currentTab) {
      case 'mod-malha':
        bannerText.innerText = "Análise Dinâmica de Via: Pátio RAMP operando normalmente.";
        bannerText.style.color = "#e2e8f0";
        btn1.innerText = "💥 1. SIMULAR CONGESTIONAMENTO RAMP";
        break;

      case 'mod-ia':
        bannerText.innerText = "Sistemas Preditivos: Monitoramento de eixos e temperaturas ativo.";
        bannerText.style.color = "#e2e8f0";
        btn1.innerText = "💥 1. SIMULAR SOBREAQUECIMENTO";
        break;

      case 'mod-eco':
        bannerText.innerText = "Eco-Driving: Algoritmo de aceleração atuando na composição.";
        bannerText.style.color = "#e2e8f0";
        btn1.innerText = "💥 1. SIMULAR MODO MANUAL (DESECOLÓGICO)";
        break;

      case 'mod-descarrilamento':
        bannerText.innerText = "Prevenção de Descarrilamento: Leitura de estabilidade do truque normal.";
        bannerText.style.color = "#e2e8f0";
        btn1.innerText = "💥 1. SIMULAR DESCARRILAMENTO";
        btn2.innerText = "🛡️ PROTOCOLO SEGURANÇA IA";
        break;

      case 'mod-cco-center':
        bannerText.innerText = "Central CCO 4.0: Visualização integrada e log de eventos em tempo real.";
        bannerText.style.color = "#e2e8f0";
        btn1.innerText = "💥 1. SIMULAR ALERTA GLOBAL CCO";
        break;
    }
  }

  /* ==========================================================================
     GERENCIADOR DE SIMULAÇÕES
     ========================================================================== */
  function executarSimulacaoAtual(isSafe) {
    // Registra no histórico do operador as ações feitas nas simulações de treinamento.
    // Esses registros são separados dos eventos detalhados do GAME OFICIAL.
    const nomesTabs = {
      'mod-malha': 'Malha & RAMP',
      'mod-ia': 'IA Preditiva',
      'mod-eco': 'Eco-Driving',
      'mod-descarrilamento': 'Prevenção de Descarrilamento',
      'mod-cco-center': 'Central CCO'
    };
    const btn = isSafe ? document.getElementById('btn-action-2') : document.getElementById('btn-action-1');
    const textoAcao = btn?.innerText?.replace(/^💥\s*1\.\s*|^🛡️\s*/, '').trim() || (isSafe ? 'Ação segura' : 'Simulação de ocorrência');
    publicarEventoGameFirebase({
      type: 'CCO_SIMULATION_ACTION',
      titulo: isSafe ? 'Ação de prevenção executada' : 'Simulação executada',
      mensagem: `${nomesTabs[currentTab] || 'Simulação'} • ${textoAcao}`,
      origem: nomesTabs[currentTab] || 'Simulação',
      decisao: textoAcao,
      correct: null,
      points: 0
    });

    switch (currentTab) {
      case 'mod-malha':
        simularModuloMalha(isSafe);
        break;
      case 'mod-ia':
        simularModuloIA(isSafe);
        break;
      case 'mod-eco':
        simularModuloEco(isSafe);
        break;
      case 'mod-descarrilamento':
        if (isSafe) {
          ativarProtocoloSegurancaIA();
        } else {
          simularModuloDescarrilamento(false);
        }
        break;
      case 'mod-cco-center':
        // A Central CCO não gera simulações próprias; apenas recebe e trata eventos.
        atualizarStatusCentralCCO();
        break;
    }
  }

  function simularModuloMalha(isSafe) {
    const rampTrack = document.getElementById('problem-track-1');
    const rampZone = document.getElementById('ramp-zone');

    if (isCurrentTabBlocked()) return;

    // Animação de energia ao longo da via do RAMP a cada ação.
    const rampPulse = document.getElementById('ramp-pulse');
    if (rampPulse) {
      const corPulso = isSafe ? '#10b981' : '#fbbf24';
      rampPulse.style.stroke = corPulso;
      rampPulse.style.filter = `drop-shadow(0 0 6px ${corPulso})`;
      rampPulse.classList.remove('active');
      void rampPulse.offsetWidth;
      rampPulse.classList.add('active');
    }

    // Surge momentâneo em todas as vias da malha.
    const modMalha = document.getElementById('mod-malha');
    if (modMalha) {
      modMalha.classList.remove('sim-pulse');
      void modMalha.offsetWidth;
      modMalha.classList.add('sim-pulse');
      clearTimeout(modMalha._surgeT);
      modMalha._surgeT = setTimeout(() => modMalha.classList.remove('sim-pulse'), 1300);
    }

    if (!isSafe) {
      const ocorrencia = sortearOcorrencia('mod-malha');
      if (!ocorrencia) return;

      if (rampTrack) rampTrack.setAttribute('class', ocorrencia.visual === 'ramp' ? 'track-animated track-warning' : 'track-animated track-active');
      if (rampZone) rampZone.style.display = ocorrencia.visual === 'ramp' ? 'block' : 'none';

      // Tremor rápido de perturbação operacional no congestionamento.
      if (modMalha && ocorrencia.visual === 'ramp') {
        modMalha.classList.remove('sim-shake');
        void modMalha.offsetWidth;
        modMalha.classList.add('sim-shake');
      }

      dispararAlerta(ocorrencia.titulo, ocorrencia.mensagem, ocorrencia);
      atualizarBanner(ocorrencia.banner, ocorrencia.dificuldade === 'critico' ? '#ef4444' : '#f59e0b');
    } else {
      if (rampTrack) rampTrack.setAttribute('class', 'track-active');
      if (rampZone) rampZone.style.display = 'none';
      atualizarBanner("Análise Dinâmica de Via: Pátio RAMP operando normalmente.", "#10b981");
    }
  }

  function simularModuloIA(isSafe) {
    const hotboxVal = document.getElementById('hotbox-val');
    const hotboxUnit = document.getElementById('hotbox-unit');
    const hotboxLabel = document.getElementById('hotbox-label');
    const hotboxBar = document.getElementById('hotbox-bar');
    const wildLabel = document.getElementById('wild-label');
    const wildVal = document.getElementById('wild-val');
    const wildUnit = document.getElementById('wild-unit');
    const wildAlertBox = document.getElementById('wild-alert-box');
    const wildBoxTitle = document.getElementById('wild-box-title');
    const wildBoxText = document.getElementById('wild-box-text');
    const saudeBadge = document.getElementById('saude-badge');
    const saudeVal = document.getElementById('saude-val');
    const riscoVal = document.getElementById('risco-val');

    if (!isSafe) {
      const ocorrencia = sortearOcorrencia('mod-ia');
      if (!ocorrencia) return;

      const critical = ocorrencia.dificuldade === 'critico';
      const isWild = ocorrencia.visual === 'wild';
      const isHealth = ocorrencia.visual === 'saude';

      const temp = isHealth ? '68 °C' : isWild ? '74 °C' : critical ? '95 °C' : '88 °C';
      const wild = isWild ? '2.4 mm' : critical ? '2.8 mm' : '1.8 mm';
      const health = isHealth ? '82.7%' : critical ? '62.1%' : '74.5%';

      if (hotboxVal) { hotboxVal.innerText = temp; hotboxVal.style.color = '#ef4444'; }
      if (hotboxUnit) { hotboxUnit.innerText = isHealth ? '(TENDÊNCIA)' : '(ALERTA)'; hotboxUnit.style.color = '#ef4444'; }
      if (hotboxLabel) { hotboxLabel.innerText = isHealth ? 'ATENÇÃO' : 'CRÍTICO'; hotboxLabel.className = 'badge'; hotboxLabel.style.background = isHealth ? '#f59e0b' : '#ef4444'; hotboxLabel.style.color = '#fff'; }
      if (hotboxBar) { hotboxBar.style.width = isHealth ? '72%' : critical ? '100%' : '90%'; hotboxBar.style.background = isHealth ? '#f59e0b' : '#ef4444'; }

      if (wildLabel) { wildLabel.innerText = isWild || critical ? 'CRÍTICO' : 'ATENÇÃO'; wildLabel.className = 'badge'; wildLabel.style.background = '#ef4444'; wildLabel.style.color = '#fff'; }
      if (wildVal) { wildVal.innerText = wild; wildVal.style.color = '#ef4444'; }
      if (wildUnit) { wildUnit.innerText = '(Anomalia Detectada)'; wildUnit.style.color = '#ef4444'; }
      if (wildAlertBox) { wildAlertBox.style.background = 'rgba(239,68,68,.15)'; wildAlertBox.style.borderLeftColor = '#ef4444'; }
      if (wildBoxTitle) { wildBoxTitle.innerText = critical ? '🚨 ANOMALIA COMBINADA' : '⚠️ AÇÃO PREDITIVA'; wildBoxTitle.style.color = '#ef4444'; }
      if (wildBoxText) { wildBoxText.innerHTML = ocorrencia.recomendacao; }

      if (saudeBadge) { saudeBadge.innerText = health; saudeBadge.className = 'badge'; saudeBadge.style.background = '#ef4444'; saudeBadge.style.color = '#fff'; }
      if (saudeVal) { saudeVal.innerText = health; saudeVal.style.color = '#ef4444'; }
      if (riscoVal) { riscoVal.innerText = critical ? '+85%' : '+42%'; riscoVal.style.color = '#ef4444'; }

      dispararAlerta(ocorrencia.titulo, ocorrencia.mensagem, ocorrencia);
      atualizarBanner(ocorrencia.banner, critical ? '#ef4444' : '#f59e0b');
    } else {
      if (hotboxVal) { hotboxVal.innerText = '42 °C'; hotboxVal.style.color = '#10b981'; }
      if (hotboxUnit) { hotboxUnit.innerText = '(Nominal)'; hotboxUnit.style.color = '#94a3b8'; }
      if (hotboxLabel) { hotboxLabel.innerText = 'Ideal'; hotboxLabel.className = 'badge-success'; hotboxLabel.style.background = ''; hotboxLabel.style.color = ''; }
      if (hotboxBar) { hotboxBar.style.width = '45%'; hotboxBar.style.background = '#10b981'; }
      if (wildLabel) { wildLabel.innerText = 'Normal'; wildLabel.className = 'badge-success'; wildLabel.style.background = ''; wildLabel.style.color = ''; }
      if (wildVal) { wildVal.innerText = '0.2 mm'; wildVal.style.color = '#10b981'; }
      if (wildUnit) { wildUnit.innerText = '(Ideal)'; wildUnit.style.color = '#94a3b8'; }
      if (wildAlertBox) { wildAlertBox.style.background = 'rgba(245,158,11,.1)'; wildAlertBox.style.borderLeftColor = '#f59e0b'; }
      if (wildBoxTitle) { wildBoxTitle.innerText = '⚠️ ANÁLISE PREDITIVA DA IA'; wildBoxTitle.style.color = '#f59e0b'; }
      if (wildBoxText) { wildBoxText.innerHTML = 'Previsão de intervenção em <strong>100 km</strong> (Vagão VL-862).'; }
      if (saudeBadge) { saudeBadge.innerText = 'Alta Confiabilidade'; saudeBadge.className = 'badge-info'; saudeBadge.style.background = ''; saudeBadge.style.color = ''; }
      if (saudeVal) { saudeVal.innerText = '98.4%'; saudeVal.style.color = '#10b981'; }
      if (riscoVal) { riscoVal.innerText = '-70%'; riscoVal.style.color = '#10b981'; }
      atualizarBanner("IA agendou parada técnica preventiva no próximo Pátio de Manutenção.", "#10b981");
    }
  }

  function simularModuloEco(isSafe) {
    const badgeFuel = document.getElementById('badge-fuel');
    const valFuel = document.getElementById('val-fuel');
    const badgeMode = document.getElementById('badge-mode');
    const valMode = document.getElementById('val-mode');
    const valNotch = document.getElementById('val-notch');
    const barEficiencia = document.getElementById('bar-eficiencia');
    const textEficiencia = document.getElementById('text-eficiencia');

    if (!isSafe) {
      const ocorrencia = sortearOcorrencia('mod-eco');
      if (!ocorrencia) return;

      const critical = ocorrencia.dificuldade === 'critico';
      const atraso = ocorrencia.visual === 'atraso';
      const restricao = ocorrencia.visual === 'restricao';

      if (badgeFuel) { badgeFuel.className = 'badge'; badgeFuel.style.background = critical ? '#ef4444' : '#f59e0b'; badgeFuel.style.color = '#fff'; badgeFuel.innerText = 'Fora da Meta'; }
      if (valFuel) { valFuel.style.color = '#ef4444'; valFuel.innerText = atraso ? '+ 11.8% L/tkm' : critical ? '+ 21.0% L/tkm' : '+ 18.0% L/tkm'; }
      if (badgeMode) { badgeMode.className = 'badge'; badgeMode.style.background = '#f59e0b'; badgeMode.style.color = '#fff'; badgeMode.innerText = 'Atenção'; }
      if (valMode) { valMode.style.color = '#ef4444'; valMode.innerText = restricao ? 'Transição Inadequada' : 'Condução Ineficiente'; }
      if (valNotch) { valNotch.innerText = critical ? 'Notch 8 (Risco)' : 'Notch 7 (Acima do Ideal)'; valNotch.style.color = '#ef4444'; }
      if (barEficiencia) { barEficiencia.style.width = critical ? '35%' : '52%'; barEficiencia.style.background = '#ef4444'; }
      if (textEficiencia) { textEficiencia.innerText = ocorrencia.mensagem; textEficiencia.style.color = '#ef4444'; }

      if (ecoChartInstance) {
        const iaDataset = ecoChartInstance.data.datasets[1];
        iaDataset.label = 'IA Eco-Assist (Ocorrência)';
        iaDataset.borderColor = '#ef4444';
        iaDataset.backgroundColor = 'rgba(239,68,68,.15)';
        iaDataset.data = atraso ? [14.2, 15.0, 15.8, 16.2, 15.6, 16.0] : [15.8, 16.4, 17.1, 16.8, 17.5, 17.0];
        ecoChartInstance.update();
      }

      dispararAlerta(ocorrencia.titulo, ocorrencia.mensagem, ocorrencia);
      atualizarBanner(ocorrencia.banner, critical ? '#ef4444' : '#f59e0b');
    } else {
      if (badgeFuel) { badgeFuel.className = 'badge-success'; badgeFuel.style.background = ''; badgeFuel.style.color = ''; badgeFuel.innerText = 'Meta Atingida'; }
      if (valFuel) { valFuel.style.color = '#10b981'; valFuel.innerText = '- 14.2% L/tkm'; }
      if (badgeMode) { badgeMode.className = 'badge-success'; badgeMode.style.background = ''; badgeMode.style.color = ''; badgeMode.innerText = 'Ativo'; }
      if (valMode) { valMode.style.color = '#10b981'; valMode.innerText = 'IA Eco-Assist Ativa'; }
      if (valNotch) { valNotch.innerText = 'Notch 4 (Otimizado)'; valNotch.style.color = '#10b981'; }
      if (barEficiencia) { barEficiencia.style.width = '92%'; barEficiencia.style.background = '#10b981'; }
      if (textEficiencia) { textEficiencia.innerText = '92% das metas de Eco-Driving atingidas no trecho'; textEficiencia.style.color = '#94a3b8'; }
      if (ecoChartInstance) {
        const iaDataset = ecoChartInstance.data.datasets[1];
        iaDataset.label = 'IA Eco-Assist (Atual)';
        iaDataset.borderColor = '#10b981';
        iaDataset.backgroundColor = 'rgba(16,185,129,.1)';
        iaDataset.data = [14.2, 14.0, 14.5, 14.1, 14.3, 14.0];
        ecoChartInstance.update();
      }
      atualizarBanner("Eco-Driving Ativado: Aceleração e frenagem otimizadas para a rampa.", "#10b981");
    }
  }

  function simularModuloDescarrilamento(isSafe) {
    const sparks = document.getElementById('sparks-group');
    const vibrationWrapper = document.getElementById('train-vibration-wrapper');
    const bogieStructure = document.getElementById('bogie-structure');
    const cardBogieStatus = document.getElementById('card-bogie-status');
    const cardBogieVal = document.getElementById('card-bogie-val');
    const cardTempStatus = document.getElementById('card-temp-status');
    const cardTempVal = document.getElementById('card-temp-val');
    const cardDedStatus = document.getElementById('card-ded-status');
    const cardDedVal = document.getElementById('card-ded-val');

    if (!isSafe) {
      const ocorrencia = sortearOcorrencia('mod-descarrilamento');
      if (!ocorrencia) return;

      const critical = ocorrencia.dificuldade === 'critico';
      const temp = ocorrencia.visual === 'temperatura' ? 96 : critical ? 98 : 82;
      const hz = ocorrencia.visual === 'vibracao' ? '88 Hz (1.25G)' : critical ? '94 Hz (1.48G)' : '72 Hz (0.92G)';

      if (sparks) sparks.style.display = critical ? 'block' : 'none';
      if (bogieStructure) bogieStructure.classList.add('bogie-critical');

      const trainGroup = document.getElementById('train-2d-group');
      const wheels = document.querySelectorAll('.wheel-rotate');
      const tracks = document.querySelectorAll('.track-active');
      if (trainGroup) trainGroup.style.animationPlayState = 'paused';
      wheels.forEach(w => w.style.animationPlayState = 'paused');
      tracks.forEach(t => t.style.animationPlayState = 'paused');
      if (vibrationWrapper) {
        vibrationWrapper.classList.remove('shaking');
        vibrationWrapper.classList.add('derailed');
        vibrationWrapper.style.animationPlayState = 'running';
      }

      if (cardBogieStatus) { cardBogieStatus.innerText = critical ? 'Crítico' : 'Alerta'; cardBogieStatus.className = 'badge'; cardBogieStatus.style.background = critical ? '#ef4444' : '#f59e0b'; cardBogieStatus.style.color = '#fff'; }
      if (cardBogieVal) { cardBogieVal.innerText = hz; cardBogieVal.style.color = '#ef4444'; }
      if (cardTempStatus) { cardTempStatus.innerText = temp >= 95 ? 'Crítico' : 'Alerta'; cardTempStatus.className = 'badge'; cardTempStatus.style.background = temp >= 95 ? '#ef4444' : '#f59e0b'; cardTempStatus.style.color = '#fff'; }
      if (cardTempVal) { cardTempVal.innerText = `${temp} °C`; cardTempVal.style.color = '#ef4444'; }
      if (cardDedStatus) { cardDedStatus.innerText = critical ? 'DISPARADO' : 'ATENÇÃO'; cardDedStatus.className = 'badge'; cardDedStatus.style.background = critical ? '#ef4444' : '#f59e0b'; cardDedStatus.style.color = '#fff'; }
      if (cardDedVal) { cardDedVal.innerText = critical ? 'Anomalia Combinada!' : 'Anomalia Detectada'; cardDedVal.style.color = '#ef4444'; }

      if (vibrationChart) {
        vibrationChart.data.datasets[0].data = critical
          ? [0.2, 0.4, 0.9, 1.5, 1.3, 1.7, 1.4, 1.8, 1.5, 1.9]
          : [0.05, 0.2, 0.55, 0.75, 0.8, 0.7, 0.9, 0.82, 0.95, 0.9];
        vibrationChart.data.datasets[0].borderColor = critical ? '#ef4444' : '#f59e0b';
        vibrationChart.data.datasets[0].backgroundColor = critical ? 'rgba(239,68,68,.2)' : 'rgba(245,158,11,.15)';
        vibrationChart.update();
      }

      dispararAlerta(ocorrencia.titulo, ocorrencia.mensagem, ocorrencia);
      atualizarBanner(ocorrencia.banner, critical ? '#ef4444' : '#f59e0b');
    } else {
      if (sparks) sparks.style.display = 'none';
      if (vibrationWrapper) { vibrationWrapper.classList.remove('shaking', 'derailed'); vibrationWrapper.style.animationPlayState = 'running'; }
      if (bogieStructure) bogieStructure.classList.remove('bogie-critical');
      if (cardBogieStatus) { cardBogieStatus.innerText = 'Estável'; cardBogieStatus.className = 'badge-success'; cardBogieStatus.style.background = ''; cardBogieStatus.style.color = ''; }
      if (cardBogieVal) { cardBogieVal.innerText = '12 Hz (0.02G)'; cardBogieVal.style.color = '#10b981'; }
      if (cardTempStatus) { cardTempStatus.innerText = 'Nominal'; cardTempStatus.className = 'badge-success'; cardTempStatus.style.background = ''; cardTempStatus.style.color = ''; }
      if (cardTempVal) { cardTempVal.innerText = '38 °C'; cardTempVal.style.color = '#10b981'; }
      if (cardDedStatus) { cardDedStatus.innerText = 'OK'; cardDedStatus.className = 'badge-success'; cardDedStatus.style.background = ''; cardDedStatus.style.color = ''; }
      if (cardDedVal) { cardDedVal.innerText = 'Monitorando'; cardDedVal.style.color = '#10b981'; }
      if (vibrationChart) {
        vibrationChart.data.datasets[0].data = [0.02,0.01,0.03,0.02,0.02,0.01,0.03,0.02,0.02,0.01];
        vibrationChart.data.datasets[0].borderColor = '#10b981';
        vibrationChart.data.datasets[0].backgroundColor = 'rgba(16,185,129,.1)';
        vibrationChart.update();
      }
      retomarAnimacaoTrem();
      atualizarBanner("Prevenção de Descarrilamento: Leitura de estabilidade do truque normal.", "#10b981");
    }
  }

  function ativarProtocoloSegurancaIA() {
    pararAnimacaoTrem();

    const sparks = document.getElementById('sparks-group');
    const vibrationWrapper = document.getElementById('train-vibration-wrapper');
    const bogieStructure = document.getElementById('bogie-structure');

    if (sparks) sparks.style.display = 'none';
    if (vibrationWrapper) {
      vibrationWrapper.classList.remove('shaking', 'derailed');
      vibrationWrapper.style.animationPlayState = 'paused';
    }
    if (bogieStructure) bogieStructure.classList.remove('bogie-critical');

    const cardBogieStatus = document.getElementById('card-bogie-status');
    const cardBogieVal = document.getElementById('card-bogie-val');
    const cardDedStatus = document.getElementById('card-ded-status');
    const cardDedVal = document.getElementById('card-ded-val');

    if (cardBogieStatus) { cardBogieStatus.innerText = 'Freando'; cardBogieStatus.className = 'badge'; cardBogieStatus.style.background = '#f59e0b'; cardBogieStatus.style.color = '#ffffff'; }
    if (cardBogieVal) { cardBogieVal.innerText = '0 Hz (0.00G)'; cardBogieVal.style.color = '#f59e0b'; }
    if (cardDedStatus) { cardDedStatus.innerText = 'EMERGÊNCIA'; cardDedStatus.className = 'badge'; cardDedStatus.style.background = '#f59e0b'; cardDedStatus.style.color = '#ffffff'; }
    if (cardDedVal) { cardDedVal.innerText = 'Frenagem Automática'; cardDedVal.style.color = '#f59e0b'; }

    atualizarBanner("PROTOCOLO IA ATIVO: Frenagem de emergência acionada. Aguardando decisão da Central CCO.", "#f59e0b");
    
    dispararAlertaDecisaoCCO(
      "🛑 FRENAGEM DE EMERGÊNCIA ACIONADA", 
      "O Protocolo de Segurança da IA efetuou a parada automática da composição VALE 862 no KM 108. Selecione a ação de campo para a Central CCO:"
    );
  }

  function dispararAlertaDecisaoCCO(titulo, mensagem) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: titulo,
        text: mensagem,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#08005c',
        cancelButtonColor: '#f59e0b',
        confirmButtonText: '👷‍♂️ Enviar Equipe de Campo',
        cancelButtonText: '🚂 Solicitar Verificação do Maquinista',
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) {
          adicionarNotificacaoSidebar("👷 EQUIPE ENVIADA", "Central CCO despachou equipe de manutenção preventiva ao KM 108.");
          atualizarBanner("Central CCO: Equipe de campo em deslocamento para inspeção técnica.", "#38bdf8");
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          adicionarNotificacaoSidebar("🚂 INSPEÇÃO MAQUINISTA", "Maquinista instruído a desembarcar e realizar verificação no local.");
          atualizarBanner("Central CCO: Maquinista realizando inspeção visual de segurança.", "#38bdf8");
        }
      });
    } else {
      dispararAlerta(titulo, mensagem);
    }
  }

  /* --- CONTROLE DE ANIMAÇÃO DE TREM --- */
  function pararAnimacaoTrem() {
    const trainGroup = document.getElementById('train-2d-group');
    const vibrationWrapper = document.getElementById('train-vibration-wrapper');
    const wheels = document.querySelectorAll('.wheel-rotate');
    const tracks = document.querySelectorAll('.track-active');

    if (trainGroup) trainGroup.style.animationPlayState = 'paused';
    if (vibrationWrapper) vibrationWrapper.style.animationPlayState = 'paused';
    wheels.forEach(wheel => wheel.style.animationPlayState = 'paused');
    tracks.forEach(track => track.style.animationPlayState = 'paused');
  }

  function retomarAnimacaoTrem() {
    const trainGroup = document.getElementById('train-2d-group');
    const vibrationWrapper = document.getElementById('train-vibration-wrapper');
    const wheels = document.querySelectorAll('.wheel-rotate');
    const tracks = document.querySelectorAll('.track-active');

    if (trainGroup) trainGroup.style.animationPlayState = 'running';
    if (vibrationWrapper) { vibrationWrapper.classList.remove('shaking', 'derailed'); vibrationWrapper.style.animationPlayState = 'running'; }
    wheels.forEach(wheel => wheel.style.animationPlayState = 'running');
    tracks.forEach(track => track.style.animationPlayState = 'running');
  }

  gameChannel.onmessage = (event) => {
    const { type } = event.data;
    switch (type) {
      case 'TRIGGER_VIBRATION':
        ativarProtocoloSegurancaIA(); 
        break;
      case 'TRIGGER_TEMP':
        pararAnimacaoTrem();
        break;
      case 'TRIGGER_RESET':
        retomarAnimacaoTrem();
        break;
      default:
        console.warn('Comando desconhecido:', type);
    }
  };

  /* ==========================================================================
     SISTEMA DE NOTIFICAÇÕES E ALERTAS POP-UP
     ========================================================================== */
  function criarEventoCCO(titulo, mensagem, ocorrencia = null) {
    const lower = `${titulo} ${mensagem}`.toLowerCase();
    let severidade = 'grave';
    if (lower.includes('crítico') || lower.includes('descarril') || lower.includes('emergência') || lower.includes('sobreaquec')) severidade = 'critico';
    else if (lower.includes('eco') || lower.includes('desecológica')) severidade = 'moderado';

    return {
      id: Date.now() + Math.random(),
      titulo,
      mensagem,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      severidade,
      status: 'pendente',
      origem: currentTab === 'mod-malha' ? 'Malha & RAMP' : currentTab === 'mod-ia' ? 'IA Preditiva' : currentTab === 'mod-eco' ? 'Eco-Driving' : currentTab === 'mod-descarrilamento' ? 'Prevenção de Descarrilamento' : 'Plataforma',
      origemTab: currentTab,
      ocorrenciaId: ocorrencia?.id || null,
      dificuldade: ocorrencia?.dificuldade || severidade,
      recomendacao: ocorrencia?.recomendacao || gerarRecomendacaoCCO(lower),
      decisao: ocorrencia ? {
        pergunta: ocorrencia.pergunta,
        opcoes: ocorrencia.opcoes.map(o => ({ ...o }))
      } : obterDecisaoCCO(currentTab, lower),
      assumidoEm: null,
      assumeDeadline: null,
      acaoIniciadaEm: null,
      escolha: null,
      resultado: null
    };
  }

  function obterDecisaoCCO(tab, texto) {
    if (texto.includes('ramp') || tab === 'mod-malha') return { ...decisoesCCO.ramp };
    if (texto.includes('eco') || texto.includes('desecológica') || tab === 'mod-eco') return { ...decisoesCCO.eco };
    if (texto.includes('descarril') || texto.includes('vibração') || texto.includes('emergência') || tab === 'mod-descarrilamento') return { ...decisoesCCO.descarrilamento };
    return { ...decisoesCCO.ia };
  }

  function gerarRecomendacaoCCO(texto) {
    if (texto.includes('ramp')) return 'Redistribuir o fluxo operacional e acompanhar a capacidade do pátio antes de normalizar a via.';
    if (texto.includes('temperatura') || texto.includes('hotbox') || texto.includes('sobreaquec')) return 'Reduzir o risco operacional e encaminhar a composição para inspeção preventiva.';
    if (texto.includes('eco') || texto.includes('desecológica')) return 'Aplicar a recomendação Eco-Driving e acompanhar o consumo no trecho.';
    if (texto.includes('descarril') || texto.includes('vibração') || texto.includes('emergência')) return 'Manter a composição em condição segura e acionar inspeção do truque/eixo afetado.';
    return 'Avaliar a ocorrência e executar a ação operacional recomendada pela Central CCO.';
  }

  function dispararAlerta(titulo, mensagem, ocorrencia = null) {
    const modal = document.getElementById('notification-modal');
    const popTitle = document.getElementById('popup-title');
    const popBody = document.getElementById('popup-body');

    if (popTitle) popTitle.innerText = titulo;
    if (popBody) popBody.innerText = mensagem;
    if (modal) modal.classList.add('show');

    adicionarNotificacaoSidebar(titulo, mensagem, ocorrencia);
  }

  function confirmarEIrParaCCO() {
    const modal = document.getElementById('notification-modal');
    if (modal) modal.classList.remove('show');
    const tabCCO = document.getElementById('tab-cco-center');
    switchTab('mod-cco-center', tabCCO);
  }

  function adicionarNotificacaoSidebar(titulo, mensagem, ocorrencia = null) {
    const evento = criarEventoCCO(titulo, mensagem, ocorrencia);
    // Alerta sonoro para eventos críticos e graves (respeitando o mudo do operador).
    if (evento.severidade === 'critico' || evento.severidade === 'grave') tocarAlertaSonoro(evento.severidade);
    ccoEvents.unshift(evento);
    publicarEventoGameFirebase({
      type: 'CCO_EVENT_CREATED',
      titulo: evento.titulo, mensagem: evento.mensagem,
      criticidade: evento.severidade, origem: evento.origem, eventoId: evento.id
    });
    if (currentTab === 'mod-cco-center') {
      evento.assumeDeadline = Date.now() + 60000;
    }
    iniciarRelogioCCO();
    selectedCcoEventId = evento.id;
    renderizarEventosCCO();
    atualizarStatusCentralCCO();
  }

  let ultimoBadgeCount = 0;

  /* --- ALERTA SONORO (WebAudio, sem arquivos externos) --- */
  function tocarAlertaSonoro(severidade) {
    if (!ccoSomAtivo) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const nota = (freq, inicio, dur, tipo = 'square') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = tipo;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + inicio);
        gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + inicio + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + inicio);
        osc.stop(ctx.currentTime + inicio + dur + 0.05);
      };
      if (severidade === 'critico') {
        nota(880, 0, 0.18);
        nota(880, 0.26, 0.18);
        nota(880, 0.52, 0.3);
        nota(440, 0.13, 0.2);
      } else if (severidade === 'grave') {
        nota(660, 0, 0.16);
        nota(660, 0.24, 0.26);
      } else {
        nota(523, 0, 0.16, 'sine');
      }
      setTimeout(() => { try { ctx.close(); } catch (e) {} }, 1500);
    } catch (e) { /* áudio indisponível neste browser */ }
  }

  function alternarSomAlerta() {
    ccoSomAtivo = !ccoSomAtivo;
    const btn = document.getElementById('btn-sound');
    if (btn) {
      btn.textContent = ccoSomAtivo ? '🔊' : '🔇';
      btn.classList.toggle('muted', !ccoSomAtivo);
      btn.title = ccoSomAtivo ? 'Desativar som de alerta' : 'Ativar som de alerta';
    }
    try { localStorage.setItem('cco40_som', ccoSomAtivo ? '1' : '0'); } catch (e) {}
  }

  function renderizarEventosCCO() {
    const container = document.getElementById('notifications-container');
    if (!container) return;

    const ativos = ccoEvents.filter(e => e.status !== 'resolvido');
    notificationCount = ativos.length;

    const badgeCCO = document.getElementById('cco-badge');
    const sidebarBadge = document.getElementById('sidebar-count');
    const tabCco = document.getElementById('tab-cco-center');
    if (tabCco) tabCco.classList.toggle('cco-alert', notificationCount > 0);
    if (badgeCCO) {
      badgeCCO.innerText = notificationCount;
      badgeCCO.style.display = notificationCount ? 'inline-block' : 'none';
      if (notificationCount > ultimoBadgeCount) {
        badgeCCO.classList.remove('badge-pop');
        void badgeCCO.offsetWidth;
        badgeCCO.classList.add('badge-pop');
      }
    }
    ultimoBadgeCount = notificationCount;
    if (sidebarBadge) sidebarBadge.innerText = `${notificationCount} Ativos`;

    // Stagger sutil apenas quando o conteúdo da lista realmente muda.
    const listaKey = ccoEvents.filter(e => e.status !== 'resolvido').map(e => e.id + ':' + e.status).join('|');
    if (container._staggerKey !== listaKey) {
      container._staggerKey = listaKey;
      container.classList.remove('stagger-in');
      void container.offsetWidth;
      container.classList.add('stagger-in');
    }

    if (!ccoEvents.length) {
      container.innerHTML = `<div id="empty-notif-msg" class="empty-notif"><div class="empty-notif-icon">✓</div><strong>Nenhuma ocorrência pendente</strong><span>As simulações dos módulos 1 a 4 aparecerão aqui quando gerarem um evento.</span></div>`;
      renderizarDetalheCCO(null);
      return;
    }

    container.innerHTML = ccoEvents.map(evento => `
      <div class="notif-card ${evento.severidade === 'critico' ? 'critical' : ''} ${evento.status === 'resolvido' ? 'resolved' : ''} ${evento.id === selectedCcoEventId ? 'selected' : ''}" onclick="selecionarEventoCCO('${evento.id}')">
        <div class="notif-head"><span class="notif-title">${evento.titulo}</span><span class="notif-time">${evento.hora}</span></div>
        <div class="notif-desc">${evento.mensagem}</div>
        <div class="notif-action-row"><div class="notif-action"><span>📍</span> ${evento.origem}</div><span class="notif-mini-status ${statusClasseCCO(evento.status)}">${statusTextoCCO(evento.status)}</span></div>
        <div class="notif-event-timer ${segundosRestantes(evento.status === 'pendente' ? evento.assumeDeadline : evento.decisionDeadline) <= 5 && evento.status !== 'resolvido' ? 'timer-critical' : ''}" data-cco-event-id="${evento.id}">⏱ ${formatarTempoEvento(evento)}</div>
      </div>`).join('');

    const selecionado = ccoEvents.find(e => String(e.id) === String(selectedCcoEventId)) || ccoEvents[0];
    selectedCcoEventId = selecionado ? selecionado.id : null;
    renderizarDetalheCCO(selecionado);
  }

  function statusClasseCCO(status) {
    return { pendente:'status-pendente', atendimento:'status-atendimento', acao:'status-acao', resolvido:'status-resolvido' }[status] || 'status-pendente';
  }

  function statusTextoCCO(status) {
    return { pendente:'PENDENTE', atendimento:'EM ATENDIMENTO', acao:'AÇÃO EXECUTADA', resolvido:'RESOLVIDO' }[status] || 'PENDENTE';
  }

  function selecionarEventoCCO(id) {
    const evento = ccoEvents.find(e => String(e.id) === String(id));
    if (!evento) return;
    selectedCcoEventId = evento.id;
    renderizarEventosCCO();
  }

  function limparTimersDecisaoCCO() {
    // Os prazos das ocorrências continuam independentes do bloqueio da simulação.
    // O bloqueio possui seu próprio relógio e não interrompe o relógio do CCO.
  }

  function segundosRestantes(deadline) {
    if (!deadline) return 0;
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  }

  function formatarTempoEvento(evento) {
    if (!evento) return '';
    if (evento.status === 'pendente' && evento.assumeDeadline) return `Tempo para assumir: ${segundosRestantes(evento.assumeDeadline)}s`;
    if (evento.status === 'atendimento' && evento.decisionDeadline) return `Tempo para decidir: ${segundosRestantes(evento.decisionDeadline)}s`;
    if (evento.status === 'acao') return 'Ação executada — aguardando encerramento';
    if (evento.resultado === 'timeout-assumir') return 'Prazo para assumir esgotado';
    if (evento.resultado === 'timeout-decisao') return 'Prazo para decisão esgotado';
    return 'Ocorrência tratada';
  }

  function atualizarRelogiosCCO() {
    const agora = Date.now();
    let houveMudancaDeStatus = false;

    ccoEvents.forEach(evento => {
      if (evento.status === 'pendente' && evento.assumeDeadline && agora >= evento.assumeDeadline) {
        evento.status = 'resolvido';
        evento.resultado = 'timeout-assumir';
        evento.assumidoEm = null;
        gameState.pontuacao = Math.max(0, gameState.pontuacao - 50);
        atualizarPontuacaoUI();
        publicarEventoGameFirebase({ type: 'CCO_TIMEOUT', resultado: 'timeout-assumir', correct: false, titulo: evento.titulo, eventoId: evento.id, points: -50, operador: gameState.operador });
        const alvoAssumir = evento.origemTab || 'mod-malha';
        const jaBloqueadoAssumir = gameState.bloqueiosPorAba[alvoAssumir] && gameState.bloqueiosPorAba[alvoAssumir].deadline > Date.now();
        aplicarBloqueioOperador('Tempo esgotado para assumir a ocorrência.', alvoAssumir);
        atualizarBanner(jaBloqueadoAssumir
          ? 'Tempo esgotado para assumir a ocorrência. -50 pontos (operador já bloqueado — sem novo bloqueio).'
          : 'Tempo esgotado para assumir a ocorrência. -50 pontos e bloqueio de 35 segundos.', '#ef4444');
        selectedCcoEventId = evento.id;
        houveMudancaDeStatus = true;
      }

      if (evento.status === 'atendimento' && evento.decisionDeadline && agora >= evento.decisionDeadline) {
        evento.status = 'resolvido';
        evento.resultado = 'timeout-decisao';
        gameState.pontuacao = Math.max(0, gameState.pontuacao - 75);
        atualizarPontuacaoUI();
        publicarEventoGameFirebase({ type: 'CCO_TIMEOUT', resultado: 'timeout-decisao', correct: false, titulo: evento.titulo, eventoId: evento.id, points: -75, operador: gameState.operador });
        atualizarBanner('Tempo esgotado para executar a decisão. -75 pontos.', '#ef4444');
        selectedCcoEventId = evento.id;
        houveMudancaDeStatus = true;
      }
    });

    // Atualiza o cronômetro VISÍVEL NO CARD, em Eventos Recebidos.
    // O valor vem sempre do deadline absoluto; trocar de ocorrência nunca reinicia o relógio.
    document.querySelectorAll('[data-cco-event-id]').forEach(el => {
      const evento = ccoEvents.find(e => String(e.id) === String(el.dataset.ccoEventId));
      if (!evento) return;

      const deadline = evento.status === 'pendente'
        ? evento.assumeDeadline
        : evento.status === 'atendimento'
          ? evento.decisionDeadline
          : null;

      if (deadline) {
        const r = segundosRestantes(deadline);
        el.textContent = `⏱ ${evento.status === 'pendente' ? 'Tempo para assumir' : 'Tempo para decidir'}: ${r}s`;
        el.classList.toggle('timer-critical', r <= 5);
      } else if (evento.resultado === 'timeout-assumir') {
        el.textContent = '⏱ Prazo para assumir esgotado';
        el.classList.add('timer-critical');
      } else if (evento.resultado === 'timeout-decisao') {
        el.textContent = '⏱ Prazo para decisão esgotado';
        el.classList.add('timer-critical');
      } else {
        el.textContent = `⏱ ${formatarTempoEvento(evento)}`;
      }
    });

    // Atualiza o painel da direita apenas quando necessário.
    const selecionado = ccoEvents.find(e => String(e.id) === String(selectedCcoEventId));
    if (selecionado) {
      const assume = document.getElementById('cco-assume-countdown');
      const assumeFill = document.getElementById('cco-assume-fill');
      const decision = document.getElementById('cco-decision-countdown');
      const decisionFill = document.getElementById('cco-decision-fill');

      if (assume && selecionado.status === 'pendente') {
        const r = segundosRestantes(selecionado.assumeDeadline);
        assume.textContent = `${r}s`;
        if (assumeFill) assumeFill.style.width = `${Math.max(0, Math.min(100, (r / 60) * 100))}%`;
      }

      if (decision && selecionado.status === 'atendimento') {
        const r = segundosRestantes(selecionado.decisionDeadline);
        decision.textContent = `${r}s`;
        if (decisionFill) decisionFill.style.width = `${Math.max(0, Math.min(100, (r / 30) * 100))}%`;
      }
    }

    if (houveMudancaDeStatus) {
      renderizarEventosCCO();
      atualizarStatusCentralCCO();
    }
  }

  function iniciarPrazosAssumirCCO() {
    const agora = Date.now();
    let iniciou = false;

    ccoEvents.forEach(evento => {
      if (evento.status === 'pendente' && !evento.assumeDeadline) {
        evento.assumeDeadline = agora + 60000;
        iniciou = true;
      }
    });

    if (iniciou) {
      renderizarEventosCCO();
      atualizarStatusCentralCCO();
    }

    iniciarRelogioCCO();
  }

  function iniciarRelogioCCO() {
    if (ccoDecisionTimer) return;
    ccoDecisionTimer = setInterval(atualizarRelogiosCCO, 250);
  }

  function renderizarDetalheCCO(evento) {
    const content = document.getElementById('cco-detail-content');
    const status = document.getElementById('cco-detail-status');
    if (!content || !status) return;

    // Fade sutil ao atualizar o painel de detalhe.
    content.classList.remove('fade-in');
    void content.offsetWidth;
    content.classList.add('fade-in');

    if (!evento) {
      status.className = 'event-status status-pendente';
      status.innerText = 'PENDENTE';
      content.className = 'cco-detail-empty';
      content.innerHTML = '<div class="detail-icon">🔔</div><strong>Selecione um evento</strong><span>As ações disponíveis serão exibidas aqui.</span>';
      iniciarRelogioCCO();
      return;
    }

    status.className = `event-status ${statusClasseCCO(evento.status)}`;
    status.innerText = statusTextoCCO(evento.status);
    content.className = 'cco-detail-content';

    let actionHtml = '';

    if (evento.status === 'pendente') {
      actionHtml = `
        <div class="cco-score-hint">O prazo para assumir está sendo contado exclusivamente no cartão da ocorrência, em <strong>Eventos recebidos</strong>.</div>
        <button id="cco-assume-btn" class="cco-action-btn primary" onclick="assumirEventoCCO('${evento.id}')">👤 ASSUMIR OCORRÊNCIA</button>
      `;
    } else if (evento.status === 'atendimento') {
      const opcoes = evento.decisao?.opcoes || [];
      actionHtml = `
        <div class="cco-decision-box">
          <div class="cco-choice-title">${evento.decisao?.pergunta || 'Selecione a ação operacional:'}</div>
          <div class="cco-choice-grid">
            ${opcoes.map((op, idx) => `<button class="cco-choice-btn ${evento.escolha === idx ? 'selected' : ''}" onclick="selecionarDecisaoCCO('${evento.id}', ${idx})">${String.fromCharCode(65 + idx)}) ${op.texto}</button>`).join('')}
          </div>
          <div class="cco-score-hint">Escolha uma opção e execute a decisão. O prazo continua correndo no cartão da ocorrência.</div>
        </div>
        <button id="cco-execute-btn" class="cco-action-btn primary" onclick="executarAcaoCCO('${evento.id}')" ${evento.escolha === null ? 'disabled' : ''}>⚡ EXECUTAR DECISÃO</button>
      `;
    } else if (evento.status === 'acao') {
      actionHtml = `<button class="cco-action-btn success" onclick="resolverEventoCCO('${evento.id}')">✓ ENCERRAR OCORRÊNCIA</button>`;
    } else {
      const resultado = evento.resultado === 'acerto'
        ? '<div class="cco-training-result success">✓ Decisão correta. Pontos adicionados ao desempenho do operador.</div>'
        : evento.resultado === 'erro'
          ? '<div class="cco-training-result error">✕ Decisão inadequada. O operador foi bloqueado por 35 segundos.</div>'
          : evento.resultado === 'timeout-assumir'
            ? '<div class="cco-training-result error">⏱ Prazo para assumir esgotado. -50 pontos e bloqueio de 35 segundos.</div>'
            : '<div class="cco-training-result error">⏱ Prazo para decisão esgotado. -75 pontos.</div>';
      actionHtml = resultado;
    }

    content.innerHTML = `
      <div class="detail-title">${evento.titulo}</div>
      <div class="detail-description">${evento.mensagem}</div>
      <div class="detail-grid">
        <div class="detail-data"><small>Origem</small><strong>${evento.origem}</strong></div>
        <div class="detail-data"><small>Horário</small><strong>${evento.hora}</strong></div>
      </div>
      <div class="detail-recommendation"><b>AÇÃO RECOMENDADA</b>${evento.recomendacao}</div>
      <div class="detail-actions">${actionHtml}</div>`;

    iniciarRelogioCCO();
  }

  function assumirEventoCCO(id) {
    const evento = ccoEvents.find(e => String(e.id) === String(id));
    if (!evento || evento.status !== 'pendente' || isCurrentTabBlocked()) return;
    if (segundosRestantes(evento.assumeDeadline) <= 0) {
      atualizarRelogiosCCO();
      return;
    }

    evento.status = 'atendimento';
    evento.assumidoEm = Date.now();
    evento.decisionDeadline = Date.now() + 30000;
    evento.escolha = null;
    evento.resultado = null;
    selectedCcoEventId = evento.id;

    atualizarBanner('Central CCO: ocorrência assumida. Selecione uma decisão antes que o tempo termine.', '#f59e0b');
    renderizarEventosCCO();
    atualizarStatusCentralCCO();
  }

  function selecionarDecisaoCCO(id, index) {
    const evento = ccoEvents.find(e => String(e.id) === String(id));
    if (!evento || evento.status !== 'atendimento' || isCurrentTabBlocked()) return;
    if (segundosRestantes(evento.decisionDeadline) <= 0) {
      atualizarRelogiosCCO();
      return;
    }
    evento.escolha = index;
    selectedCcoEventId = evento.id;
    renderizarDetalheCCO(evento);
  }

  function executarAcaoCCO(id) {
    const evento = ccoEvents.find(e => String(e.id) === String(id));
    if (!evento || evento.status !== 'atendimento' || isCurrentTabBlocked()) return;
    if (evento.escolha === null || evento.escolha === undefined) return;
    if (segundosRestantes(evento.decisionDeadline) <= 0) {
      atualizarRelogiosCCO();
      return;
    }

    const opcao = evento.decisao.opcoes[evento.escolha];
    if (opcao.correta) {
      gameState.pontuacao += opcao.pontos;
      evento.resultado = 'acerto';
      evento.status = 'acao';
      atualizarPontuacaoUI();
      atualizarBanner(`Decisão correta! +${opcao.pontos} pontos para o desempenho do operador.`, '#10b981');
    } else {
      gameState.pontuacao = Math.max(0, gameState.pontuacao + (opcao.penalidade || -50));
      evento.resultado = 'erro';
      evento.status = 'resolvido';
      atualizarPontuacaoUI();
      atualizarBanner('Decisão inadequada: operador bloqueado por 35 segundos.', '#ef4444');
      aplicarBloqueioOperador('Decisão operacional inadequada.', evento.origemTab || 'mod-malha');
    }

    publicarEventoGameFirebase({
      type: 'CCO_DECISION_RESULT', resultado: evento.resultado,
      correct: evento.resultado === 'acerto', titulo: evento.titulo,
      eventoId: evento.id, points: evento.resultado === 'acerto' ? opcao.pontos : (opcao.penalidade || -50),
      decisao: opcao.texto, origem: evento.origem
    });
    selectedCcoEventId = evento.id;
    renderizarEventosCCO();
    atualizarStatusCentralCCO();
  }

  function resolverEventoCCO(id) {
    const evento = ccoEvents.find(e => String(e.id) === String(id));
    if (!evento) return;
    evento.status = 'resolvido';
    atualizarBanner('Central CCO: ocorrência resolvida e registrada no histórico.', '#10b981');
    atualizarStatusCentralCCO();
    renderizarEventosCCO();
  }

  function iniciarCronometroAssumirCCO(id) {
    const evento = ccoEvents.find(e => String(e.id) === String(id));
    if (!evento) return;
    if (!evento.assumeDeadline) evento.assumeDeadline = Date.now() + 15000;
    iniciarRelogioCCO();
  }

  function iniciarCronometroDecisaoCCO(id) {
    const evento = ccoEvents.find(e => String(e.id) === String(id));
    if (!evento) return;
    if (!evento.decisionDeadline) evento.decisionDeadline = Date.now() + 30000;
    iniciarRelogioCCO();
  }

  function limparNotificacoes() {
    ccoEvents = ccoEvents.filter(evento => evento.status !== 'resolvido');
    selectedCcoEventId = ccoEvents[0]?.id || null;
    renderizarEventosCCO();
    atualizarStatusCentralCCO();
  }

  function atualizarStatusCentralCCO() {
    const ativos = ccoEvents.filter(e => e.status !== 'resolvido');
    const criticos = ativos.filter(e => e.severidade === 'critico');
    const statusBox = document.getElementById('cco-global-status');
    const statusTitle = statusBox?.querySelector('strong');
    const statusSmall = statusBox?.querySelector('small');
    const activeCount = document.getElementById('cco-active-count');
    const footerTitle = document.getElementById('cco-footer-title');
    const footerText = document.getElementById('cco-footer-text');
    if (activeCount) activeCount.innerText = ativos.length;
    if (!statusBox) return;

    statusBox.classList.remove('status-normal','status-attention','status-critical');
    if (criticos.length) {
      statusBox.classList.add('status-critical');
      statusTitle.innerText = 'INCIDENTE CRÍTICO';
      statusSmall.innerText = `${criticos.length} ocorrência(s) crítica(s) ativa(s)`;
      if (footerTitle) footerTitle.innerText = 'ATENÇÃO OPERACIONAL';
      if (footerText) footerText.innerText = 'A Central CCO possui ocorrência crítica aguardando tratamento.';
    } else if (ativos.length) {
      statusBox.classList.add('status-attention');
      statusTitle.innerText = 'ATENÇÃO OPERACIONAL';
      statusSmall.innerText = `${ativos.length} ocorrência(s) em acompanhamento`;
      if (footerTitle) footerTitle.innerText = 'ACOMPANHAMENTO ATIVO';
      if (footerText) footerText.innerText = 'Existem ocorrências que exigem acompanhamento da Central CCO.';
    } else {
      statusBox.classList.add('status-normal');
      statusTitle.innerText = 'OPERAÇÃO NORMAL';
      statusSmall.innerText = 'Todos os módulos operacionais';
      if (footerTitle) footerTitle.innerText = 'SISTEMA OPERACIONAL';
      if (footerText) footerText.innerText = 'Central CCO recebendo eventos em tempo real dos módulos da plataforma.';
    }
  }

  function atualizarBanner(texto, cor) {
    const bannerText = document.getElementById('banner-text');
    if (bannerText) {
      bannerText.innerText = texto;
      const c = cor || "#38bdf8";
      bannerText.style.color = c;
      const banner = bannerText.closest('.alert-banner');
      if (banner) {
        banner.style.borderLeftColor = c;
        const glow = /^#[0-9a-f]{6}$/i.test(c) ? c + '26' : 'rgba(56,189,248,.15)';
        banner.style.boxShadow = `0 0 14px ${glow}`;
      }
    }
  }

  /* ==========================================================================
     INICIALIZAÇÃO DOS GRÁFICOS
     ========================================================================== */
  function initEcoChart() {
    const ctx = document.getElementById('ecoChart');
    if (!ctx) return;

    if (ecoChartInstance) ecoChartInstance.destroy();

    ecoChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        datasets: [
          {
            label: 'Condução Manual (Legado)',
            data: [16.5, 16.8, 17.1, 16.8, 17.2, 16.6],
            borderColor: '#ef4444',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 3,
            fill: false,
            tension: 0.3
          },
          {
            label: 'IA Eco-Assist (Atual)',
            data: [14.2, 14.0, 14.5, 14.1, 14.3, 14.0],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            pointRadius: 4,
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 } } }
        },
        scales: {
          x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
          y: { min: 13.5, max: 17.5, ticks: { color: '#64748b' }, grid: { color: '#1e293b' } }
        }
      }
    });
  }

  function initVibrationChart() {
    const ctx = document.getElementById('vibrationChart');
    if (!ctx) return;

    if (vibrationChart) vibrationChart.destroy();

    vibrationChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', '10s'],
        datasets: [{
          label: 'Vibração (G)',
          data: [0.02, 0.01, 0.03, 0.02, 0.02, 0.01, 0.03, 0.02, 0.02, 0.01],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { display: false },
          y: { min: 0, max: 1.5, grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 9 } } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }


  /* ========================================================================
     TUTORIAL DE BOAS-VINDAS — CCO 4.0
     Mostrado no primeiro acesso de cada operador. Pode ser revisto pelo
     botão "Tutorial" no cabeçalho.
     ======================================================================== */
  const tutorialCCO = [
    {
      icon: '👋', title: 'Bem-vindo ao CCO 4.0',
      text: 'Este ambiente simula a rotina de um operador do Centro de Controle Operacional. Aqui você vai analisar situações, tomar decisões e acompanhar seu desempenho.',
      target: null,
      extra: '<div class="cco-tutorial-tip"><strong>Objetivo:</strong> operar com segurança, atenção e agilidade. Pontuação é consequência de boas decisões — não substitui a segurança.</div>'
    },
    {
      icon: '📚', title: 'Explore as simulações',
      text: 'As quatro primeiras abas são módulos de treinamento. Cada uma apresenta situações diferentes para você praticar antes ou durante o Game.',
      target: '.nav-tabs',
      extra: '<div class="cco-tutorial-tip"><strong>1. Malha & RAMP</strong> — fluxo e capacidade operacional.</div><div class="cco-tutorial-tip"><strong>2. IA Preditiva</strong> — leitura de sinais e anomalias.</div><div class="cco-tutorial-tip"><strong>3. Eco-Driving</strong> — eficiência e condução.</div><div class="cco-tutorial-tip"><strong>4. Prevenção Descarrilamento</strong> — segurança e integridade.</div>'
    },
    {
      icon: '🚨', title: 'Analise cada ocorrência',
      text: 'Quando uma ocorrência surgir, leia o contexto, avalie o risco e escolha a resposta mais adequada. Algumas situações são moderadas; outras exigem prioridade imediata.',
      target: '#game-cards-container',
      extra: '<div class="cco-tutorial-tip"><strong>Dica:</strong> não escolha apenas pensando nos pontos. A lógica da simulação prioriza segurança e qualidade da decisão.</div>'
    },
    {
      icon: '⏱️', title: 'Tempo e bloqueios',
      text: 'As ocorrências têm prazo. Erros ou tempo esgotado podem gerar penalidades e bloqueios temporários. Durante um bloqueio, novas ocorrências continuam aparecendo e o cronômetro não para.',
      target: '#user-score-tag',
      extra: '<div class="cco-tutorial-tip"><strong>Importante:</strong> quando o bloqueio terminar, a ocorrência mantém o tempo que ainda restar. Não há reinício do cronômetro.</div>'
    },
    {
      icon: '⏳', title: 'Executar ou aguardar?',
      text: 'No Game Oficial, você pode executar a ação escolhida ou aguardar uma ocorrência. Aguardar coloca a ocorrência na lista de pendências e exige atenção à prioridade dos próximos alertas.',
      target: '#tab-cco-center',
      extra: '<div class="cco-tutorial-tip"><strong>Executar Ação:</strong> confirma sua decisão.</div><div class="cco-tutorial-tip"><strong>Aguardar:</strong> adia a ocorrência para tratar outra e pode gerar penalidade se a priorização for inadequada.</div>'
    },
    {
      icon: '⚔️', title: 'Repasse — Desafio',
      text: 'Você também poderá desafiar outro operador que esteja online. Os participantes disputam desempenho e o vencedor pode receber uma porcentagem dos pontos do adversário.',
      target: '.user-header-group',
      extra: '<div class="cco-tutorial-tip"><strong>Regra:</strong> o desafio será separado do desempenho individual e terá suas próprias regras, ocorrências e resultado.</div>'
    }
  ];

  let tutorialCCOIndex = 0;
  let tutorialCCOForced = false;

  function limparDestaqueTutorial() {
    document.querySelectorAll('.cco-tutorial-highlight').forEach(el => el.classList.remove('cco-tutorial-highlight'));
  }

  function atualizarTutorialCCO() {
    const step = tutorialCCO[tutorialCCOIndex];
    if (!step) return;
    const icon = document.getElementById('cco-tutorial-icon');
    const title = document.getElementById('cco-tutorial-title');
    const text = document.getElementById('cco-tutorial-text');
    const extra = document.getElementById('cco-tutorial-extra');
    const progress = document.getElementById('cco-tutorial-progress-fill');
    const prev = document.getElementById('cco-tutorial-prev');
    const next = document.getElementById('cco-tutorial-next');
    if (icon) icon.textContent = step.icon;
    if (title) title.textContent = step.title;
    if (text) text.textContent = step.text;
    if (extra) extra.innerHTML = step.extra || '';
    if (progress) progress.style.width = `${((tutorialCCOIndex + 1) / tutorialCCO.length) * 100}%`;
    if (prev) prev.style.visibility = tutorialCCOIndex === 0 ? 'hidden' : 'visible';
    if (next) next.textContent = tutorialCCOIndex === tutorialCCO.length - 1 ? 'Concluir ✓' : 'Próximo →';

    limparDestaqueTutorial();
    if (step.target) {
      const target = document.querySelector(step.target);
      if (target) {
        target.classList.add('cco-tutorial-highlight');
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }), 30);
      }
    }
  }

  function abrirTutorialCCO(forcar = false) {
    if (!gameState.operador || gameState.isAdmin) return;
    const overlay = document.getElementById('cco-tutorial-overlay');
    if (!overlay) return;
    tutorialCCOForced = !!forcar;
    tutorialCCOIndex = 0;
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cco-tutorial-open');
    const checkbox = document.getElementById('cco-tutorial-never');
    if (checkbox) checkbox.checked = false;
    atualizarTutorialCCO();
  }

  function fecharTutorialCCO() {
    const overlay = document.getElementById('cco-tutorial-overlay');
    if (!overlay) return;
    limparDestaqueTutorial();
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cco-tutorial-open');

    const checkbox = document.getElementById('cco-tutorial-never');
    const email = (gameState.operador || '').toLowerCase();
    if (checkbox && checkbox.checked && email) {
      localStorage.setItem(`cco40_tutorial_v1_${email}`, '1');
    }
  }

  function avancarTutorialCCO() {
    if (tutorialCCOIndex >= tutorialCCO.length - 1) {
      fecharTutorialCCO();
      return;
    }
    tutorialCCOIndex += 1;
    atualizarTutorialCCO();
  }

  function voltarTutorialCCO() {
    if (tutorialCCOIndex <= 0) return;
    tutorialCCOIndex -= 1;
    atualizarTutorialCCO();
  }

  function iniciarTutorialSeNecessario() {
    if (!gameState.operador || gameState.isAdmin) return;
    const chave = `cco40_tutorial_v1_${gameState.operador.toLowerCase()}`;
    if (!localStorage.getItem(chave)) {
      setTimeout(() => abrirTutorialCCO(false), 350);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const next = document.getElementById('cco-tutorial-next');
    const prev = document.getElementById('cco-tutorial-prev');
    const skip = document.getElementById('cco-tutorial-skip');
    const overlay = document.getElementById('cco-tutorial-overlay');
    if (next) next.addEventListener('click', avancarTutorialCCO);
    if (prev) prev.addEventListener('click', voltarTutorialCCO);
    if (skip) skip.addEventListener('click', fecharTutorialCCO);
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target.classList.contains('cco-tutorial-backdrop')) fecharTutorialCCO();
      });
    }
    document.addEventListener('keydown', e => {
      if (!document.getElementById('cco-tutorial-overlay')?.classList.contains('show')) return;
      if (e.key === 'Escape') fecharTutorialCCO();
      if (e.key === 'ArrowRight') avancarTutorialCCO();
      if (e.key === 'ArrowLeft') voltarTutorialCCO();
    });
  });

  /* ==========================================================================
     SISTEMA DE AUTENTICAÇÃO E GAME ENGINE
     ========================================================================== */
  function normalizarEmailDigitado(valor) {
    let v = String(valor || '').trim().toLowerCase();
    if (v && !v.includes('@')) v += '@vale.com';
    return v;
  }

  function mostrarErroLogin(mensagem, inputEl) {
    const errEl = document.getElementById('game-login-error');
    if (errEl) {
      errEl.textContent = mensagem;
      errEl.hidden = false;
    }
    if (inputEl) inputEl.classList.add('is-invalid');
  }

  function limparErroLogin() {
    const errEl = document.getElementById('game-login-error');
    const inputEl = document.getElementById('game-user-email');
    if (errEl) { errEl.textContent = ''; errEl.hidden = true; }
    if (inputEl) inputEl.classList.remove('is-invalid');
  }

  function atualizarStatusLoginFirebase(estado, texto) {
    const statusEl = document.getElementById('game-login-status');
    if (!statusEl) return;
    const dot = statusEl.querySelector('.game-status-dot');
    const txt = document.getElementById('game-login-status-text');
    if (dot) dot.className = 'game-status-dot ' + (estado || 'pending');
    if (txt) txt.textContent = texto || '';
  }

  function inicializarTelaLogin() {
    const emailInput = document.getElementById('game-user-email');
    if (!emailInput) return;

    const chkRemember = document.getElementById('game-remember-email');
    const hintBtn = document.getElementById('game-email-hint');

    // Lembrar e-mail
    let lembrado = null;
    try { lembrado = localStorage.getItem('cco40_login_email'); } catch (e) {}
    if (lembrado) {
      emailInput.value = lembrado;
      if (chkRemember) chkRemember.checked = true;
    }

    const atualizarHintDominio = () => {
      if (hintBtn) hintBtn.hidden = !(emailInput.value.trim() && !emailInput.value.includes('@'));
    };

    emailInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        realizarLoginGame();
      }
    });
    emailInput.addEventListener('input', () => {
      limparErroLogin();
      atualizarHintDominio();
    });
    emailInput.addEventListener('blur', () => {
      if (emailInput.value.trim() && !emailInput.value.includes('@')) {
        emailInput.value = normalizarEmailDigitado(emailInput.value);
        atualizarHintDominio();
      }
    });

    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        emailInput.value = normalizarEmailDigitado(emailInput.value);
        emailInput.focus();
        limparErroLogin();
        atualizarHintDominio();
      });
    }

    // Status da conexão com o Firebase.
    atualizarStatusLoginFirebase('pending', 'Conectando ao Firebase...');
    if (window.ccoFirebase && window.ccoFirebase.ready) {
      Promise.resolve(window.ccoFirebase.ready)
        .then(() => atualizarStatusLoginFirebase('online', 'Firebase conectado — validação em nuvem'))
        .catch(() => atualizarStatusLoginFirebase('offline', 'Firebase offline — validação local (whitelist)'));
    } else {
      atualizarStatusLoginFirebase('offline', 'Firebase não configurado — validação local (whitelist)');
    }
  }

  async function realizarLoginGame() {
    const emailInput = document.getElementById('game-user-email');
    const userEmail = normalizarEmailDigitado(emailInput ? emailInput.value : '');

    if (!userEmail) {
      mostrarErroLogin("Por favor, digite seu e-mail corporativo.", emailInput);
      emailInput && emailInput.focus();
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail);
    if (!emailValido) {
      mostrarErroLogin("Formato de e-mail inválido. Ex.: nome.sobrenome@vale.com", emailInput);
      emailInput && emailInput.focus();
      return;
    }

    limparErroLogin();

    const btnLogar = document.getElementById('game-login-btn');
    const btnLabel = btnLogar ? btnLogar.querySelector('.game-btn-label') : null;
    const btnSpinner = btnLogar ? btnLogar.querySelector('.game-btn-spinner') : null;
    if (btnLogar) btnLogar.disabled = true;
    if (btnLabel) btnLabel.textContent = 'Validando acesso...';
    if (btnSpinner) btnSpinner.hidden = false;

    // 1) Tenta validar o e-mail contra o Realtime Database (/usuarios).
    let usuarioFirebase = await buscarUsuarioFirebase(userEmail);

    // 2) Se o nó /usuarios ainda não existir, inicializa-o com a lista
    //    de permissões atual (migração) e reutiliza essa lista de validação.
    if (!usuarioFirebase) {
      const seed = await sembrarUsuariosFirebaseSeNecessario();
      if (seed && seed[normalizarChaveEmail(userEmail)]) {
        usuarioFirebase = seed[normalizarChaveEmail(userEmail)];
      }
    }

    // 3) Fallback para a whitelist apenas quando o Firebase estiver
    //    indisponível ou o usuário ainda não estiver refletido no banco.
    const firebaseIndisponivel = !window.ccoFirebase || !window.ccoFirebase.ready;
    const autorizadoByWhitelist = whitelist.includes(userEmail);

    if (btnLogar) btnLogar.disabled = false;
    if (btnSpinner) btnSpinner.hidden = true;

    if (usuarioFirebase) {
      if (usuarioFirebase.ativo === false) {
        mostrarErroLogin("Acesso negado: Este usuário está desativado no sistema.", emailInput);
        if (btnLabel) btnLabel.textContent = 'ACESSAR SIMULADOR';
        return;
      }
    } else if (firebaseIndisponivel || !autorizadoByWhitelist) {
      mostrarErroLogin("Acesso negado: Este e-mail não está cadastrado no sistema.", emailInput);
      if (btnLabel) btnLabel.textContent = 'ACESSAR SIMULADOR';
      return;
    }

    if (btnLabel) btnLabel.textContent = 'Bem-vindo(a)!';

    const ehAdmin = usuarioFirebase
      ? usuarioFirebase.perfil === 'admin'
      : userEmail === 'adm@vale.com';

    gameState.operador = userEmail;
    gameState.operadorNome = (usuarioFirebase?.nome || userEmail.split('@')[0])
      .split('.')
      .map(p => p ? p.charAt(0).toUpperCase() + p.slice(1) : p)
      .join(' ');

    // Lembra / esquece o e-mail neste dispositivo.
    const chkRemember = document.getElementById('game-remember-email');
    try {
      if (chkRemember && chkRemember.checked) {
        localStorage.setItem('cco40_login_email', userEmail);
      } else {
        localStorage.removeItem('cco40_login_email');
      }
    } catch (e) { /* localStorage indisponível */ }

    if (ehAdmin) {
      // Administradores acessam a Central ADM pelo botão "Entrar como Administrador",
      // sem redirecionamento automático a partir do login operacional (evita duplo login).
      if (btnLogar) btnLogar.disabled = false;
      if (btnLabel) btnLabel.textContent = 'ACESSAR SIMULADOR';
      if (btnSpinner) btnSpinner.hidden = true;
      mostrarErroLogin("E-mail de administrador reconhecido. Use o botão 'Entrar como Administrador' abaixo para acessar a Central ADM.", emailInput);
      return;
    }

    gameState.isAdmin = false;
    const modalLogin = document.getElementById('game-login-modal');
    if (modalLogin) modalLogin.style.display = 'none';

    const adminPanel = document.getElementById('admin-control-panel');
    if (adminPanel) adminPanel.style.display = 'none';

    const userTag = document.getElementById('user-operator-tag');
    if (userTag) {
      const nomeExibido = gameState.operadorNome || userEmail;
      userTag.innerText = `PLATAFORMA INTEGRADA CCO 4.0 | OPERADOR: ${nomeExibido} (${userEmail})`;
    }

    // Conecta este operador ao Firebase para sincronizar presença e pontos.
    inicializarSincronizacaoFirebase();

    // Primeiro acesso: apresenta o guia rápido do CCO.
    iniciarTutorialSeNecessario();

    configurarPainelAdmin();
  }

  function configurarPainelAdmin() {
    if (gameState.isAdmin) {
      Swal.fire({
        title: 'Sessão do Administrador',
        text: 'Sessão iniciada como ADMINISTRADOR. Você tem permissão para iniciar e parar as simulações.',
        icon: 'success',
        confirmButtonText: 'OK',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#0284c7'
      });
    } else {
      Swal.fire({
        title: 'Aviso GAME interativo',
        text: 'Aguarde o Administrador iniciar o GAME para receber os cards de incidentes. Enquanto isso, aproveite para testar as simulações.',
        icon: 'info',
        confirmButtonText: 'OK',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#0284c7'
      });
    }
  }

  function realizarLogout() {
    function efetuarLogout() {
      if (gameState.intervaloCards) clearInterval(gameState.intervaloCards);
      if (typeof timeoutProximoCard !== 'undefined' && timeoutProximoCard) clearTimeout(timeoutProximoCard);
      if (typeof ccoDecisionTimer !== 'undefined' && ccoDecisionTimer) clearInterval(ccoDecisionTimer);
      if (typeof ccoAssumeTimer !== 'undefined' && ccoAssumeTimer) clearInterval(ccoAssumeTimer);
      if (typeof bloqueioInterval !== 'undefined' && bloqueioInterval) clearInterval(bloqueioInterval);
      window.location.reload();
    }

    if (window.Swal) {
      Swal.fire({
        title: 'Encerrar sessão?',
        text: 'Sua sessão será encerrada e a tela voltará para o login.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sair',
        cancelButtonText: 'Cancelar',
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#dc2626'
      }).then(result => {
        if (result.isConfirmed) efetuarLogout();
      });
    } else {
      efetuarLogout();
    }
  }

  function adminIniciarSimulacao() {
    if (!gameState.isAdmin) return;
    if (gameState.emExecucao) {
      alert('A simulação já está em andamento!');
      return;
    }
    gameState.emExecucao = true;
    alert('Simulação INICIADA pelo Administrador.');
    iniciarGeradorDeIncidentes();
  }

  function adminPararSimulacao() {
    if (!gameState.isAdmin) return;
    gameState.emExecucao = false;
    if (gameState.intervaloCards) clearInterval(gameState.intervaloCards);
    if (timeoutProximoCard) clearTimeout(timeoutProximoCard);
    timeoutProximoCard = null;
    gameState.cardsAtivos = [];
    gameState.cardsAguardados = [];
    renderizarCardsAguardados();
    const container = document.getElementById('game-cards-container');
    if (container) container.innerHTML = '';
    alert('Simulação PARADA pelo Administrador.');
  }

  let ultimoIncidenteId = null;
  let timeoutProximoCard = null;
  let gameOfficialStartedAt = null;
  let bloqueioAvisoDialog = null;

  const CRITICIDADE_PESO = { moderado: 1, grave: 2, critico: 3 };

  function probabilidadeProximoCritico() {
    if (!bancoIncidentes.length) return 0;
    const criticos = bancoIncidentes.filter(item => item.criticidade === 'critico').length;
    return Math.round((criticos / bancoIncidentes.length) * 100);
  }

  function renderizarCardsAguardados() {
    let painel = document.getElementById('game-waiting-container');
    if (!painel) {
      painel = document.createElement('aside');
      painel.id = 'game-waiting-container';
      document.body.appendChild(painel);
    }

    if (!gameState.cardsAguardados.length) {
      painel.innerHTML = `
        <div class="waiting-panel-header">
          <span>⏳ Ocorrências aguardadas</span>
          <span class="waiting-count">0</span>
        </div>
        <div class="waiting-empty">Nenhuma ocorrência aguardando retorno.</div>`;
      return;
    }

    painel.innerHTML = `
      <div class="waiting-panel-header">
        <span>⏳ Ocorrências aguardadas</span>
        <span class="waiting-count">${gameState.cardsAguardados.length}</span>
      </div>
      <div class="waiting-list">
        ${gameState.cardsAguardados.map(card => `
          <div class="waiting-item ${card.criticidade}">
            <div class="waiting-item-title">${card.titulo}</div>
            <div class="waiting-item-meta">${String(card.criticidade).toUpperCase()} • Retorna após a próxima decisão</div>
          </div>
        `).join('')}
      </div>`;
  }

  async function registrarConsequenciaDaEspera(novoCard) {
    if (!gameState.cardsAguardados.length) return;

    // Cada ocorrência aguardada representa uma prioridade que o operador decidiu adiar.
    // Se a nova ocorrência for menos crítica, a priorização foi inadequada e há penalidade.
    for (const cardAguardado of gameState.cardsAguardados) {
      const prioridadeAnterior = CRITICIDADE_PESO[cardAguardado.criticidade] || 1;
      const prioridadeNova = CRITICIDADE_PESO[novoCard.criticidade] || 1;
      if (prioridadeNova < prioridadeAnterior && !cardAguardado.penalidadeAplicada) {
        const penalidade = -50;
        cardAguardado.penalidadeAplicada = true;
        await atualizarPontuacaoGameOficial(penalidade, 'priorização inadequada');
        atualizarBanner(`⚠️ Priorização inadequada: você adiou uma ocorrência ${cardAguardado.criticidade} e recebeu uma ocorrência ${novoCard.criticidade}. ${penalidade} pontos.`, '#ef4444');
        publicarEventoGameFirebase({
          type: 'GAME_PRIORITY_RESULT',
          resultado: 'priorizacao_inadequada',
          correct: false,
          titulo: cardAguardado.titulo,
          eventoId: cardAguardado.id,
          points: penalidade,
          decisao: `Aguardou ${cardAguardado.criticidade}; próxima ocorrência foi ${novoCard.criticidade}.`
        });
      }
    }
  }

  function retornarOcorrenciaAguardada() {
    if (gameState.cardsAguardados.length === 0 || gameState.cardsAtivos.length > 0 || !gameState.emExecucao) return false;
    const card = gameState.cardsAguardados.shift();
    card.opcaoSelecionada = null;
    card.tempoRestante = 40;
    card.prazoFinal = Date.now() + 40000;
    card.penalidadeAplicada = !!card.penalidadeAplicada;
    gameState.cardsAtivos.push(card);
    renderizarCardHTML(card);
    renderizarCardsAguardados();
    publicarEventoGameFirebase({
      type: 'GAME_WAIT_RETURNED',
      resultado: 'aguardado_retornado',
      correct: null,
      titulo: card.titulo,
      eventoId: card.id,
      points: 0,
      decisao: 'Ocorrência adiada retornou para decisão.'
    });
    return true;
  }

  function calcularIntervaloGameOficial() {
    const inicio = gameOfficialStartedAt || Date.now();
    const decorrido = Math.max(0, (Date.now() - inicio) / 1000);
    if (decorrido < 45) return 3200;
    if (decorrido < 100) return 2600;
    if (decorrido < 170) return 2100;
    if (decorrido < 240) return 1600;
    return 1200;
  }

  function estaEmJanelaDePressao() {
    const inicio = gameOfficialStartedAt || Date.now();
    const decorrido = Math.max(0, (Date.now() - inicio) / 1000);
    const ciclo = decorrido % 75;
    return decorrido >= 45 && ciclo >= 45 && ciclo < 60;
  }

  function agendarProximoCard(delay = null) {
    if (timeoutProximoCard) clearTimeout(timeoutProximoCard);
    let atraso = delay === null ? calcularIntervaloGameOficial() : Math.max(0, Number(delay) || 0);
    if (delay === 5000) atraso = calcularIntervaloGameOficial();
    if (delay === null && estaEmJanelaDePressao()) atraso = 450;
    // O bloqueio não interrompe a geração de ocorrências. O operador continua
    // recebendo trabalho, mas não pode interagir enquanto estiver bloqueado.
    timeoutProximoCard = setTimeout(() => {
      timeoutProximoCard = null;
      if (!gameState.emExecucao || firebaseGamePhase !== 'official' || !gameRulesAcknowledged || gameState.cardsAtivos.length > 0) return;
      gerarNovoCardIncidente();
    }, atraso);
  }

  function iniciarGeradorDeIncidentes() {
    if (!gameState.emExecucao || firebaseGamePhase !== 'official' || !gameRulesAcknowledged) return;
    if (gameState.cardsAtivos.length === 0 && !timeoutProximoCard) {
      agendarProximoCard();
    }
  }

  function gerarNovoCardIncidente() {
    if (!gameState.emExecucao || firebaseGamePhase !== 'official' || !gameRulesAcknowledged || gameState.cardsAtivos.length > 0) return;
    let disponiveis = bancoIncidentes.filter(item => item.id !== ultimoIncidenteId);
    if (!disponiveis.length) disponiveis = bancoIncidentes;
    const incidenteBase = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    ultimoIncidenteId = incidenteBase.id;
    const cardId = 'card-' + Date.now();
    const cardData = {
      id: cardId,
      ...incidenteBase,
      opcaoSelecionada: null,
      tempoRestante: 40,
      prazoFinal: Date.now() + 40000,
      criadoEm: Date.now()
    };
    gameState.cardsAtivos.push(cardData);
    renderizarCardHTML(cardData);
    void registrarConsequenciaDaEspera(cardData);
    publicarEventoGameFirebase({
      type: 'GAME_EVENT_CREATED',
      titulo: cardData.titulo,
      criticidade: cardData.criticidade,
      descricao: cardData.descricao,
      origem: 'Game Oficial',
      eventoId: cardData.id
    });
  }

  function renderizarCardHTML(card) {
    let container = document.getElementById('game-cards-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'game-cards-container';
      document.body.appendChild(container);
    }

    // O card oficial usa <dialog>. Assim ele entra no Top Layer nativo do navegador
    // e nenhum painel/overlay antigo do CCO consegue capturar os cliques.
    const cardElement = document.createElement('dialog');
    cardElement.id = card.id;
    cardElement.className = `game-card ${card.criticidade}`;
    cardElement.setAttribute('aria-label', card.titulo);
    cardElement.innerHTML = `
      <div class="game-card-timer" id="timer-bar-${card.id}"></div>
      <div class="game-card-header">
        <span class="game-card-title">${card.titulo}</span>
        <span style="font-size: 0.75rem; font-weight: bold; text-transform: uppercase; color: #94a3b8;">${card.criticidade}</span>
      </div>
      <div class="game-card-body">${card.descricao}</div>
      <div class="game-card-options">
        ${card.opcoes.map((opt, idx) => `
          <button type="button" class="btn-option" data-option-index="${idx}">${opt.texto}</button>
        `).join('')}
      </div>
      <div class="game-card-actions">
        <button type="button" class="btn-action-exec">⚡ Executar Ação</button>
        <button type="button" class="btn-action-wait">⏳ Aguardar</button>
        <div class="wait-probability">🎲 Próximo card: <strong>${probabilidadeProximoCritico()}%</strong> de probabilidade de ser um alerta <b>CRÍTICO</b>.</div>
        <div class="risk-info">⚠️ Risco: ${card.risco}</div>
      </div>
    `;

    container.appendChild(cardElement);

    // Eventos diretamente nos controles: sem delegação e sem onclick inline.
    cardElement.querySelectorAll('.btn-option').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        selecionarOpcaoCard(card.id, Number(button.dataset.optionIndex), button);
      });
    });

    const executar = cardElement.querySelector('.btn-action-exec');
    executar.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      executarAcaoCard(card.id);
    });

    const aguardar = cardElement.querySelector('.btn-action-wait');
    aguardar.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      aguardarCard(card.id);
    });

    try {
      if (typeof cardElement.showModal === 'function') cardElement.showModal();
      else cardElement.setAttribute('open', '');
    } catch (error) {
      console.warn('[CCO 4.0] Não foi possível abrir o card como dialog; usando fallback.', error);
      cardElement.setAttribute('open', '');
    }

    const timerInterval = setInterval(() => {
      if (!gameState.emExecucao || !document.getElementById(card.id)) {
        clearInterval(timerInterval);
        return;
      }
      // O prazo é baseado em um deadline absoluto. Assim, se o operador for
      // bloqueado, o relógio continua correndo e nunca é reiniciado ao fim do bloqueio.
      if (!card.prazoFinal) {
        card.prazoFinal = Date.now() + Math.max(0, Number(card.tempoRestante || 0)) * 1000;
      }
      card.tempoRestante = Math.max(0, Math.ceil((card.prazoFinal - Date.now()) / 1000));
      const barra = document.getElementById(`timer-bar-${card.id}`);
      if (barra) barra.style.width = `${Math.max(0, (card.tempoRestante / 40) * 100)}%`;
      if (card.tempoRestante <= 0) {
        clearInterval(timerInterval);
        finalizarCardPorTimeout(card.id);
      }
    }, 1000);
  }

  function notificarBloqueioDuranteCard() {
    const bloqueio = obterBloqueioAba(currentTab);
    const segundos = bloqueio ? Math.max(0, Math.ceil((bloqueio.deadline - Date.now()) / 1000)) : 0;
    atualizarBanner(`🔒 Você está bloqueado. Não é possível administrar ou resolver ocorrências agora. O tempo da ocorrência continua correndo; você poderá agir quando o bloqueio terminar, se ela ainda estiver disponível. ${segundos}s restantes de bloqueio.`, '#ef4444');
    if (bloqueioAvisoDialog && bloqueioAvisoDialog.open) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'operator-block-notice-dialog';
    dialog.innerHTML = `<div class="operator-block-notice"><div class="operator-block-notice-icon">🔒</div><h3>Operador bloqueado</h3><p>Você não pode administrar ou resolver ocorrências enquanto estiver bloqueado.</p><strong>O cronômetro continua correndo.</strong><small>Quando o bloqueio terminar, você só poderá agir se a ocorrência ainda estiver disponível.</small><div class="operator-block-notice-time">${segundos}s de bloqueio restantes</div><button type="button" class="operator-block-notice-close">Entendi</button></div>`;
    document.body.appendChild(dialog);
    bloqueioAvisoDialog = dialog;
    const fechar = () => { try { if (dialog.open) dialog.close(); } catch(e) {} dialog.remove(); if (bloqueioAvisoDialog === dialog) bloqueioAvisoDialog = null; };
    dialog.querySelector('.operator-block-notice-close').addEventListener('click', fechar);
    dialog.addEventListener('cancel', e => { e.preventDefault(); fechar(); });
    try { dialog.showModal(); } catch(e) { dialog.setAttribute('open',''); }
    setTimeout(fechar, 2800);
  }

  function selecionarOpcaoCard(cardId, indexOpcao, btnElement) {
    if (isCurrentTabBlocked()) { notificarBloqueioDuranteCard(); return; }
    const card = gameState.cardsAtivos.find(c => c.id === cardId);
    if (!card) return;
    card.opcaoSelecionada = indexOpcao;

    const cardEl = document.getElementById(cardId);
    if (cardEl) {
      const botoes = cardEl.querySelectorAll('.btn-option');
      botoes.forEach(b => {
        b.style.borderColor = '#334155';
        b.style.background = '#1e293b';
      });
      btnElement.style.borderColor = '#38bdf8';
      btnElement.style.background = '#0284c7';
    }
  }

  async function atualizarPontuacaoGameOficial(delta, motivo = '') {
    const valor = Number(delta || 0);
    gameState.pontuacao = Math.max(0, Number(gameState.pontuacao || 0) + valor);
    atualizarPontuacaoUI();
    // Envia imediatamente a nova pontuação para o Firebase.
    // Assim o ADM não precisa esperar o intervalo periódico de sincronização.
    await sincronizarOperadorFirebase();
    console.info('[CCO 4.0] Pontuação oficial atualizada:', gameState.pontuacao, motivo);
  }

  async function executarAcaoCard(cardId) {
    if (isCurrentTabBlocked()) { notificarBloqueioDuranteCard(); return; }
    if (!gameState.emExecucao) return;
    const cardIndex = gameState.cardsAtivos.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    const card = gameState.cardsAtivos[cardIndex];

    if (card.opcaoSelecionada === null) {
      alert('Selecione uma tomada de decisão antes de executar!');
      return;
    }

    const opcao = card.opcoes[card.opcaoSelecionada];
    if (opcao.correta) {
      await atualizarPontuacaoGameOficial(opcao.pontos, 'acerto');
      removerCardTela(cardId);
      publicarEventoGameFirebase({
        type: 'GAME_DECISION_RESULT', resultado: 'acerto', correct: true,
        titulo: card.titulo, eventoId: card.id,
        points: opcao.pontos, decisao: opcao.texto
      });
    } else {
      await atualizarPontuacaoGameOficial(opcao.penalidade, 'erro');
      removerCardTela(cardId);
      publicarEventoGameFirebase({
        type: 'GAME_DECISION_RESULT', resultado: 'erro', correct: false,
        titulo: card.titulo, eventoId: card.id,
        points: opcao.penalidade, decisao: opcao.texto
      });
      aplicarBloqueioOperador('Decisão Inadequada tomou rumo crítico na malha!');
    }
    gameState.cardsAtivos.splice(cardIndex, 1);
    if (gameState.cardsAguardados.length) {
      setTimeout(() => retornarOcorrenciaAguardada() || agendarProximoCard(), 700);
    } else {
      agendarProximoCard(5000);
    }
  }

  function aguardarCard(cardId) {
    if (isCurrentTabBlocked()) { notificarBloqueioDuranteCard(); return; }
    if (!gameState.emExecucao) return;
    const cardIndex = gameState.cardsAtivos.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    const card = gameState.cardsAtivos[cardIndex];
    removerCardTela(cardId);
    gameState.cardsAtivos.splice(cardIndex, 1);
    card.aguardadoEm = Date.now();
    card.penalidadeAplicada = false;
    gameState.cardsAguardados.push(card);
    renderizarCardsAguardados();
    publicarEventoGameFirebase({
      type: 'GAME_WAIT_ACTION', resultado: 'aguardar', correct: null,
      titulo: card.titulo, eventoId: card.id, points: 0,
      decisao: 'Operador optou por aguardar; ocorrência foi temporariamente adiada.'
    });
    atualizarBanner(`⏳ Ocorrência adiada. Ela permanecerá na lista de aguardadas e retornará após a próxima decisão.`, '#f59e0b');
    agendarProximoCard(5000);
  }

  async function finalizarCardPorTimeout(cardId) {
    const cardIndex = gameState.cardsAtivos.findIndex(c => c.id === cardId);
    if (cardIndex !== -1) {
      const card = gameState.cardsAtivos[cardIndex];
      removerCardTela(cardId);
      gameState.cardsAtivos.splice(cardIndex, 1);
      await atualizarPontuacaoGameOficial(-50, 'timeout');
      publicarEventoGameFirebase({
        type: 'GAME_TIMEOUT', resultado: 'timeout', correct: false,
        titulo: card.titulo, eventoId: card.id, points: -50
      });
      aplicarBloqueioOperador('Tempo Esgotado! Falha na tomada de decisão do CCO.');
      agendarProximoCard(5000);
    }
  }

  function removerCardTela(cardId) {
    const el = document.getElementById(cardId);
    if (!el) return;
    try { if (typeof el.close === 'function' && el.open) el.close(); } catch (e) {}
    el.remove();
  }

  let bloqueioInterval = null;

  function obterBloqueioAba(tabId) {
    return gameState.bloqueiosPorAba[tabId] || null;
  }

  function isCurrentTabBlocked() {
    const bloqueio = obterBloqueioAba(currentTab);
    return !!bloqueio && bloqueio.deadline > Date.now();
  }

  function atualizarControlesBloqueio() {
    const bloqueadoNestaAba = isCurrentTabBlocked();
    ['btn-action-1', 'btn-action-2'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.classList.toggle('simulation-locked', bloqueadoNestaAba);
      btn.disabled = bloqueadoNestaAba;
      if (bloqueadoNestaAba) btn.setAttribute('aria-disabled', 'true');
      else btn.removeAttribute('aria-disabled');
    });
  }

  function atualizarBloqueioVisual() {
    const bloqueio = obterBloqueioAba(currentTab);
    const ativo = !!bloqueio && bloqueio.deadline > Date.now();
    const backdrop = document.getElementById('operator-block-backdrop');
    const reason = document.getElementById('operator-block-reason');
    const count = document.getElementById('operator-block-count');

    gameState.bloqueado = ativo;
    gameState.tempoBloqueio = ativo ? Math.max(0, Math.ceil((bloqueio.deadline - Date.now()) / 1000)) : 0;

    if (ativo) {
      if (reason) reason.innerText = bloqueio.motivo;
      if (count) count.innerText = gameState.tempoBloqueio;
      if (backdrop) backdrop.style.display = 'flex';
      document.body.classList.add('operator-is-blocked');
    } else {
      if (backdrop) backdrop.style.display = 'none';
      document.body.classList.remove('operator-is-blocked');
    }
    atualizarControlesBloqueio();
  }

  function aplicarBloqueioOperador(motivo, tabId = currentTab) {
    const alvo = tabId || currentTab;
    const agora = Date.now();

    // Se o operador JÁ está bloqueado nesta aba, não empilha um novo bloqueio.
    // Uma ocorrência que expira durante o bloqueio não pode gerar OUTRO bloqueio,
    // senão vira um loop infinito de bloqueios a cada nova ocorrência que surgir.
    const bloqueioAtivo = gameState.bloqueiosPorAba[alvo] && gameState.bloqueiosPorAba[alvo].deadline > agora;
    if (bloqueioAtivo) {
      console.info('[CCO 4.0] Operador já bloqueado na aba "' + alvo + '" — novo bloqueio ignorado.');
      return;
    }

    gameState.bloqueiosPorAba[alvo] = {
      deadline: agora + 35000,
      motivo: motivo || 'Decisão operacional inadequada.'
    };

    let backdrop = document.getElementById('operator-block-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'operator-block-backdrop';
      backdrop.innerHTML = `
        <div id="operator-block-modal" role="alertdialog" aria-modal="true">
          <div class="operator-block-icon">🚨</div>
          <div class="operator-block-title">OPERADOR BLOQUEADO</div>
          <div class="operator-block-reason" id="operator-block-reason"></div>
          <div class="operator-block-count" id="operator-block-count">60</div>
          <div class="operator-block-subtitle">Acesso a esta simulação suspenso</div>
        </div>`;
      document.body.appendChild(backdrop);
    }

    atualizarBloqueioVisual();
    publicarEventoGameFirebase({ type: 'OPERATOR_BLOCKED', motivo: motivo || 'Decisão operacional inadequada.', points: 0, tabId: alvo });

    if (bloqueioInterval) clearInterval(bloqueioInterval);
    bloqueioInterval = setInterval(() => {
      const agoraTick = Date.now();
      Object.keys(gameState.bloqueiosPorAba).forEach(tab => {
        if (gameState.bloqueiosPorAba[tab].deadline <= agoraTick) {
          delete gameState.bloqueiosPorAba[tab];
        }
      });

      atualizarBloqueioVisual();

      if (Object.keys(gameState.bloqueiosPorAba).length === 0) {
        clearInterval(bloqueioInterval);
        bloqueioInterval = null;
        atualizarBanner('Bloqueio encerrado. Operador liberado para novas simulações.', '#10b981');
      }
    }, 250);
  }

  function formatarNumero(valor) {
    try {
      return Number(valor || 0).toLocaleString('pt-BR');
    } catch (e) {
      return String(valor || 0);
    }
  }

  function atualizarPontuacaoUI() {
    const scoreEl = document.getElementById('user-score');
    if (scoreEl) {
      const novoValor = formatarNumero(gameState.pontuacao);
      if (scoreEl.innerText !== novoValor) {
        scoreEl.innerText = novoValor;
        scoreEl.classList.remove('score-pop');
        void scoreEl.offsetWidth;
        scoreEl.classList.add('score-pop');
      }
    }
    if (gameState.operador) {
      atualizarRanking(gameState.operador, gameState.pontuacao);
    }
  }

  function atualizarRanking(nome, pontos) {
    const idx = gameState.ranking.findIndex(r => r.nome === nome);
    if (idx !== -1) {
      gameState.ranking[idx].pontos = pontos;
    } else {
      gameState.ranking.push({ nome, pontos });
    }
    gameState.ranking.sort((a, b) => b.pontos - a.pontos);
    renderizarLeaderboard();
  }

  function renderizarLeaderboard() {
    const tabela = document.getElementById('leaderboard-body');
    if (!tabela) return;
    tabela.innerHTML = gameState.ranking.map((item, index) => `
      <tr>
        <td>#${index + 1}</td>
        <td>${item.nome}</td>
        <td>${item.pontos} pts</td>
      </tr>
    `).join('');
  }


// Relógio global do treinamento CCO: inicia assim que a aplicação carrega.
// Não depende da ocorrência selecionada e não é interrompido ao trocar de aba.
document.addEventListener('DOMContentLoaded', () => {
  if (typeof iniciarRelogioCCO === 'function') iniciarRelogioCCO();
});


/* ==========================================================================
   FIREBASE — ETAPA 18: PRESENÇA + PONTUAÇÃO DO OPERADOR
   Regra desta etapa: durante o treinamento, o Firebase recebe somente
   identidade operacional, status e pontuação. Detalhes de ocorrências ficam
   fora desta sincronização até o GAME OFICIAL.
   ========================================================================== */
let firebaseSyncInterval = null;
let firebaseOperatorKey = null;
let firebaseGamePhase = 'training';
let firebaseGameSessionId = null;
let gameRulesAcknowledged = false;
let gameRulesSessionId = null;
let firebaseGameStatusListener = null;
let firebaseClearListener = null;
let firebaseLastClearAt = 0;

function normalizarChaveEmail(email) {
  // Realtime Database não aceita chaves com . # $ [ ] / — então o e-mail é
  // convertido em uma chave segura. Também é usada para o nó /usuarios.
  return String(email || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function gerarChaveOperador(email) {
  // A autenticação anônima do Firebase identifica o navegador/sessão,
  // não o operador escolhido na tela de login. Por isso, dois logins
  // diferentes no mesmo perfil podem receber o MESMO Firebase UID.
  // A identidade operacional passa a ser derivada do e-mail autorizado.
  return 'op_' + normalizarChaveEmail(email);
}

// Busca o usuário no Realtime Database (/usuarios/<chave>). Retorna o
// registro ({ email, nome, perfil, ativo }) ou null se não encontrado
// ou se o Firebase estiver indisponível.
async function buscarUsuarioFirebase(email) {
  if (!window.ccoFirebase || !window.ccoFirebase.db || !window.ccoFirebase.ready) return null;
  try {
    await window.ccoFirebase.ready;
  } catch (e) {
    return null;
  }
  try {
    const ref = window.ccoFirebase.db.ref(`usuarios/${normalizarChaveEmail(email)}`);
    const snap = await ref.once('value');
    if (snap.exists()) return snap.val();
    return null;
  } catch (error) {
    console.error('[CCO 4.0] Erro ao consultar usuário no Firebase:', error);
    return null;
  }
}

// Se o nó /usuarios ainda não existir no Realtime Database (primeira vez),
// cria-o a partir da lista de permissões atual. As regras do Firebase permitem
// somente a criação (enquanto o nó não existir); depois disso a lista é travada
// e novos usuários devem ser adicionados pelo console do Firebase.
async function sembrarUsuariosFirebaseSeNecessario() {
  if (!window.ccoFirebase || !window.ccoFirebase.db || !window.ccoFirebase.ready) return null;
  try {
    await window.ccoFirebase.ready;
  } catch (e) {
    return null;
  }
  try {
    const snap = await window.ccoFirebase.db.ref('usuarios').once('value');
    if (snap.exists()) return null;
    const seed = {};
    whitelist.forEach(email => {
      const chave = normalizarChaveEmail(email);
      seed[chave] = {
        email: email.toLowerCase().trim(),
        nome: email.toLowerCase().trim().split('@')[0],
        perfil: email.toLowerCase().trim() === 'adm@vale.com' ? 'admin' : 'operador',
        ativo: true
      };
    });
    await window.ccoFirebase.db.ref('usuarios').update(seed);
    console.info('[CCO 4.0] Lista de usuários inicializada no Firebase (/usuarios).');
    return seed;
  } catch (error) {
    console.error('[CCO 4.0] Falha ao inicializar usuários no Firebase:', error);
    return null;
  }
}

async function inicializarSincronizacaoFirebase() {
  if (!window.ccoFirebase || !window.ccoFirebase.ready || !gameState.operador) return;
  try {
    const cred = await window.ccoFirebase.ready;
    // IMPORTANTE: não usar cred.user.uid como chave do operador.
    // O UID continua servindo para autenticação, enquanto o e-mail
    // identifica o operador escolhido no CCO.
    firebaseOperatorKey = gerarChaveOperador(gameState.operador);
    const ref = window.ccoFirebase.db.ref(`operadores/${firebaseOperatorKey}`);

    // Se o navegador fechar/desconectar, o Firebase marca o operador como offline.
    await ref.onDisconnect().update({
      status: 'offline',
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });

    await sincronizarOperadorFirebase();

    if (firebaseSyncInterval) clearInterval(firebaseSyncInterval);
    firebaseSyncInterval = setInterval(sincronizarOperadorFirebase, 2000);
    escutarEstadoGameFirebase();
    escutarComandoLimpezaFirebase();
    console.info('[CCO 4.0] Firebase conectado. Chave operacional:', firebaseOperatorKey, 'Auth UID:', cred.user?.uid);
  } catch (error) {
    console.error('[CCO 4.0] Falha ao conectar ao Firebase:', error);
  }
}

async function publicarEventoGameFirebase(evento) {
  if (!firebaseOperatorKey || !window.ccoFirebase || !gameState.operador) return;
  try {
    const payload = {
      ...evento,
      operador: gameState.operador,
      operadorNome: gameState.operador.split('@')[0],
      operadorUid: firebaseOperatorKey,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    // GAME OFICIAL: detalhes completos ficam na sessão oficial.
    if (firebaseGamePhase === 'official' && firebaseGameSessionId) {
      await window.ccoFirebase.db.ref(`game/events/${firebaseGameSessionId}`).push(payload);
      return;
    }

    // TREINAMENTO: registra somente o histórico de operações do próprio operador.
    // Isso permite ao ADM consultar as ações do operador selecionado sem misturar
    // treinamento com o monitoramento do GAME OFICIAL.
    const ref = window.ccoFirebase.db.ref(`operadores/${firebaseOperatorKey}/historicoTreinamento`);
    await ref.transaction(current => {
      const historico = Array.isArray(current) ? current : [];
      historico.push(payload);
      return historico.slice(-100);
    });
  } catch (error) {
    console.error('[CCO 4.0] Erro ao publicar evento:', error);
  }
}

function iniciarGameOficialLocal(sessionId) {
  firebaseGamePhase = 'official';
  firebaseGameSessionId = sessionId || firebaseGameSessionId || String(Date.now());
  gameState.emExecucao = true;
  gameOfficialStartedAt = Date.now();
  gameRulesAcknowledged = true;
  gameRulesSessionId = firebaseGameSessionId;
  sincronizarOperadorFirebase();
  iniciarGeradorDeIncidentes();
  console.info('[CCO 4.0] GAME OFICIAL recebido após regras apresentadas. Sessão:', firebaseGameSessionId);
}


function mostrarRegrasGameOficial() {
  if (!gameState.operador || gameState.isAdmin) return;
  const modal = document.getElementById('game-rules-modal');
  if (!modal) return;
  const sessionLabel = modal.querySelector('[data-session]');
  if (sessionLabel) sessionLabel.textContent = firebaseGameSessionId || 'Apresentação';
  const intro = modal.querySelector('.game-rules-intro');
  if (intro) intro.textContent = 'O Administrador está apresentando as regras. Leia com atenção; o Game Oficial só começa depois que a apresentação for encerrada pelo ADM.';
  const confirm = document.getElementById('btn-confirm-rules');
  if (confirm) {
    confirm.textContent = '👀 Regras em apresentação — aguarde o ADM';
    confirm.disabled = true;
    confirm.style.cursor = 'default';
    confirm.style.opacity = '0.8';
  }
  try {
    if (typeof modal.showModal === 'function' && !modal.open) modal.showModal();
    else modal.setAttribute('open', '');
  } catch (e) {
    modal.setAttribute('open', '');
  }
}

function esconderRegrasGameOficial() {
  const modal = document.getElementById('game-rules-modal');
  if (!modal) return;
  try { if (typeof modal.close === 'function' && modal.open) modal.close(); } catch (e) {}
  modal.removeAttribute('open');
  modal.setAttribute('aria-hidden', 'true');
}

// Fallback robusto para o botão de confirmação das regras.
// Usa delegação de evento para funcionar mesmo quando o modal é exibido dinamicamente.
document.addEventListener('click', function(event) {
  const btn = event.target.closest && event.target.closest('#btn-confirm-rules');
  if (!btn) return;
  event.preventDefault();
  event.stopPropagation();
  confirmarRegrasGameOficial();
}, true);

// Fallback adicional para telas/dispositivos que não entregam click normalmente.
document.addEventListener('pointerup', function(event) {
  const btn = event.target.closest && event.target.closest('#btn-confirm-rules');
  if (!btn) return;
  event.preventDefault();
  event.stopPropagation();
  if (typeof window.confirmarRegrasGameOficial === 'function') window.confirmarRegrasGameOficial();
}, true);

window.confirmarRegrasGameOficial = function confirmarRegrasGameOficial() {
  // Mantido apenas por compatibilidade com versões antigas; nesta arquitetura
  // somente o ADM controla a abertura/fechamento das regras.
  console.info('[CCO 4.0] A confirmação das regras é controlada pelo ADM.');
};

// Listener direto no próprio botão. Não depende de onclick inline.
function instalarBotaoConfirmacaoRegras() {
  const btn = document.getElementById('btn-confirm-rules');
  if (!btn || btn.dataset.listenerInstalled === '1') return;
  btn.dataset.listenerInstalled = '1';
  btn.disabled = false;
  btn.style.pointerEvents = 'auto';
  btn.style.position = 'relative';
  btn.style.zIndex = '2147483647';
  btn.addEventListener('click', window.confirmarRegrasGameOficial, false);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', instalarBotaoConfirmacaoRegras, { once: true });
} else {
  instalarBotaoConfirmacaoRegras();
}

function encerrarGameOficialLocal() {
  firebaseGamePhase = 'training';
  firebaseGameSessionId = null;
  gameRulesAcknowledged = false;
  gameRulesSessionId = null;
  gameState.emExecucao = false;
  gameOfficialStartedAt = null;
  if (gameState.intervaloCards) clearInterval(gameState.intervaloCards);
  gameState.intervaloCards = null;
  gameState.cardsAtivos = [];
  const container = document.getElementById('game-cards-container');
  if (container) container.innerHTML = '';
  sincronizarOperadorFirebase();
  console.info('[CCO 4.0] GAME OFICIAL encerrado.');
}

function escutarComandoLimpezaFirebase() {
  if (!window.ccoFirebase || !window.ccoFirebase.db || !firebaseOperatorKey) return;
  if (firebaseClearListener) firebaseClearListener.off();
  firebaseClearListener = window.ccoFirebase.db.ref('game/clearRequestedAt');
  firebaseClearListener.on('value', async snapshot => {
    const at = Number(snapshot.val() || 0);
    if (!at || at <= firebaseLastClearAt) return;
    firebaseLastClearAt = at;
    try {
      gameState.pontuacao = 0;
      desafioAtualId = null;
      desafioAtual = null;
      desafioRespostaSelecionada = null;
      desafioRespondendo = false;
      desafioRenderIndex = -1;
      if (desafioTimer) { clearInterval(desafioTimer); desafioTimer = null; }
      if (desafioListener) { desafioListener.off(); desafioListener = null; }
      await window.ccoFirebase.db.ref(`operadores/${firebaseOperatorKey}`).update({
        pontos: 0, fase: 'training', status: 'online',
        historicoTreinamento: [],
        desafioAtivo: null,
        desafiosProcessados: null,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      });
      // Fecha visualmente qualquer desafio que tenha ficado aberto antes da limpeza.
      const challengeDialog = document.getElementById('challenge-dialog');
      if (challengeDialog) { try { challengeDialog.close(); } catch(e) {} challengeDialog.removeAttribute('open'); }
      const challengeList = document.getElementById('challenge-operators-list');
      if (challengeList) challengeList.innerHTML = '<div class=\"challenge-empty\">Aguardando operadores online...</div>';
      gameState.historicoTreinamento = [];
      console.info('[CCO 4.0] Nova partida: pontuacao, historico e desafio ativo zerados.');
    } catch (error) {
      console.error('[CCO 4.0] Erro ao zerar pontuacao:', error);
    }
  });
}

function escutarEstadoGameFirebase() {
  if (!window.ccoFirebase || !window.ccoFirebase.db) return;
  if (firebaseGameStatusListener) firebaseGameStatusListener.off();
  firebaseGameStatusListener = window.ccoFirebase.db.ref('game');
  firebaseGameStatusListener.on('value', snapshot => {
    const game = snapshot.val() || {};
    const sessionId = game.sessionId || game.rulesSessionId || String(game.iniciadoEm || Date.now());

    if (game.rulesVisible === true) {
      firebaseGameSessionId = sessionId;
      gameRulesSessionId = sessionId;
      mostrarRegrasGameOficial();
      return;
    }

    if (game.status === 'official') {
      firebaseGamePhase = 'official';
      firebaseGameSessionId = sessionId;
      gameRulesSessionId = sessionId;
      gameRulesAcknowledged = game.rulesPresented === true;
      gameOfficialStartedAt = Number(game.iniciadoEm || Date.now());
      gameState.emExecucao = true;
      esconderRegrasGameOficial();
      sincronizarOperadorFirebase();
      iniciarGeradorDeIncidentes();
      console.info('[CCO 4.0] GAME OFICIAL iniciado após apresentação das regras.');
    } else {
      if (game.rulesPresented === true) {
        gameRulesAcknowledged = true;
        gameRulesSessionId = sessionId;
        esconderRegrasGameOficial();
      }
      if (firebaseGamePhase === 'official' || gameState.emExecucao) encerrarGameOficialLocal();
      else sincronizarOperadorFirebase();
    }
  }, error => console.error('[CCO 4.0] Erro ao ouvir estado do Game:', error));
}


async function sincronizarOperadorFirebase() {
  if (!firebaseOperatorKey || !window.ccoFirebase || gameState.isAdmin || !gameState.operador) return;

  const nome = gameState.operador.split('@')[0]
    .split('.')
    .map(p => p ? p.charAt(0).toUpperCase() + p.slice(1) : p)
    .join(' ');

  const dados = {
    nome,
    email: gameState.operador,
    pontos: Number(gameState.pontuacao || 0),
    status: 'online',
    fase: firebaseGamePhase,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };

  try {
    await window.ccoFirebase.db.ref(`operadores/${firebaseOperatorKey}`).update(dados);
  } catch (error) {
    console.error('[CCO 4.0] Erro ao sincronizar operador:', error);
  }
}

// Expõe um teste manual no console: testarFirebase() ou testarFirebase(500).
window.testarFirebase = async function(pontos = 100) {
  if (!gameState.operador) {
    console.warn('[CCO 4.0] Faça login como operador antes do teste.');
    return;
  }
  gameState.pontuacao = Number(pontos);
  await inicializarSincronizacaoFirebase();
  console.info(`[CCO 4.0] Teste enviado: ${pontos} pontos.`);
};

// Começa a conexão quando o documento estiver pronto; o login ainda define
// gameState.operador e a rotina passa a publicar os dados após o login.
window.addEventListener('load', () => {
  if (window.ccoFirebase && window.ccoFirebase.ready) {
    window.ccoFirebase.ready.catch(() => {});
  }
});


/* ==========================================================================
   REPASSE — DESAFIO | ETAPA 42
   Desafio individual sincronizado pelo Firebase.
   - Lista somente operadores online.
   - Ambos recebem a mesma sequência de 10 ocorrências.
   - Pontuação do desafio é separada da pontuação acumulada.
   - Repasse padrão: 20% dos pontos que o perdedor tinha no início.
   ========================================================================== */
let desafioListener = null;
let desafioAtualId = null;
let desafioAtual = null;
let desafioRespostaSelecionada = null;
let desafioTimer = null;
let desafioRenderIndex = -1;
const DESAFIO_PERCENTUAL = 0.20;
const DESAFIO_RODADAS = 10;
const DESAFIO_TEMPO = 30;

function abrirPainelDesafio() {
  if (!gameState.operador || !firebaseOperatorKey || !window.ccoFirebase?.db) {
    alert('Aguarde a conexão do operador com o sistema.');
    return;
  }
  const dlg = document.getElementById('challenge-dialog');
  if (!dlg) return;
  mostrarSubviewDesafio('list');
  carregarOperadoresDesafiaveis();
  if (typeof dlg.showModal === 'function' && !dlg.open) dlg.showModal();
  else dlg.setAttribute('open','');
}

function fecharPainelDesafio() {
  const dlg = document.getElementById('challenge-dialog');
  if (!dlg) return;
  try { if (dlg.open) dlg.close(); } catch(e) {}
  dlg.removeAttribute('open');
}

function mostrarSubviewDesafio(tipo) {
  const views = {
    list: document.getElementById('challenge-list-view'),
    invite: document.getElementById('challenge-invite-view'),
    active: document.getElementById('challenge-active-view'),
    result: document.getElementById('challenge-result-view')
  };
  Object.keys(views).forEach(k => { if (views[k]) views[k].hidden = k !== tipo; });
}

function nomeAmigavelDesafio(email, fallback='Operador') {
  const base = String(email || '').split('@')[0];
  return base.split('.').filter(Boolean).map(p => p.charAt(0).toUpperCase()+p.slice(1)).join(' ') || fallback;
}

async function carregarOperadoresDesafiaveis() {
  const box = document.getElementById('challenge-operators-list');
  if (!box) return;
  box.innerHTML = '<div class=\"challenge-empty\">Carregando operadores online...</div>';
  try {
    const [opsSnap, desafiosSnap, clearSnap] = await Promise.all([
      window.ccoFirebase.db.ref('operadores').once('value'),
      window.ccoFirebase.db.ref('game/desafios').once('value'),
      window.ccoFirebase.db.ref('game/desafiosLimparEm').once('value')
    ]);

    const data = opsSnap.val() || {};
    const desafios = desafiosSnap.val() || {};
    const clearAt = Number(clearSnap.val() || 0);
    const agora = Date.now();
    const ONLINE_WINDOW_MS = 8000;

    // Não usamos mais "desafioAtivo" como critério de exclusão. Esse campo pode
    // ficar antigo se uma aba for fechada. O estado real é obtido dos desafios.
    const ocupados = new Set();
    Object.values(desafios).forEach(d => {
      if (!d) return;
      const criado = Number(d.criadoEm || d.iniciadoEm || 0);
      if (clearAt && criado && criado <= clearAt) return;
      if (d.status === 'pending' || d.status === 'active') {
        if (d.desafianteUid) ocupados.add(d.desafianteUid);
        if (d.desafiadoUid) ocupados.add(d.desafiadoUid);
      }
    });

    // Dedupe por e-mail: versões anteriores usavam o auth UID como chave,
    // então um registro antigo pode coexistir com o novo registro operacional.
    // O e-mail é a identidade do operador no CCO e deve aparecer uma única vez.
    const porEmail = new Map();
    Object.entries(data).forEach(([uid, op]) => {
      if (!op || !op.email) return;
      const email = String(op.email).trim().toLowerCase();
      if (email === String(gameState.operador || '').trim().toLowerCase()) return;
      const atualizado = Number(op.updatedAt || 0);
      const recente = atualizado > 0 && (agora - atualizado) <= ONLINE_WINDOW_MS;
      if (op.status !== 'online' || !recente) return;
      const anterior = porEmail.get(email);
      if (!anterior || atualizado > anterior.updatedAt) {
        porEmail.set(email, { uid, op, updatedAt: atualizado });
      }
    });

    const lista = [...porEmail.values()]
      .map(({uid, op}) => [uid, op])
      .sort((a,b) => String(a[1].nome || a[1].email).localeCompare(String(b[1].nome || b[1].email), 'pt-BR'));

    if (!lista.length) {
      box.innerHTML = '<div class=\"challenge-empty\">Nenhum outro operador está online no momento.</div>';
      return;
    }

    box.innerHTML = lista.map(([uid, op]) => {
      const ocupado = ocupados.has(uid);
      return `
      <div class=\"challenge-operator\">
        <div class=\"challenge-operator-info\">
          <span class=\"challenge-online-dot\"></span>
          <div><strong>${escapeHtmlDesafio(op.nome || nomeAmigavelDesafio(op.email))}</strong>
          <small>${escapeHtmlDesafio(op.email || '')} · ${Number(op.pontos || 0)} pts${ocupado ? ' · em desafio' : ''}</small></div>
        </div>
        <button class=\"challenge-btn primary\" ${ocupado ? 'disabled title=\"Este operador já está em um desafio.\"' : `onclick=\"enviarDesafio('${uid}')\"`}>${ocupado ? 'Em desafio' : 'Desafiar'}</button>
      </div>`;
    }).join('');
  } catch (e) {
    console.error('[DESAFIO] Falha ao carregar operadores:', e);
    box.innerHTML = '<div class=\"challenge-empty\">Não foi possível carregar os operadores online. Verifique a conexão com o Firebase.</div>';
  }
}
function escapeHtmlDesafio(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function normalizarRespostasDesafio(valor) {
  if (Array.isArray(valor)) return valor.filter(Boolean);
  if (valor && typeof valor === 'object') {
    return Object.keys(valor).sort((a,b)=>Number(a)-Number(b)).map(k=>valor[k]).filter(Boolean);
  }
  return [];
}

function gerarSequenciaDesafio() {
  const banco = Array.isArray(bancoIncidentes) ? bancoIncidentes.filter(Boolean) : [];
  const pool = banco.slice();
  const resultado = [];
  while (resultado.length < DESAFIO_RODADAS && pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    const escolhido = pool.splice(idx,1)[0];
    if (escolhido && escolhido.id != null) resultado.push(escolhido.id);
  }
  let i = 0;
  while (resultado.length < DESAFIO_RODADAS && banco.length) {
    const item = banco[i % banco.length];
    if (item && item.id != null) resultado.push(item.id);
    i++;
    if (i > banco.length * 2) break;
  }
  return resultado;
}

async function enviarDesafio(uidDesafiado) {
  if (!uidDesafiado || uidDesafiado === firebaseOperatorKey) return;
  try {
    const alvoSnap = await window.ccoFirebase.db.ref(`operadores/${uidDesafiado}`).once('value');
    const alvo = alvoSnap.val();
    const atualizado = Number(alvo?.updatedAt || 0);
    const online = !!alvo && alvo.status === 'online' && atualizado > 0 && (Date.now() - atualizado) <= 8000;
    if (!online) {
      alert('Esse operador não está mais online.');
      carregarOperadoresDesafiaveis();
      return;
    }

    // Confirma no próprio banco se o alvo já está em outro desafio ativo.
    const desafiosSnap = await window.ccoFirebase.db.ref('game/desafios').once('value');
    const desafios = desafiosSnap.val() || {};
    const clearSnap = await window.ccoFirebase.db.ref('game/desafiosLimparEm').once('value');
    const clearAt = Number(clearSnap.val() || 0);
    const alvoOcupado = Object.values(desafios).some(d => {
      if (!d || (d.status !== 'pending' && d.status !== 'active')) return false;
      const criado = Number(d.criadoEm || d.iniciadoEm || 0);
      if (clearAt && criado && criado <= clearAt) return false;
      return d.desafianteUid === uidDesafiado || d.desafiadoUid === uidDesafiado;
    });
    if (alvoOcupado) {
      alert('Esse operador já está participando de um desafio.');
      carregarOperadoresDesafiaveis();
      return;
    }

    const desafioRef = window.ccoFirebase.db.ref('game/desafios').push();
    const desafio = {
      desafianteUid: firebaseOperatorKey,
      desafianteEmail: gameState.operador,
      desafianteNome: nomeAmigavelDesafio(gameState.operador),
      desafiadoUid: uidDesafiado,
      desafiadoEmail: alvo.email || '',
      desafiadoNome: alvo.nome || nomeAmigavelDesafio(alvo.email),
      percentual: DESAFIO_PERCENTUAL,
      rodadas: DESAFIO_RODADAS,
      tempoPorRodada: DESAFIO_TEMPO,
      ocorrencias: gerarSequenciaDesafio(),
      pontosBaseDesafiante: Number(gameState.pontuacao || 0),
      pontosBaseDesafiado: Number(alvo.pontos || 0),
      resultados: {
        [firebaseOperatorKey]: {respostas: [], pontos: 0, acertos: 0, erros: 0}
      },
      status: 'pending',
      criadoEm: firebase.database.ServerValue.TIMESTAMP
    };
    await desafioRef.set(desafio);
    desafioAtualId = desafioRef.key;
    desafioAtual = desafio;
    desafioRenderIndex = -1;
    await window.ccoFirebase.db.ref(`operadores/${firebaseOperatorKey}/desafioAtivo`).set(desafioRef.key);
    mostrarSubviewDesafio('invite');
    document.getElementById('challenge-invite-title').textContent = 'Convite enviado';
    document.getElementById('challenge-invite-text').textContent =
      `Aguardando ${desafio.desafiadoNome} aceitar o desafio. Repasse: ${DESAFIO_PERCENTUAL*100}% dos pontos iniciais.`;
    document.getElementById('challenge-accept-btn').style.display = 'none';
    document.getElementById('challenge-reject-btn').textContent = 'Cancelar';
    instalarListenerDesafio(desafioRef.key);
  } catch (e) {
    console.error('[DESAFIO] Erro ao enviar:', e);
    alert('Não foi possível enviar o desafio.\n\nDetalhe: ' + (e?.message || 'erro desconhecido'));
  }
}

function instalarListenerDesafio(id) {
  if (!id || !window.ccoFirebase?.db) return;
  if (desafioListener) desafioListener.off();
  desafioListener = window.ccoFirebase.db.ref(`game/desafios/${id}`);
  desafioListener.on('value', snap => {
    const d = snap.val();
    if (!d) return;
    desafioAtualId = id;
    desafioAtual = d;

    if (d.status === 'pending') {
      const souDesafiado = d.desafiadoUid === firebaseOperatorKey;
      const souDesafiante = d.desafianteUid === firebaseOperatorKey;
      if (souDesafiado) {
        mostrarSubviewDesafio('invite');
        document.getElementById('challenge-invite-title').textContent = '⚔️ Desafio recebido';
        document.getElementById('challenge-invite-text').textContent =
          `${d.desafianteNome} desafiou você. Os dois receberão as mesmas 10 ocorrências. O vencedor recebe ${Number(d.percentual)*100}% dos pontos iniciais do adversário.`;
        document.getElementById('challenge-accept-btn').style.display = '';
        document.getElementById('challenge-reject-btn').textContent = 'Recusar';
        document.getElementById('challenge-accept-btn').onclick = () => responderConviteDesafio(true);
        document.getElementById('challenge-reject-btn').onclick = () => responderConviteDesafio(false);
        const dlg=document.getElementById('challenge-dialog');
        if (dlg && !dlg.open) { try{dlg.showModal()}catch(e){dlg.setAttribute('open','')} }
      } else if (souDesafiante) {
        // Mantém a tela de espera.
      }
      return;
    }

    if (d.status === 'accepted' || d.status === 'active') {
      mostrarSubviewDesafio('active');
      renderizarDesafioAtivo(d);
      return;
    }

    if (d.status === 'finished') {
      finalizarVisualDesafio(d);
      return;
    }

    if (d.status === 'rejected' || d.status === 'cancelled') {
      if (d.desafianteUid === firebaseOperatorKey || d.desafiadoUid === firebaseOperatorKey) {
        mostrarSubviewDesafio('result');
        document.getElementById('challenge-result-icon').textContent = '↩️';
        document.getElementById('challenge-result-title').textContent = d.status === 'rejected' ? 'Desafio recusado' : 'Desafio cancelado';
        document.getElementById('challenge-result-text').textContent = 'Nenhum ponto foi transferido.';
      }
    }
  });
}

async function responderConviteDesafio(aceitar) {
  if (!desafioAtualId) return;
  const ref = window.ccoFirebase.db.ref(`game/desafios/${desafioAtualId}`);
  if (!aceitar) {
    await ref.update({status:'rejected', encerradoEm: firebase.database.ServerValue.TIMESTAMP});
    await window.ccoFirebase.db.ref(`operadores/${firebaseOperatorKey}/desafioAtivo`).remove();
    return;
  }
  await ref.update({
    status:'active',
    aceitoEm: firebase.database.ServerValue.TIMESTAMP,
    iniciadoEm: firebase.database.ServerValue.TIMESTAMP,
    [`resultados/${firebaseOperatorKey}`]: {respostas: [], pontos: 0, acertos: 0, erros: 0}
  });
  await window.ccoFirebase.db.ref(`operadores/${firebaseOperatorKey}/desafioAtivo`).set(desafioAtualId);
}

function obterOcorrenciaDesafio(d, indice) {
  const ocorrencias = Array.isArray(d?.ocorrencias) ? d.ocorrencias : [];
  const id = Number(ocorrencias[indice]);
  const banco = Array.isArray(bancoIncidentes) ? bancoIncidentes : [];
  return banco.find(x => Number(x.id) === id) || banco[0] || null;
}

function renderizarDesafioAtivo(d) {
  const souA = d.desafianteUid === firebaseOperatorKey;
  const meuUid = firebaseOperatorKey;
  const meuRaw = (d.resultados && d.resultados[meuUid]) || {};
  const meu = {...meuRaw, respostas: normalizarRespostasDesafio(meuRaw.respostas)};
  const outroUid = souA ? d.desafiadoUid : d.desafianteUid;
  const outroRaw = (d.resultados && d.resultados[outroUid]) || {};
  const outro = {...outroRaw, respostas: normalizarRespostasDesafio(outroRaw.respostas)};

  document.getElementById('challenge-me-name').textContent = souA ? d.desafianteNome : d.desafiadoNome;
  document.getElementById('challenge-op-name').textContent = souA ? d.desafiadoNome : d.desafianteNome;
  document.getElementById('challenge-me-score').textContent = `${Math.max(0, Number(meu.pontos||0))} pts`;
  document.getElementById('challenge-op-score').textContent = `${Math.max(0, Number(outro.pontos||0))} pts`;

  const indice = Math.min((meu.respostas || []).length, DESAFIO_RODADAS-1);
  // O feedback pertence à ocorrência que acabou de ser respondida.
  // Quando a sincronização do Firebase avança para a próxima ocorrência,
  // limpamos qualquer feedback antigo (inclusive "TEMPO ESGOTADO").
  const feedbackAtual = document.getElementById('challenge-feedback');
  if (feedbackAtual && feedbackAtual.dataset.indice !== String(indice)) {
    feedbackAtual.hidden = true;
    feedbackAtual.innerHTML = '';
    feedbackAtual.removeAttribute('data-indice');
  }
  if ((meu.respostas || []).length >= DESAFIO_RODADAS) {
    document.getElementById('challenge-progress').textContent = 'Você concluiu. Aguardando o adversário...';
    document.getElementById('challenge-card-title').textContent = 'Aguardando resultado';
    document.getElementById('challenge-card-description').textContent = 'O resultado será definido assim que os dois operadores terminarem.';
    document.getElementById('challenge-card-options').innerHTML = '';
    document.getElementById('challenge-answer-btn').disabled = true;
    return;
  }

  const occ = obterOcorrenciaDesafio(d, indice);
  if (!occ) return;
  document.getElementById('challenge-progress').textContent = `Ocorrência ${indice+1} de ${DESAFIO_RODADAS}`;
  document.getElementById('challenge-card-meta').textContent = `REPASSE · ${(occ.criticidade||'moderado').toUpperCase()}`;
  document.getElementById('challenge-card-title').textContent = occ.titulo;
  document.getElementById('challenge-card-description').textContent = occ.descricao;
  const options = document.getElementById('challenge-card-options');
  options.innerHTML = (occ.opcoes||[]).map((o,i)=>`<button class="challenge-option" data-index="${i}">${escapeHtmlDesafio(o.texto)}</button>`).join('');
  desafioRespostaSelecionada = null;
  options.querySelectorAll('.challenge-option').forEach(btn => {
    btn.addEventListener('click',()=> {
      if (btn.disabled) return;
      options.querySelectorAll('.challenge-option').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      desafioRespostaSelecionada = Number(btn.dataset.index);
      document.getElementById('challenge-answer-btn').disabled = false;
    });
  });
  const answer = document.getElementById('challenge-answer-btn');
  answer.disabled = true;
  answer.onclick = () => responderOcorrenciaDesafio(false);
  if (desafioRenderIndex !== indice) {
    desafioRenderIndex = indice;
    iniciarTimerDesafio(d, indice);
  }
}

function iniciarTimerDesafio(d, indice) {
  if (desafioTimer) clearInterval(desafioTimer);
  let fim = Date.now() + DESAFIO_TEMPO*1000;
  const timerEl = document.getElementById('challenge-card-timer');
  desafioTimer = setInterval(async ()=>{
    const restante = Math.max(0, Math.ceil((fim-Date.now())/1000));
    if (timerEl) timerEl.textContent = `${restante}s`;
    if (restante <= 0) {
      clearInterval(desafioTimer); desafioTimer=null;
      await responderOcorrenciaDesafio(true);
    }
  },250);
}

let desafioRespondendo = false;

async function responderOcorrenciaDesafio(timeout=false) {
  // Impede duplo clique, corrida entre clique manual e timeout e gravação duplicada.
  if (desafioRespondendo) return;
  desafioRespondendo = true;

  try {
    if (!desafioAtualId || !desafioAtual || !['accepted','active'].includes(desafioAtual.status)) return;

    // Se a resposta foi manual, interrompe imediatamente o timer daquela rodada.
    if (!timeout && desafioTimer) {
      clearInterval(desafioTimer);
      desafioTimer = null;
    }

    const snap = await window.ccoFirebase.db.ref(`game/desafios/${desafioAtualId}`).once('value');
    const d = snap.val();
    if (!d || !['accepted','active'].includes(d.status)) return;

    const meuRaw = (d.resultados && d.resultados[firebaseOperatorKey]) || {};
    const respostasAtuais = normalizarRespostasDesafio(meuRaw.respostas);
    const meu = {...meuRaw, respostas: respostasAtuais};

    // Cada operador só pode responder uma vez por ocorrência.
    if (respostasAtuais.length >= DESAFIO_RODADAS) return;

    const indice = respostasAtuais.length;
    const occ = obterOcorrenciaDesafio(d, indice);
    if (!occ) return;

    let correta = false;
    let delta = 0;
    let resposta = 'timeout';

    // Resposta manual: somente uma opção realmente selecionada pode gerar acerto/erro.
    if (!timeout && desafioRespostaSelecionada !== null) {
      const opt = occ.opcoes?.[desafioRespostaSelecionada];

      // Aceita tanto boolean true quanto string "true".
      correta = opt?.correta === true || String(opt?.correta).toLowerCase() === 'true';

      if (correta) {
        // Acerto sempre soma pontos positivos.
        const pontosPadrao = occ.criticidade === 'critico'
          ? 150
          : (occ.criticidade === 'grave' ? 100 : 70);
        delta = Math.abs(Number(opt?.pontos ?? pontosPadrao)) || pontosPadrao;
      } else {
        // Erro sempre desconta pontos.
        const penalidadePadrao = occ.criticidade === 'critico'
          ? 100
          : (occ.criticidade === 'grave' ? 80 : 50);
        delta = -Math.abs(Number(opt?.penalidade ?? penalidadePadrao)) || -penalidadePadrao;
      }

      resposta = desafioRespostaSelecionada;
    } else {
      // Tempo esgotado: penalidade fixa.
      delta = -75;
    }

    const novaResposta = {
      indice,
      ocorrenciaId: occ.id,
      resposta,
      correta,
      pontos: delta,
      respondidoEm: Date.now()
    };

    // Mantém compatibilidade com o formato antigo (array) e o novo (objeto indexado).
    const respostasObjeto = {};
    respostasAtuais.forEach((r, i) => {
      respostasObjeto[String(i)] = r;
    });
    respostasObjeto[String(indice)] = novaResposta;

    // A pontuação do desafio nunca fica abaixo de zero.
    const pontosAntes = Math.max(0, Number(meu.pontos || 0));
    const pontosDepois = Math.max(0, Math.round(pontosAntes + delta));

    const novo = {
      respostas: respostasObjeto,
      pontos: pontosDepois,
      acertos: Number(meu.acertos || 0) + (correta ? 1 : 0),
      erros: Number(meu.erros || 0) + (!correta ? 1 : 0)
    };

    const caminhoResultado = `game/desafios/${desafioAtualId}/resultados/${firebaseOperatorKey}`;
    await window.ccoFirebase.db.ref(caminhoResultado).set(novo);

    // Feedback usa o índice calculado nesta própria resposta, sem depender
    // da atualização assíncrona do Firebase para descobrir a ocorrência.
    mostrarFeedbackDesafio({
      correta,
      timeout,
      delta: pontosDepois - pontosAntes,
      pontosAntes,
      pontosDepois,
      indice
    });

    desafioRespostaSelecionada = null;

    const btnResponder = document.getElementById('challenge-answer-btn');
    if (btnResponder) btnResponder.disabled = true;

    if (respostasAtuais.length + 1 >= DESAFIO_RODADAS) {
      await verificarFinalizacaoDesafio(desafioAtualId);
    }
  } catch (e) {
    console.error('[DESAFIO] Erro ao responder ocorrência:', e);
    alert('Não foi possível registrar sua resposta.\n\nDetalhe: ' + (e?.message || 'erro desconhecido'));

    const btnResponder = document.getElementById('challenge-answer-btn');
    if (btnResponder) btnResponder.disabled = false;
  } finally {
    desafioRespondendo = false;
  }
}

function mostrarFeedbackDesafio({correta, timeout, delta, pontosAntes, pontosDepois, indice}) {
  const el = document.getElementById('challenge-feedback');
  if (!el) return;

  const indiceSeguro = Math.max(0, Number(indice) || 0);
  el.dataset.indice = String(indiceSeguro);
  el.hidden = false;
  el.className = 'challenge-feedback ' + (correta ? 'is-correct' : 'is-wrong');

  const titulo = correta
    ? 'ACERTO'
    : (timeout ? 'TEMPO ESGOTADO' : 'DECISÃO INCORRETA');
  const sinal = delta > 0 ? '+' : '';

  el.innerHTML = `<strong>${titulo}</strong><span>${sinal}${delta} pontos</span><small>${pontosAntes} pts → ${pontosDepois} pts</small>`;

  // O feedback não fica preso na tela se o Firebase demorar para avançar.
  clearTimeout(window._challengeFeedbackTimer);
  window._challengeFeedbackTimer = setTimeout(() => {
    const atual = document.getElementById('challenge-feedback');
    if (!atual) return;
    atual.hidden = true;
    atual.innerHTML = '';
    atual.removeAttribute('data-indice');
  }, 1800);
}
async function verificarFinalizacaoDesafio(id) {
  const ref=window.ccoFirebase.db.ref(`game/desafios/${id}`);
  const snap=await ref.once('value'); const d=snap.val();
  if (!d || d.status !== 'active') return;
  const a=d.resultados?.[d.desafianteUid], b=d.resultados?.[d.desafiadoUid];
  if (!a || !b || normalizarRespostasDesafio(a.respostas).length<DESAFIO_RODADAS || normalizarRespostasDesafio(b.respostas).length<DESAFIO_RODADAS) return;

  const vencedorUid = Number(a.pontos||0)===Number(b.pontos||0) ? null :
    (Number(a.pontos||0)>Number(b.pontos||0)?d.desafianteUid:d.desafiadoUid);
  const perdedorUid = vencedorUid ? (vencedorUid===d.desafianteUid?d.desafiadoUid:d.desafianteUid) : null;
  const repasse = vencedorUid ? Math.floor(Number(d[vencedorUid===d.desafianteUid?'pontosBaseDesafiado':'pontosBaseDesafiante']||0)*Number(d.percentual||DESAFIO_PERCENTUAL)) : 0;

  await ref.transaction(current=>{
    if (!current || current.status !== 'active') return;
    return {...current,status:'finished',vencedorUid,perdedorUid,repasse,finalizadoEm:firebase.database.ServerValue.TIMESTAMP};
  });
}

async function aplicarRepasseSeNecessario(d) {
  if (!d || d.status!=='finished' || !firebaseOperatorKey) return;
  const souVencedor=d.vencedorUid===firebaseOperatorKey;
  const souPerdedor=d.perdedorUid===firebaseOperatorKey;
  if (!souVencedor && !souPerdedor) return;

  const marcaRef=window.ccoFirebase.db.ref(`operadores/${firebaseOperatorKey}/desafiosProcessados/${desafioAtualId}`);
  const token=String(Date.now())+'-'+Math.random().toString(36).slice(2);
  const tx=await marcaRef.transaction(v => v || token);
  if (tx.snapshot.val() !== token) return;

  // Ao finalizar o Repasse, os pontos conquistados nas 10 ocorrências
  // entram na pontuação oficial do operador. O vencedor ainda recebe
  // o repasse; o perdedor tem esse mesmo valor descontado.
  const resultadoProprio = d.resultados?.[firebaseOperatorKey] || {};
  const pontosDesafio = Math.max(0, Number(resultadoProprio.pontos || 0));
  const valorRepasse = Number(d.repasse || 0);
  const deltaRepasse = souVencedor ? valorRepasse : -valorRepasse;
  const deltaTotal = pontosDesafio + deltaRepasse;

  gameState.pontuacao = Math.max(0, Number(gameState.pontuacao || 0) + deltaTotal);

  await window.ccoFirebase.db.ref(`operadores/${firebaseOperatorKey}`).update({
    pontos: gameState.pontuacao,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  });

  atualizarPontuacaoUI();

  console.info('[DESAFIO] Pontos do desafio incorporados à pontuação oficial:', {
    pontosDesafio,
    repasse: deltaRepasse,
    deltaTotal,
    novaPontuacao: gameState.pontuacao
  });
}

async function finalizarVisualDesafio(d) {
  if (desafioTimer) { clearInterval(desafioTimer); desafioTimer=null; }
  await aplicarRepasseSeNecessario(d);
  await window.ccoFirebase.db.ref(`operadores/${firebaseOperatorKey}/desafioAtivo`).remove();
  mostrarSubviewDesafio('result');
  const souVencedor=d.vencedorUid===firebaseOperatorKey;
  const empate=!d.vencedorUid;
  document.getElementById('challenge-result-icon').textContent=empate?'🤝':(souVencedor?'🏆':'📋');
  document.getElementById('challenge-result-title').textContent=empate?'Empate!':(souVencedor?'Você venceu o desafio!':'Desafio encerrado');
  const a=d.resultados?.[d.desafianteUid]||{}, b=d.resultados?.[d.desafiadoUid]||{};
  const meuP= firebaseOperatorKey===d.desafianteUid ? a.pontos : b.pontos;
  const opP= firebaseOperatorKey===d.desafianteUid ? b.pontos : a.pontos;
  document.getElementById('challenge-result-text').textContent =
    `${d.desafianteNome}: ${Number(a.pontos||0)} pts · ${d.desafiadoNome}: ${Number(b.pontos||0)} pts. `+
    (empate?'Os pontos do desafio foram incorporados à sua pontuação.':souVencedor?`Você recebeu ${Number(d.repasse||0)} pontos no Repasse. Seus ${Number(meuP||0)} pontos do desafio também foram incorporados à pontuação oficial.`:`Você perdeu ${Number(d.repasse||0)} pontos no Repasse. Seus ${Number(meuP||0)} pontos do desafio foram incorporados à pontuação oficial.`);
}

function iniciarMonitoramentoDesafios() {
  if (!window.ccoFirebase?.db || !firebaseOperatorKey) return;
  window.ccoFirebase.db.ref('game/desafios').on('value', snap=>{
    const todos=snap.val()||{};
    const meus=Object.entries(todos).filter(([id,d])=>d && (d.desafianteUid===firebaseOperatorKey || d.desafiadoUid===firebaseOperatorKey));
    const ativo=meus.reverse().find(([id,d])=>['pending','active'].includes(d.status));
    if (ativo) {
      const [id,d]=ativo;
      desafioAtualId=id; desafioAtual=d;
      instalarListenerDesafio(id);
      if (d.status==='pending' && d.desafiadoUid===firebaseOperatorKey) {
        const dlg=document.getElementById('challenge-dialog');
        if (dlg && !dlg.open) { try{dlg.showModal()}catch(e){dlg.setAttribute('open','')} }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  const rejeitar=document.getElementById('challenge-reject-btn');
  if (rejeitar) rejeitar.onclick=()=>responderConviteDesafio(false);
});

const _inicializarSincronizacaoFirebaseOriginal = inicializarSincronizacaoFirebase;
inicializarSincronizacaoFirebase = async function() {
  await _inicializarSincronizacaoFirebaseOriginal();
  if (firebaseOperatorKey) iniciarMonitoramentoDesafios();
};
