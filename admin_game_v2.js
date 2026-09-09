/*
 * CCO 4.0 — Central Administrativa do Game
 * ETAPA 19
 *
 * Regra:
 * 1. TREINAMENTO: ADM recebe somente operador + pontuação.
 * 2. GAME OFICIAL: após ADMIN_GAME_STARTED, ADM passa a receber detalhes.
 *
 * Comunicação atual: BroadcastChannel, para desenvolvimento local.
 * Próxima etapa: substituir o transporte por backend/realtime para acesso
 * entre computadores diferentes.
 */

const channel = ('BroadcastChannel' in window) ? new BroadcastChannel('trem_simulation_channel') : { onmessage: null };
let firebaseGameListener = null;
let firebaseEventsListener = null;
let currentSessionId = null;

const adminState = {
  phase: 'training',
  events: 0,
  correct: 0,
  wrong: 0,
  timeouts: 0,
  blocks: 0,
  points: 0,
  operators: new Map(),
  trainingFeed: [],
  officialFeed: [],
  officialActiveEvents: 0,
  officialDecisions: 0,
  rulesPresented: false,
  rulesVisible: false,
  finalResults: [],
  selectedOperatorKey: null,
  challenges: new Map(),
  selectedChallengeId: null,
  challengeClearAt: 0
};

const $ = id => document.getElementById(id);

function fm(valor) {
  try { return Number(valor || 0).toLocaleString('pt-BR'); }
  catch (e) { return String(valor || 0); }
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  }[char]));
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function setPhase(phase) {
  adminState.phase = phase;

  const title = $('phase-title');
  const desc = $('phase-description');
  const badge = $('phase-badge');
  const panel = $('official-game-panel');

  if (phase === 'official') {
    setText('status', 'EM EXECUÇÃO');
    setText('status-detail', 'Game oficial em andamento');
    setText('state-title', 'Game oficial em execução');
    setText('state-text', 'O ADM está recebendo os detalhes da partida em tempo real.');

    if (title) title.textContent = 'GAME OFICIAL';
    if (desc) desc.textContent = 'Monitoramento detalhado liberado para esta partida.';
    if (badge) {
      badge.textContent = 'GAME ATIVO';
      badge.className = 'phase-badge live';
    }
    if (panel) panel.hidden = false;
  } else {
    setText('status', 'TREINAMENTO');
    setText('status-detail', 'Pré-game');
    setText('state-title', 'Sessão de treinamento');
    setText('state-text', 'O ADM acompanha somente operador e pontuação.');

    if (title) title.textContent = 'TREINAMENTO';
    if (desc) desc.textContent = 'O ADM acompanha somente operador e pontuação.';
    if (badge) {
      badge.textContent = 'PRÉ-GAME';
      badge.className = 'phase-badge training';
    }
    if (panel) panel.hidden = true;
  }

  render();
  atualizarControlesRegras();
}

function render() {
  setText('events', adminState.events);
  setText('correct', adminState.correct);
  setText('wrong', adminState.wrong);
  setText('timeouts', adminState.timeouts);
  setText('blocks', adminState.blocks);
  setText('points', adminState.points);
  setText('operators', adminState.operators.size);

  const total = adminState.correct + adminState.wrong;
  const accuracy = total ? Math.round(adminState.correct / total * 100) : 0;
  setText('accuracy', accuracy + '%');

  const bar = $('accuracy-bar');
  if (bar) bar.style.width = accuracy + '%';

  renderRanking();
  renderTrainingFeed();
  if (adminState.selectedOperatorKey && adminState.operators.has(adminState.selectedOperatorKey)) showOperator(adminState.selectedOperatorKey);
  renderOfficialFeed();
  renderFinalResults();
  renderAdminChallenges();
  setText('official-active-events', adminState.officialActiveEvents);
  setText('official-decisions', adminState.officialDecisions);
  setText('official-correct', adminState.correct);
  setText('official-wrong', adminState.wrong);
}

