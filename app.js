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

  const gameState = {
    operador: '',
    isAdmin: false,
    emExecucao: false,
    pontuacao: 0,
    bloqueado: false,
    tempoBloqueio: 0,
    bloqueiosPorAba: {},
    cardsAtivos: [],
    intervaloCards: null,
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
    {
      id: 1,
      titulo: '🔥 Elevação Térmica em Eixo',
      criticidade: 'critico',
      descricao: 'Sensor detectou 92°C no vagão VL-862 (Trecho KM 108).',
      opcoes: [
        { texto: 'Aplicar Manutenção Preditiva no Pátio', correta: true, pontos: 150 },
        { texto: 'Ignorar e manter velocidade nominal', correta: false, penalidade: -100 }
      ],
      risco: 'Risco iminente de descarrilamento se mantido em via.'
    },
    {
      id: 2,
      titulo: '⚠️ Gargalo de Pátio RAMP',
      criticidade: 'grave',
      descricao: 'Acúmulo de composições acima do limite nominal no pátio.',
      opcoes: [
        { texto: 'Redirecionar fluxo para Via Secundária 2', correta: true, pontos: 100 },
        { texto: 'Forçar entrada da composição principal', correta: false, penalidade: -80 }
      ],
      risco: 'Risco de travamento total da malha em 15 minutos.'
    },
    {
      id: 3,
      titulo: '📉 Condução Desecológica',
      criticidade: 'moderado',
      descricao: 'Operador atuando em Notch 8 em trecho de rampa plana.',
      opcoes: [
        { texto: 'Ativar Assistente Eco-Driving Preditivo', correta: true, pontos: 70 },
        { texto: 'Manter controle 100% manual', correta: false, penalidade: -50 }
      ],
      risco: 'Consumo de combustível 18% acima da meta.'
    }
  ];



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

    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        retomarAnimacaoTrem();
      });
    }
  });

  /* ==========================================================================
     GERENCIAMENTO DE NAVEGAÇÃO ENTRE MÓDULOS (ABAS)
     ========================================================================== */
  function switchTab(tabId, element) {
    currentTab = tabId;

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
  }

  function updateUIForCurrentTab() {
    const btn1 = document.getElementById('btn-action-1');
    const btn2 = document.getElementById('btn-action-2');
    const bannerText = document.getElementById('banner-text');

    if (!btn1 || !btn2 || !bannerText) return;

    btn1.style.display = 'inline-block';
    btn2.style.display = 'inline-block';

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
        btn2.innerText = "🛡️ OTIMIZAR MALHA COM RAMP";
        break;

      case 'mod-ia':
        bannerText.innerText = "Sistemas Preditivos: Monitoramento de eixos e temperaturas ativo.";
        bannerText.style.color = "#e2e8f0";
        btn1.innerText = "💥 1. SIMULAR SOBREAQUECIMENTO";
        btn2.innerText = "🛡️ APLICAR MANUTENÇÃO PREDITIVA";
        break;

      case 'mod-eco':
        bannerText.innerText = "Eco-Driving: Algoritmo de aceleração atuando na composição.";
        bannerText.style.color = "#e2e8f0";
        btn1.innerText = "💥 1. SIMULAR MODO MANUAL (DESECOLÓGICO)";
        btn2.innerText = "🛡️ ATIVAR ECO-DRIVING PREDITIVO";
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
        btn2.innerText = "🛡️ CONFIRMAR LEITURAS DAS VIAS";
        break;
    }
  }

  /* ==========================================================================
     GERENCIADOR DE SIMULAÇÕES
     ========================================================================== */
  function executarSimulacaoAtual(isSafe) {
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

    if (!isSafe) {
      const ocorrencia = sortearOcorrencia('mod-malha');
      if (!ocorrencia) return;

      if (rampTrack) rampTrack.setAttribute('class', ocorrencia.visual === 'ramp' ? 'track-animated track-warning' : 'track-animated track-active');
      if (rampZone) rampZone.style.display = ocorrencia.visual === 'ramp' ? 'block' : 'none';

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
      if (vibrationWrapper) vibrationWrapper.classList.toggle('shaking', critical || ocorrencia.visual === 'vibracao');
      if (bogieStructure) bogieStructure.classList.add('bogie-critical');

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
      if (vibrationWrapper) { vibrationWrapper.classList.remove('shaking'); vibrationWrapper.style.animationPlayState = 'running'; }
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
      vibrationWrapper.classList.remove('shaking');
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
    if (vibrationWrapper) vibrationWrapper.style.animationPlayState = 'running';
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

  function renderizarEventosCCO() {
    const container = document.getElementById('notifications-container');
    if (!container) return;

    const ativos = ccoEvents.filter(e => e.status !== 'resolvido');
    notificationCount = ativos.length;

    const badgeCCO = document.getElementById('cco-badge');
    const sidebarBadge = document.getElementById('sidebar-count');
    if (badgeCCO) {
      badgeCCO.innerText = notificationCount;
      badgeCCO.style.display = notificationCount ? 'inline-block' : 'none';
    }
    if (sidebarBadge) sidebarBadge.innerText = `${notificationCount} Ativos`;

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
        aplicarBloqueioOperador('Tempo esgotado para assumir a ocorrência.', evento.origemTab || 'mod-malha');
        atualizarBanner('Tempo esgotado para assumir a ocorrência. -50 pontos e bloqueio de 60 segundos.', '#ef4444');
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
          ? '<div class="cco-training-result error">✕ Decisão inadequada. O operador foi bloqueado por 60 segundos.</div>'
          : evento.resultado === 'timeout-assumir'
            ? '<div class="cco-training-result error">⏱ Prazo para assumir esgotado. -50 pontos e bloqueio de 60 segundos.</div>'
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
      atualizarBanner('Decisão inadequada: operador bloqueado por 60 segundos.', '#ef4444');
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
      bannerText.style.color = cor || "#38bdf8";
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

  /* ==========================================================================
     SISTEMA DE AUTENTICAÇÃO E GAME ENGINE
     ========================================================================== */
  function realizarLoginGame() {
    const emailInput = document.getElementById('game-user-email');
    const userEmail = emailInput ? emailInput.value.trim().toLowerCase() : '';

    if (!userEmail) {
      alert("Por favor, digite seu e-mail corporativo.");
      return;
    }

    if (!whitelist.includes(userEmail)) {
      alert("Acesso negado: Este e-mail não está cadastrado na lista de permissões.");
      return;
    }

    gameState.operador = userEmail;
    const modalLogin = document.getElementById('game-login-modal');
    if (modalLogin) modalLogin.style.display = 'none';

    if (userEmail === "adm@vale.com") {
      gameState.isAdmin = true;

      // O login de administrador já representa a entrada na Central ADM.
      // Não passa mais pela tela do CCO nem exige um segundo clique.
      window.location.href = "admin_game_v2.html";
      return;
    } else {
      gameState.isAdmin = false;
      const adminPanel = document.getElementById('admin-control-panel');
      if (adminPanel) adminPanel.style.display = 'none';

      const userTag = document.getElementById('user-operator-tag');
      if (userTag) {
        userTag.innerText = `PLATAFORMA INTEGRADA CCO 4.0 | OPERADOR: ${userEmail}`;
      }

      // Conecta este operador ao Firebase para sincronizar presença e pontos.
      inicializarSincronizacaoFirebase();
    }

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
    gameState.cardsAtivos = [];
    const container = document.getElementById('game-cards-container');
    if (container) container.innerHTML = '';
    alert('Simulação PARADA pelo Administrador.');
  }

  function iniciarGeradorDeIncidentes() {
    if (!gameState.emExecucao) return;
    gerarNovoCardIncidente();
    gameState.intervaloCards = setInterval(() => {
      if (gameState.emExecucao && !isCurrentTabBlocked() && gameState.cardsAtivos.length < 3) {
        gerarNovoCardIncidente();
      }
    }, 15000);
  }

  function gerarNovoCardIncidente() {
    const incidenteBase = bancoIncidentes[Math.floor(Math.random() * bancoIncidentes.length)];
    const cardId = 'card-' + Date.now();
    const cardData = {
      id: cardId,
      ...incidenteBase,
      opcaoSelecionada: null,
      tempoRestante: 40
    };
    gameState.cardsAtivos.push(cardData);
    renderizarCardHTML(cardData);
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

    const cardElement = document.createElement('div');
    cardElement.id = card.id;
    cardElement.className = `game-card ${card.criticidade}`;
    cardElement.innerHTML = `
      <div class="game-card-timer" id="timer-bar-${card.id}"></div>
      <div class="game-card-header">
        <span class="game-card-title">${card.titulo}</span>
        <span style="font-size: 0.75rem; font-weight: bold; text-transform: uppercase; color: #94a3b8;">${card.criticidade}</span>
      </div>
      <div class="game-card-body">${card.descricao}</div>
      <div class="game-card-options">
        ${card.opcoes.map((opt, idx) => `
          <button class="btn-option" onclick="selecionarOpcaoCard('${card.id}', ${idx}, this)">
            ${opt.texto}
          </button>
        `).join('')}
      </div>
      <div class="game-card-actions">
        <button class="btn-action-exec" onclick="executarAcaoCard('${card.id}')">⚡ Executar Ação</button>
        <button class="btn-action-wait" onclick="aguardarCard('${card.id}')">⏳ Aguardar</button>
        <div class="risk-info">⚠️ Risco: ${card.risco}</div>
      </div>
    `;
    container.appendChild(cardElement);

    const timerInterval = setInterval(() => {
      if (!gameState.emExecucao) {
        clearInterval(timerInterval);
        return;
      }
      card.tempoRestante--;
      const barra = document.getElementById(`timer-bar-${card.id}`);
      if (barra) {
        barra.style.width = `${(card.tempoRestante / 40) * 100}%`;
      }
      if (card.tempoRestante <= 0) {
        clearInterval(timerInterval);
        finalizarCardPorTimeout(card.id);
      }
    }, 1000);
  }

  function selecionarOpcaoCard(cardId, indexOpcao, btnElement) {
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

  function executarAcaoCard(cardId) {
    if (isCurrentTabBlocked() || !gameState.emExecucao) return;
    const cardIndex = gameState.cardsAtivos.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    const card = gameState.cardsAtivos[cardIndex];

    if (card.opcaoSelecionada === null) {
      alert('Selecione uma tomada de decisão antes de executar!');
      return;
    }

    const opcao = card.opcoes[card.opcaoSelecionada];
    if (opcao.correta) {
      gameState.pontuacao += opcao.pontos;
      atualizarPontuacaoUI();
      removerCardTela(cardId);
      publicarEventoGameFirebase({
        type: 'GAME_DECISION_RESULT', resultado: 'acerto', correct: true,
        titulo: card.titulo, eventoId: card.id,
        points: opcao.pontos, decisao: opcao.texto
      });
    } else {
      gameState.pontuacao = Math.max(0, gameState.pontuacao + opcao.penalidade);
      atualizarPontuacaoUI();
      removerCardTela(cardId);
      publicarEventoGameFirebase({
        type: 'GAME_DECISION_RESULT', resultado: 'erro', correct: false,
        titulo: card.titulo, eventoId: card.id,
        points: opcao.penalidade, decisao: opcao.texto
      });
      aplicarBloqueioOperador('Decisão Inadequada tomou rumo crítico na malha!');
    }
    gameState.cardsAtivos.splice(cardIndex, 1);
  }

  function aguardarCard(cardId) {
    removerCardTela(cardId);
    const cardIndex = gameState.cardsAtivos.findIndex(c => c.id === cardId);
    if (cardIndex !== -1) gameState.cardsAtivos.splice(cardIndex, 1);
  }

  function finalizarCardPorTimeout(cardId) {
    const cardIndex = gameState.cardsAtivos.findIndex(c => c.id === cardId);
    if (cardIndex !== -1) {
      const card = gameState.cardsAtivos[cardIndex];
      removerCardTela(cardId);
      gameState.cardsAtivos.splice(cardIndex, 1);
      publicarEventoGameFirebase({
        type: 'GAME_TIMEOUT', resultado: 'timeout', correct: false,
        titulo: card.titulo, eventoId: card.id, points: -50
      });
      aplicarBloqueioOperador('Tempo Esgotado! Falha na tomada de decisão do CCO.');
    }
  }

  function removerCardTela(cardId) {
    const el = document.getElementById(cardId);
    if (el) el.remove();
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
    const ids = ['btn-action-1', 'btn-action-2', 'btn-reset'];
    ids.forEach(id => {
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
    gameState.bloqueiosPorAba[alvo] = {
      deadline: agora + 60000,
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

  function atualizarPontuacaoUI() {
    const scoreEl = document.getElementById('user-score');
    if (scoreEl) scoreEl.innerText = gameState.pontuacao;
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
let firebaseGameStatusListener = null;

async function inicializarSincronizacaoFirebase() {
  if (!window.ccoFirebase || !window.ccoFirebase.ready) return;
  try {
    const cred = await window.ccoFirebase.ready;
    firebaseOperatorKey = cred.user.uid;
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
    console.info('[CCO 4.0] Firebase conectado. UID:', firebaseOperatorKey);
  } catch (error) {
    console.error('[CCO 4.0] Falha ao conectar ao Firebase:', error);
  }
}

async function publicarEventoGameFirebase(evento) {
  if (!firebaseOperatorKey || !window.ccoFirebase || !firebaseGameSessionId || firebaseGamePhase !== 'official') return;
  try {
    const payload = {
      ...evento,
      operador: gameState.operador,
      operadorNome: gameState.operador.split('@')[0],
      operadorUid: firebaseOperatorKey,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    await window.ccoFirebase.db.ref(`game/events/${firebaseGameSessionId}`).push(payload);
  } catch (error) {
    console.error('[CCO 4.0] Erro ao publicar evento oficial:', error);
  }
}

function iniciarGameOficialLocal(sessionId) {
  firebaseGamePhase = 'official';
  firebaseGameSessionId = sessionId || firebaseGameSessionId || String(Date.now());
  gameState.emExecucao = true;
  sincronizarOperadorFirebase();

  // Cards do Game Oficial são gerados no computador de cada operador.
  // O ADM acompanha as ocorrências e decisões via Firebase.
  if (!gameState.intervaloCards) iniciarGeradorDeIncidentes();
  console.info('[CCO 4.0] GAME OFICIAL iniciado. Sessão:', firebaseGameSessionId);
}

function encerrarGameOficialLocal() {
  firebaseGamePhase = 'training';
  firebaseGameSessionId = null;
  gameState.emExecucao = false;
  if (gameState.intervaloCards) clearInterval(gameState.intervaloCards);
  gameState.intervaloCards = null;
  gameState.cardsAtivos = [];
  const container = document.getElementById('game-cards-container');
  if (container) container.innerHTML = '';
  sincronizarOperadorFirebase();
  console.info('[CCO 4.0] GAME OFICIAL encerrado.');
}

function escutarEstadoGameFirebase() {
  if (!window.ccoFirebase || !window.ccoFirebase.db) return;
  if (firebaseGameStatusListener) firebaseGameStatusListener.off();
  firebaseGameStatusListener = window.ccoFirebase.db.ref('game');
  firebaseGameStatusListener.on('value', snapshot => {
    const game = snapshot.val() || {};
    if (game.status === 'official') {
      iniciarGameOficialLocal(game.sessionId || String(game.iniciadoEm || Date.now()));
    } else {
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