function renderRanking() {
  const body = $('ranking');
  if (!body) return;

  const rows = [...adminState.operators.values()]
    .sort((a,b) => Number(b.points||0) - Number(a.points||0))
    .map(op => {
      const total = Number(op.correct||0) + Number(op.wrong||0);
      const accuracy = total ? Math.round(Number(op.correct||0) / total * 100) : 0;
      const status = op.status === 'online' ? 'ONLINE' : 'OFFLINE';
      return `<tr class="operator-row ${adminState.selectedOperatorKey === op.key ? 'selected' : ''}" data-key="${esc(op.key)}" tabindex="0">
        <td><strong>${esc(op.name)}</strong><br><small>${status}</small></td>
        <td>${esc(op.email)}</td><td>${op.correct||0}</td><td>${op.wrong||0}</td><td>${accuracy}%</td><td><strong>${fm(op.points)}</strong></td>
        <td><button type="button" class="detail-operator-btn" data-detail-key="${esc(op.key)}">Ver detalhes</button></td>
      </tr>`;
    }).join('');

  body.innerHTML = rows || '<tr><td colspan="7" class="empty">Nenhum operador registrado.</td></tr>';

  // Stagger sutil apenas quando o conteúdo da tabela realmente muda.
  const rankKey = [...adminState.operators.values()].map(op => `${op.key}:${op.points}:${op.status}`).join('|');
  if (body._rankKey !== rankKey) {
    body._rankKey = rankKey;
    body.classList.remove('stagger-in');
    void body.offsetWidth;
    body.classList.add('stagger-in');
  }

  body.querySelectorAll('tr[data-key]').forEach(row => {
    const open = () => showOperator(row.dataset.key);
    row.addEventListener('click', e => { if (!e.target.closest('.detail-operator-btn')) open(); });
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  body.querySelectorAll('.detail-operator-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); showOperator(btn.dataset.detailKey); });
  });
}

function renderTrainingFeed() {
  const feed = $('feed');
  if (!feed) return;

  const operators = [...adminState.operators.values()];
  if (!operators.length) {
    feed.innerHTML = '<div class="empty">Nenhum operador conectado.</div>';
    return;
  }

  const selected = adminState.selectedOperatorKey
    ? adminState.operators.get(adminState.selectedOperatorKey)
    : null;

  if (!selected) {
    feed.innerHTML = `<div class="empty">Selecione um operador na lista acima para visualizar as operações realizadas durante as simulações de treinamento.</div>`;
    return;
  }

  const history = Array.isArray(selected.trainingHistory) ? selected.trainingHistory.slice().sort((a,b) => Number(b.timestamp||0) - Number(a.timestamp||0)) : [];
  feed.innerHTML = `
    <div class="training-selected-head">
      <div><strong>Atividade de treinamento</strong><div class="feed-meta">${esc(selected.name)} • ${esc(selected.email)}</div></div>
      <span class="feed-points">${Number(selected.points||0)} pts</span>
    </div>
    ${history.length ? history.slice(0,20).map(item => {
      const type = item.type || '';
      let icon = '🔔';
      let title = item.titulo || 'Operação realizada';
      let detail = item.mensagem || item.decisao || item.origem || 'Simulação de treinamento';
      let points = Number(item.points || 0);
      if (type === 'CCO_DECISION_RESULT') icon = item.correct ? '✅' : '❌';
      else if (type === 'CCO_TIMEOUT') icon = '⏱️';
      else if (type === 'OPERATOR_BLOCKED') icon = '🔒';
      else if (type === 'CCO_SIMULATION_ACTION') icon = item.titulo?.includes('prevenção') ? '🛡️' : '🎯';
      else if (type === 'CCO_EVENT_CREATED') icon = '🔔';
      return `<div class="feed-item training-event-item">
        <span class="feed-icon">${icon}</span>
        <div><div class="feed-title">${esc(title)}</div><div class="feed-meta">${esc(detail)}</div></div>
        <span class="feed-points">${points ? (points > 0 ? '+' : '') + points + ' pts' : ''}</span>
      </div>`;
    }).join('') : '<div class="empty">Nenhuma operação de treinamento registrada para este operador.</div>'}`;
}

function renderOfficialFeed() {
  const feed = $('official-feed');
  if (!feed) return;
  feed.innerHTML = adminState.officialFeed.length
    ? adminState.officialFeed.slice(-20).reverse().map(item => `
      <div class="feed-item">
        <span class="feed-icon">${item.icon || '🔔'}</span>
        <div><div class="feed-title">${esc(item.title || 'Evento')}</div><div class="feed-meta">${esc(item.meta || '')}</div></div>
        <span class="feed-points">${esc(item.points || '')}</span>
      </div>`).join('')
    : '<div class="empty">Aguardando eventos da partida...</div>';
}

function desafioStatusLabel(status) {
  return ({pending:'AGUARDANDO ACEITE', active:'EM ANDAMENTO', finished:'FINALIZADO', rejected:'RECUSADO', cancelled:'CANCELADO'})[status] || String(status || 'DESCONHECIDO').toUpperCase();
}

function renderAdminChallenges() {
  const box = $('challenge-admin-feed');
  if (!box) return;
  const desafios = [...adminState.challenges.entries()]
    .filter(([id,d]) => Number(d?.criadoEm || d?.iniciadoEm || 0) > Number(adminState.challengeClearAt || 0))
    .map(([id,d]) => ({id,d}))
    .sort((a,b) => Number(b.d.criadoEm||b.d.iniciadoEm||0) - Number(a.d.criadoEm||a.d.iniciadoEm||0));
  if (!desafios.length) { box.innerHTML='<div class="empty">Nenhum desafio registrado.</div>'; return; }
  box.innerHTML=desafios.slice(0,30).map(({id,d})=>{
    const a=d.resultados?.[d.desafianteUid]||{}, b=d.resultados?.[d.desafiadoUid]||{};
    const selected=adminState.selectedChallengeId===id;
    const vencedor=d.vencedorUid ? (d.vencedorUid===d.desafianteUid?d.desafianteNome:d.desafiadoNome) : '';
    const detalhe=selected?`<div class="challenge-admin-detail"><strong>${esc(d.desafianteNome||'Operador')}</strong>: ${Number(a.pontos||0)} pts · ${Number(a.acertos||0)} acertos · ${Number(a.erros||0)} erros<br><strong>${esc(d.desafiadoNome||'Operador')}</strong>: ${Number(b.pontos||0)} pts · ${Number(b.acertos||0)} acertos · ${Number(b.erros||0)} erros<br>Repasse configurado: ${Number(d.percentual||0)*100}%${d.status==='finished'?` · Resultado: ${vencedor?esc(vencedor):'Empate'}${d.repasse?` · Repasse: ${Number(d.repasse)} pts`:''}`:''}</div>`:'';
    return `<div class="challenge-admin-item" data-challenge-id="${esc(id)}"><div class="challenge-admin-top"><span class="challenge-admin-names">${esc(d.desafianteNome||'Operador')} ⚔️ ${esc(d.desafiadoNome||'Operador')}</span><span class="challenge-admin-status ${esc(d.status||'')}">${desafioStatusLabel(d.status)}</span></div><div class="challenge-admin-meta"><span>${Number(d.rodadas||10)} ocorrências</span><span>Repasse: ${Number(d.percentual||0)*100}%</span><span class="challenge-admin-score">${fm(a.pontos)} × ${fm(b.pontos)} pts</span></div>${detalhe}</div>`;
  }).join('');
  box.querySelectorAll('[data-challenge-id]').forEach(el=>el.addEventListener('click',()=>{const id=el.dataset.challengeId;adminState.selectedChallengeId=adminState.selectedChallengeId===id?null:id;renderAdminChallenges();}));
}

function ouvirDesafiosADM() {
  if (!window.ccoFirebase?.db) return;

  // O botão "Limpar participantes e pontuações" não apaga o histórico
  // dos desafios no Firebase. Ele apenas cria um marco de limpeza para que
  // a Central ADM mostre somente os desafios iniciados depois desse marco.
  window.ccoFirebase.db.ref('game/desafiosLimparEm').on('value', snapshot => {
    adminState.challengeClearAt = Number(snapshot.val() || 0);
    adminState.selectedChallengeId = null;
    renderAdminChallenges();
  }, error => console.error('[CCO ADM] Erro ao ouvir marco de limpeza dos desafios:', error));

  window.ccoFirebase.db.ref('game/desafios').on('value', snapshot=>{
    const data=snapshot.val()||{}, next=new Map();
    Object.entries(data).forEach(([id,d])=>{if(d) next.set(id,d);});
    adminState.challenges=next; renderAdminChallenges();
  }, error=>{console.error('[CCO ADM] Erro ao ouvir /game/desafios:',error);const box=$('challenge-admin-feed');if(box)box.innerHTML='<div class="empty">Não foi possível carregar os desafios. Verifique as regras do Firebase.</div>';});
}

function showOperator(key) {
  const op = adminState.operators.get(key);
  adminState.selectedOperatorKey = key;
  if (!op) return;

  const total = op.correct + op.wrong;
  const accuracy = total ? Math.round(op.correct / total * 100) : 0;

  const history = Array.isArray(op.trainingHistory) ? op.trainingHistory.slice().sort((a,b) => Number(b.timestamp||0) - Number(a.timestamp||0)).slice(0,12) : [];
  $('detail').innerHTML = `
    <div class="avatar">◉</div>
    <strong>${esc(op.name)}</strong>
    <p>${esc(op.email)}<br><br>
    Status: <strong>${op.status === 'online' ? 'ONLINE' : 'OFFLINE'}</strong><br>
    Pontuação total: <strong>${Number(op.points || 0)} pts</strong><br>
    Acertos registrados: ${Number(op.correct || 0)}<br>
    Erros registrados: ${Number(op.wrong || 0)}<br>
    Precisão: ${accuracy}%</p>
    <div class="operator-history"><strong>Operações nas simulações de treinamento</strong>
      ${history.length ? history.map(h => {
        const icon = h.type === 'CCO_DECISION_RESULT' ? (h.correct ? '✅' : '❌') : h.type === 'CCO_TIMEOUT' ? '⏱️' : h.type === 'OPERATOR_BLOCKED' ? '🔒' : '🔔';
        const title = h.titulo || 'Operação realizada';
        const detail = h.decisao || h.mensagem || h.origem || 'Simulação de treinamento';
        const pts = Number(h.points || 0);
        return `<div class="history-item"><span>${icon}</span><div><b>${esc(title)}</b><small>${esc(detail)}</small></div><em>${pts ? (pts > 0 ? '+' : '') + pts + ' pts' : ''}</em></div>`;
      }).join('') : '<small>Nenhuma operação de treinamento registrada para este operador.</small>'}
    </div>`;
}

function registerTrainingScore(data) {
  const op = data.operator || data.operador || {};
  const name = op.name || op.nome || data.nome || data.operadorNome || 'Operador';
  const email = op.email || data.email || data.operadorEmail || '—';
  const key = email !== '—' ? email : name;

  const current = adminState.operators.get(key) || {
    key, name, email, correct: 0, wrong: 0, points: 0
  };

  const points = Number(data.points ?? data.pontos ?? 0);

  // O treinamento só altera ranking/pontuação.
  current.points += points;

  if (data.correct === true || data.resultado === 'acerto') {
    current.correct++;
  } else if (
    data.correct === false ||
    data.resultado === 'erro' ||
    data.resultado === 'timeout'
  ) {
    current.wrong++;
  }

  adminState.operators.set(key, current);
  adminState.points += points;

  render();
}

function registerOfficialDecision(data) {
  adminState.officialDecisions++;

  if (data.correct === true || data.resultado === 'acerto') {
    adminState.correct++;
  } else {
    adminState.wrong++;
  }

  const points = Number(data.points ?? data.pontos ?? data.penalidade ?? 0);
  adminState.points += points;

  adminState.officialFeed.push({
    icon: data.correct === true || data.resultado === 'acerto' ? '✅' : '❌',
    title: data.titulo || data.title || 'Decisão operacional',
    meta: data.operador || data.operator?.name || data.email || 'Operador',
    points: points ? `${points > 0 ? '+' : ''}${points} pts` : ''
  });

  // Também atualiza o ranking do operador.
  registerTrainingScore(data);
  render();
}

function handleEvent(data) {
  const type = data.type || data.action;

  // Troca de fase.
  if (type === 'ADMIN_GAME_STARTED' || type === 'GAME_STARTED') {
    setPhase('official');
    return;
  }

  if (type === 'ADMIN_GAME_STOPPED' || type === 'GAME_STOPPED') {
    setPhase('training');
    adminState.officialFeed = [];
    adminState.officialActiveEvents = 0;
    adminState.officialDecisions = 0;
    render();
    return;
  }

  // Resultado simples vindo do treinamento: guardar apenas pontuação/operador.
  if (
    type === 'TRAINING_SCORE' ||
    type === 'GAME_DECISION_RESULT' ||
    type === 'CCO_DECISION_RESULT'
  ) {
    if (adminState.phase === 'official') {
      registerOfficialDecision(data);
    } else {
      registerTrainingScore(data);
    }
    return;
  }

  // Ocorrências detalhadas só são aceitas durante o GAME oficial.
  if (
    type === 'CCO_EVENT_CREATED' ||
    type === 'GAME_EVENT_CREATED' ||
    type === 'TRIGGER_VIBRATION' ||
    type === 'TRIGGER_TEMP'
  ) {
    if (adminState.phase !== 'official') return;

    adminState.events++;
    adminState.officialActiveEvents++;

    adminState.officialFeed.push({
      icon: type.includes('TEMP') ? '🌡️' :
            type.includes('VIBRATION') ? '📳' : '🔔',
      title: data.titulo || data.title || 'Nova ocorrência',
      meta: `${data.origem || data.source || 'Treinamento'}${data.criticidade ? ' • ' + data.criticidade : ''}`,
      points: ''
    });

    render();
    return;
  }

  if (type === 'GAME_TIMEOUT' || type === 'CCO_TIMEOUT') {
    if (adminState.phase !== 'official') return;

    adminState.timeouts++;
    adminState.officialFeed.push({
      icon: '⏱️',
      title: 'Tempo esgotado',
      meta: data.operador || data.operator?.name || 'Operador',
      points: data.points ? `${data.points} pts` : ''
    });
    render();
    return;
  }

  if (type === 'OPERATOR_BLOCKED' || type === 'CCO_OPERATOR_BLOCKED') {
    if (adminState.phase !== 'official') return;

    adminState.blocks++;
    adminState.officialFeed.push({
      icon: '🔒',
      title: 'Operador bloqueado',
      meta: data.reason || 'Penalidade operacional',
      points: data.points ? `${data.points} pts` : ''
    });
    render();
  }
}

channel.onmessage = event => handleEvent(event.data || {});

setPhase('training');


/* ==========================================================================
   FIREBASE — ETAPA 18
   No treinamento, o ADM recebe apenas operador + pontuação.
   ========================================================================== */
async function conectarFirebaseADM() {
  if (!window.ccoFirebase || !window.ccoFirebase.ready) {
    console.error('[CCO ADM] Firebase não foi inicializado.');
    return;
  }
  try {
    // A ADM também precisa estar autenticada antes de ler /operadores.
    // O login é anônimo nesta etapa apenas para o teste de realtime.
    const credential = await window.ccoFirebase.ready;
    console.info('[CCO ADM] Autenticação Firebase concluída. UID:', credential.user?.uid || window.ccoFirebase.auth.currentUser?.uid);

    firebaseGameListener = window.ccoFirebase.db.ref('operadores');
    firebaseGameListener.on('value', snapshot => {
      const data = snapshot.val() || {};
      const next = new Map();

      // Dedupe por e-mail para não exibir registros antigos criados pela
      // versão que usava o Firebase Auth UID como chave.
      const porEmail = new Map();
      Object.entries(data).forEach(([key, item]) => {
        if (!item || !item.email) return;
        const email = String(item.email).trim().toLowerCase();
        const atualizado = Number(item.updatedAt || 0);
        const anterior = porEmail.get(email);
        if (anterior && Number(anterior.updatedAt || 0) >= atualizado) return;
        porEmail.set(email, { key, item, atualizado });
      });

      porEmail.forEach(({key, item}) => {
        const previous = adminState.operators.get(key) || {};
        next.set(key, {
          key,
          name: item.nome || item.email.split('@')[0],
          email: item.email,
          correct: Number(previous.correct || 0),
          wrong: Number(previous.wrong || 0),
          history: Array.isArray(previous.history) ? previous.history : [],
          trainingHistory: Array.isArray(item.historicoTreinamento) ? item.historicoTreinamento : [],
          points: Number(item.pontos || 0),
          status: item.status || 'offline',
          updatedAt: item.updatedAt || 0
        });
      });

      adminState.operators = next;
      adminState.points = [...next.values()].reduce((sum, op) => sum + Number(op.points || 0), 0);
      render();
      console.info('[CCO ADM] Operadores recebidos do Firebase:', next.size);
    }, error => {
      console.error('[CCO ADM] Erro ao ouvir /operadores:', error);
    });

    await carregarResultadoAtualPersistido();
    console.info('[CCO ADM] Firebase conectado e ouvindo /operadores.');
  } catch (error) {
    console.error('[CCO ADM] Falha ao conectar ao Firebase:', error);
  }
}


function renderFinalResults() {
  const panel = $('final-result-panel'), body = $('final-results');
  if (!panel || !body) return;
  if (!adminState.finalResults.length) { panel.hidden = true; return; }
  panel.hidden = false;
  body.innerHTML = [...adminState.finalResults].sort((a,b)=>Number(b.points||0)-Number(a.points||0))
    .map(op => `<tr><td><strong>${esc(op.name)}</strong></td><td>${esc(op.email)}</td><td><strong>${Number(op.points||0)} pts</strong></td></tr>`).join('');
}

// Estado oficial e eventos agora trafegam pelo Firebase entre computadores.
async function publicarEstadoGame(status) {
  await window.ccoFirebase.ready;
  const ref = window.ccoFirebase.db.ref('game');
  if (status === 'official') {
    if (!adminState.rulesPresented) {
      throw new Error('As regras precisam ser apresentadas antes do Game Oficial.');
    }
    const sessionId = 'sess-' + Date.now();
    currentSessionId = sessionId;
    await window.ccoFirebase.db.ref('game/events').remove();
    await ref.set({
      status: 'official',
      sessionId,
      rulesPresented: true,
      rulesVisible: false,
      iniciadoEm: firebase.database.ServerValue.TIMESTAMP
    });
    return sessionId;
  }
  await ref.set({
    status: 'training',
    sessionId: null,
    rulesPresented: adminState.rulesPresented === true,
    rulesVisible: false,
    encerradoEm: firebase.database.ServerValue.TIMESTAMP
  });
}

async function apresentarRegrasADM() {
  await window.ccoFirebase.ready;
  adminState.rulesPresented = true;
  adminState.rulesVisible = !adminState.rulesVisible;
  await window.ccoFirebase.db.ref('game').update({
    status: 'training',
    sessionId: null,
    rulesPresented: true,
    rulesVisible: adminState.rulesVisible,
    rulesPresentedAt: firebase.database.ServerValue.TIMESTAMP
  });
  atualizarControlesRegras();
  console.info('[CCO ADM] Regras ' + (adminState.rulesVisible ? 'apresentadas.' : 'encerradas.'));
}

function atualizarControlesRegras() {
  const btn = $('show-rules');
  const start = $('start');
  const status = $('rules-status');
  if (btn) {
    btn.textContent = adminState.rulesVisible ? '✕ Encerrar apresentação das regras' : (adminState.rulesPresented ? '📋 Apresentar regras novamente' : '📋 Apresentar regras aos operadores');
    btn.classList.toggle('active', adminState.rulesVisible);
  }
  if (start) start.disabled = !adminState.rulesPresented || adminState.rulesVisible || adminState.phase === 'official';
  if (status) {
    if (adminState.rulesVisible) status.textContent = 'Regras visíveis para todos os operadores. Aguarde a leitura e clique novamente para encerrar a apresentação.';
    else if (adminState.rulesPresented) status.textContent = 'Regras já apresentadas. O Game Oficial está liberado para início.';
    else status.textContent = 'As regras ainda não foram apresentadas. O Game Oficial será liberado somente depois da apresentação.';
  }
}

function ouvirEstadoGameADM() {
  const ref = window.ccoFirebase.db.ref('game');
  ref.on('value', snapshot => {
    const game = snapshot.val() || {};
    adminState.rulesPresented = game.rulesPresented === true;
    adminState.rulesVisible = game.rulesVisible === true;
    atualizarControlesRegras();
    if (game.status === 'official') {
      currentSessionId = game.sessionId || currentSessionId;
      setPhase('official');
      ouvirEventosOficiais(currentSessionId);
    } else {
      if (adminState.phase !== 'training') setPhase('training');
      if (firebaseEventsListener) { firebaseEventsListener.off(); firebaseEventsListener = null; }
    }
  }, error => console.error('[CCO ADM] Erro ao ouvir /game:', error));
}

function ouvirEventosOficiais(sessionId) {
  if (!sessionId) return;
  if (firebaseEventsListener) firebaseEventsListener.off();
  firebaseEventsListener = window.ccoFirebase.db.ref(`game/events/${sessionId}`);
  firebaseEventsListener.on('value', snapshot => {
    const data = snapshot.val() || {};
    adminState.events = 0;
    adminState.correct = 0;
    adminState.wrong = 0;
    adminState.timeouts = 0;
    adminState.blocks = 0;
    adminState.officialActiveEvents = 0;
    adminState.officialDecisions = 0;
    adminState.officialFeed = [];
    adminState.operators.forEach(op => { op.correct = 0; op.wrong = 0; op.history = []; });

    Object.values(data).sort((a,b) => Number(a.timestamp||0)-Number(b.timestamp||0)).forEach(item => {
      const type = item.type;
      const operator = item.operadorNome || item.operador || item.operadorEmail || 'Operador';
      const operatorEmail = item.operadorEmail || item.email || item.operator?.email || '';
      const operatorKey = operatorEmail || operator;
      let op = [...adminState.operators.values()].find(x => x.email === operatorEmail || x.key === operatorKey);
      if (!op && operatorEmail) {
        op = { key: operatorEmail, name: item.operadorNome || operatorEmail.split('@')[0], email: operatorEmail, correct: 0, wrong: 0, points: 0, status: 'offline' };
        adminState.operators.set(op.key, op);
      }
      if (type === 'GAME_EVENT_CREATED' || type === 'CCO_EVENT_CREATED') {
        adminState.events++;
        adminState.officialActiveEvents++;
        const feedItem = { icon:'🔔', title:item.titulo || 'Nova ocorrência', meta:`${operator} • ${item.criticidade || item.origem || 'Game Oficial'}`, points:'' };
        adminState.officialFeed.push(feedItem);
        if (op) op.history.push({icon:'🔔', title:item.titulo || 'Nova ocorrência', detail:`${item.criticidade || 'Evento'} • ocorrência recebida`, points:''});
      } else if (type === 'GAME_DECISION_RESULT' || type === 'CCO_DECISION_RESULT') {
        adminState.officialDecisions++;
        const isCorrect = item.correct === true || item.resultado === 'acerto';
        if (isCorrect) adminState.correct++; else adminState.wrong++;
        if (op) {
          if (isCorrect) op.correct++; else op.wrong++;
        }
        const pts = Number(item.points || 0);
        // Pontuação oficial é a fonte do Firebase /operadores; não somamos o evento novamente.
        adminState.officialFeed.push({ icon:isCorrect ? '✅' : '❌', title:item.titulo || 'Decisão operacional', meta:`${operator}${item.decisao ? ' • ' + item.decisao : ''}`, points: pts ? `${pts > 0 ? '+' : ''}${pts} pts` : '' });
        if (op) op.history.push({icon:isCorrect ? '✅' : '❌', title:item.titulo || 'Decisão operacional', detail:item.decisao || (isCorrect ? 'Decisão correta' : 'Decisão inadequada'), points:pts ? `${pts > 0 ? '+' : ''}${pts} pts` : ''});
      } else if (type === 'GAME_WAIT_ACTION') {
        adminState.officialFeed.push({ icon:'⏳', title:'Ocorrência adiada', meta:`${operator} • ${item.titulo || 'Ocorrência'}`, points:'' });
        if (op) op.history.push({icon:'⏳', title:'Ocorrência adiada', detail:item.titulo || 'Ocorrência', points:''});
      } else if (type === 'GAME_WAIT_RETURNED') {
        adminState.officialFeed.push({ icon:'↩️', title:'Ocorrência aguardada retornou', meta:operator, points:'' });
        if (op) op.history.push({icon:'↩️', title:'Ocorrência aguardada retornou', detail:'Retorno para nova decisão', points:''});
      } else if (type === 'GAME_PRIORITY_RESULT') {
        const pts = Number(item.points || 0);
        adminState.officialFeed.push({ icon:'⚠️', title:'Prioridade inadequada', meta:operator, points:pts ? `${pts} pts` : '' });
        if (op) op.history.push({icon:'⚠️', title:'Prioridade inadequada', detail:'Penalidade por priorização', points:pts ? `${pts} pts` : ''});
      } else if (type === 'GAME_TIMEOUT' || type === 'CCO_TIMEOUT') {
        adminState.timeouts++;
        adminState.officialFeed.push({ icon:'⏱️', title:'Tempo esgotado', meta:operator, points:Number(item.points || 0) ? `${item.points} pts` : '' });
        if (op) op.history.push({icon:'⏱️', title:'Tempo esgotado', detail:'A ocorrência expirou', points:Number(item.points || 0) ? `${item.points} pts` : ''});
      } else if (type === 'OPERATOR_BLOCKED' || type === 'CCO_OPERATOR_BLOCKED') {
        adminState.blocks++;
        adminState.officialFeed.push({ icon:'🔒', title:'Operador bloqueado', meta:`${operator} • ${item.motivo || item.reason || 'Penalidade operacional'}`, points:'' });
        if (op) op.history.push({icon:'🔒', title:'Operador bloqueado', detail:item.motivo || item.reason || 'Penalidade operacional', points:''});
      }
    });
    render();
  }, error => console.error('[CCO ADM] Erro ao ouvir eventos oficiais:', error));
}

$('start').onclick = async () => {
  if (!adminState.rulesPresented || adminState.rulesVisible) {
    alert('Apresente as regras aos operadores e encerre a apresentação antes de iniciar o Game Oficial.');
    return;
  }
  try {
    const sessionId = await publicarEstadoGame('official');
    currentSessionId = sessionId;
    adminState.events = 0; adminState.correct = 0; adminState.wrong = 0; adminState.timeouts = 0; adminState.blocks = 0; adminState.officialFeed = [];
    setPhase('official');
    atualizarControlesRegras();
    console.info('[CCO ADM] GAME OFICIAL iniciado:', sessionId);
  } catch (e) {
    console.error('[CCO ADM] Não foi possível iniciar o Game:', e);
    alert(e.message || 'Não foi possível iniciar o Game Oficial. Verifique o Firebase.');
  }
};

$('show-rules').onclick = async () => {
  try { await apresentarRegrasADM(); }
  catch (e) { console.error('[CCO ADM] Não foi possível atualizar as regras:', e); alert('Não foi possível apresentar as regras. Verifique o Firebase.'); }
};

$('stop').onclick = async () => {
  try {
    const finalResults = [...adminState.operators.values()]
      .map(op => ({name: op.name, email: op.email, points: Number(op.points || 0)}))
      .sort((a,b) => b.points - a.points);
    adminState.finalResults = finalResults;
    renderFinalResults();

    await window.ccoFirebase.ready;
    const sessionId = currentSessionId || ('sess-' + Date.now());

    await window.ccoFirebase.db.ref(`game/resultados/${sessionId}`).set({
      encerradoEm: firebase.database.ServerValue.TIMESTAMP,
      participantes: finalResults
    });
    await window.ccoFirebase.db.ref('game/ultimoResultado').set({
      sessionId,
      encerradoEm: firebase.database.ServerValue.TIMESTAMP,
      participantes: finalResults
    });
    await window.ccoFirebase.db.ref('game').update({
      status: 'training', sessionId: null, rulesPresented: false, rulesVisible: false,
      ultimoResultadoSessionId: sessionId,
      encerradoEm: firebase.database.ServerValue.TIMESTAMP
    });

    adminState.rulesPresented = false;
    adminState.rulesVisible = false;
    setPhase('training');
    atualizarControlesRegras();
    console.info('[CCO ADM] GAME encerrado. Resultado preservado.');
  } catch (e) {
    console.error('[CCO ADM] Nao foi possivel encerrar o Game:', e);
    alert('Nao foi possivel encerrar o Game Oficial. Verifique o Firebase.');
  }
};

async function novoGameADM() {
  if (!confirm('ZERAR TODAS AS INFORMAÇÕES e iniciar um NOVO GAME?\n\nIsso apaga do Firebase: operadores, pontuações, histórico de treinamento, eventos do Game Oficial, resultados e desafios.\n\nOperadores e ADM voltam ao estado inicial. Esta ação não pode ser desfeita.')) return;
  try {
    await window.ccoFirebase.ready;
    const agora = Date.now();
    // Substitui o nó /game por completo (events, resultados, ultimoResultado, desafios e flags) e
    // grava os marcadores de limpeza para os operadores zerarem suas telas.
    await window.ccoFirebase.db.ref('game').set({
      status: 'training',
      sessionId: null,
      rulesPresented: false,
      rulesVisible: false,
      clearRequestedAt: firebase.database.ServerValue.TIMESTAMP,
      desafiosLimparEm: agora,
      resetEm: firebase.database.ServerValue.TIMESTAMP
    });
    // Remove os operadores persistidos; cada um se registra novamente ao sincronizar.
    await window.ccoFirebase.db.ref('operadores').remove();

    currentSessionId = null;
    adminState.phase = 'training';
    adminState.events = adminState.correct = adminState.wrong = adminState.timeouts = adminState.blocks = adminState.points = 0;
    adminState.operators.clear();
    adminState.trainingFeed = [];
    adminState.officialFeed = [];
    adminState.officialActiveEvents = 0;
    adminState.officialDecisions = 0;
    adminState.rulesPresented = false;
    adminState.rulesVisible = false;
    adminState.finalResults = [];
    adminState.selectedOperatorKey = null;
    adminState.challenges.clear();
    adminState.selectedChallengeId = null;
    adminState.challengeClearAt = agora;
    setPhase('training');
    atualizarControlesRegras();
    render();
    alert('NOVO GAME preparado! Todas as informações foram limpas. Os operadores devem refazer o login para reiniciar a partida.');
  } catch (e) {
    console.error('[CCO ADM] Erro ao zerar o Game:', e);
    alert('Não foi possível zerar o Game. Verifique o Firebase.');
  }
}

/* eslint-disable-next-line no-unused-vars */
async function carregarResultadoAtualPersistido() {
  try {
    const snap = await window.ccoFirebase.db.ref('game/ultimoResultado').once('value');
    const data = snap.val() || {};
    if (Array.isArray(data.participantes)) {
      adminState.finalResults = data.participantes;
      renderFinalResults();
    }
  } catch (e) { console.warn('[CCO ADM] Resultado persistido indisponivel:', e); }
}

document.addEventListener('DOMContentLoaded', () => {
  atualizarControlesRegras();
  const newGameBtn = $('new-game');
  if (newGameBtn) newGameBtn.onclick = () => novoGameADM();
  const clearBtn = $('clear-match');
  if (clearBtn) clearBtn.onclick = async () => {
    if (!confirm('Limpar participantes e pontuacoes para preparar uma nova partida? O historico continuara salvo no Firebase.')) return;
    try {
      await window.ccoFirebase.ready;
      const agora = Date.now();
      await window.ccoFirebase.db.ref('game/clearRequestedAt').set(firebase.database.ServerValue.TIMESTAMP);
      await window.ccoFirebase.db.ref('game/desafiosLimparEm').set(agora);
      adminState.challengeClearAt = agora;
      adminState.challenges.clear();
      adminState.selectedChallengeId = null;
      adminState.finalResults=[]; adminState.operators.clear(); adminState.points=adminState.events=adminState.correct=adminState.wrong=adminState.timeouts=adminState.blocks=0; render();
      alert('Limpeza enviada. Participantes, pontuações e desafios exibidos na Central foram zerados para a nova partida. O histórico antigo continua salvo no Firebase.');
    } catch(e){console.error('[CCO ADM] Erro ao solicitar limpeza:',e);alert('Nao foi possivel preparar a nova partida. Verifique o Firebase.');}
  };
  conectarFirebaseADM();
  window.ccoAdminFirebaseReady=window.ccoFirebase?.ready||null;
  window.ccoFirebase?.ready?.then(()=>{ouvirEstadoGameADM();ouvirDesafiosADM();}).catch(e=>console.error('[CCO ADM] Firebase indisponível:',e));
});
