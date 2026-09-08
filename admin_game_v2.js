/*
 * CCO 4.0 — Central Administrativa do Game
 * ETAPA 17
 *
 * Regra:
 * 1. TREINAMENTO: ADM recebe somente operador + pontuação.
 * 2. GAME OFICIAL: após ADMIN_GAME_STARTED, ADM passa a receber detalhes.
 *
 * Comunicação atual: BroadcastChannel, para desenvolvimento local.
 * Próxima etapa: substituir o transporte por backend/realtime para acesso
 * entre computadores diferentes.
 */

const channel = new BroadcastChannel('trem_simulation_channel');
let firebaseGameListener = null;

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
  officialDecisions: 0
};

const $ = id => document.getElementById(id);

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
  renderOfficialFeed();
  setText('official-active-events', adminState.officialActiveEvents);
  setText('official-decisions', adminState.officialDecisions);
  setText('official-correct', adminState.correct);
  setText('official-wrong', adminState.wrong);
}

function renderRanking() {
  const body = $('ranking');
  if (!body) return;

  const rows = [...adminState.operators.values()]
    .sort((a, b) => b.points - a.points)
    .map((op, i) => {
      const total = op.correct + op.wrong;
      const accuracy = total ? Math.round(op.correct / total * 100) : 0;
      return `<tr data-key="${esc(op.key)}">
        <td>${i + 1}º</td>
        <td><strong>${esc(op.name)}</strong></td>
        <td>${esc(op.email)}</td>
        <td>${op.correct}</td>
        <td>${op.wrong}</td>
        <td>${accuracy}%</td>
        <td><strong>${op.points}</strong></td>
      </tr>`;
    }).join('');

  body.innerHTML = rows ||
    '<tr><td colspan="7" class="empty">Nenhum operador registrado.</td></tr>';

  [...body.querySelectorAll('tr[data-key]')].forEach(row => {
    row.onclick = () => showOperator(row.dataset.key);
  });
}

function renderTrainingFeed() {
  const feed = $('feed');
  if (!feed) return;

  // No detailed training history is displayed.
  feed.innerHTML =
    '<div class="empty">Durante o treinamento, o ADM visualiza somente operador e pontuação no ranking.</div>';
}

function renderOfficialFeed() {
  const feed = $('official-feed');
  if (!feed) return;

  feed.innerHTML = adminState.officialFeed.length
    ? adminState.officialFeed.slice(-10).reverse().map(item => `
      <div class="feed-item">
        <span class="feed-icon">${item.icon}</span>
        <div>
          <div class="feed-title">${esc(item.title)}</div>
          <div class="feed-meta">${esc(item.meta)}</div>
        </div>
        <span class="feed-points">${esc(item.points || '')}</span>
      </div>
    `).join('')
    : '<div class="empty">Aguardando eventos da partida...</div>';
}

function showOperator(key) {
  const op = adminState.operators.get(key);
  if (!op) return;

  const total = op.correct + op.wrong;
  const accuracy = total ? Math.round(op.correct / total * 100) : 0;

  $('detail').innerHTML = `
    <div class="avatar">◉</div>
    <strong>${esc(op.name)}</strong>
    <p>${esc(op.email)}<br><br>
    Pontuação: ${op.points}<br>
    Acertos registrados: ${op.correct}<br>
    Erros registrados: ${op.wrong}<br>
    Precisão: ${accuracy}%</p>
  `;
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
  if (!window.ccoFirebase || !window.ccoFirebase.ready) return;
  try {
    await window.ccoFirebase.ready;

    firebaseGameListener = window.ccoFirebase.db.ref('operadores');
    firebaseGameListener.on('value', snapshot => {
      const data = snapshot.val() || {};
      const next = new Map();

      Object.entries(data).forEach(([key, item]) => {
        if (!item || !item.email) return;
        next.set(key, {
          key,
          name: item.nome || item.email.split('@')[0],
          email: item.email,
          correct: 0,
          wrong: 0,
          points: Number(item.pontos || 0),
          status: item.status || 'offline',
          updatedAt: item.updatedAt || 0
        });
      });

      adminState.operators = next;
      adminState.points = [...next.values()].reduce((sum, op) => sum + Number(op.points || 0), 0);
      render();
    });

    console.info('[CCO ADM] Firebase conectado.');
  } catch (error) {
    console.error('[CCO ADM] Falha ao conectar ao Firebase:', error);
  }
}

const originalRenderRanking = renderRanking;
renderRanking = function() {
  const body = $('ranking');
  if (!body) return;

  const rows = [...adminState.operators.values()]
    .sort((a, b) => b.points - a.points)
    .map((op, i) => {
      const total = op.correct + op.wrong;
      const accuracy = total ? Math.round(op.correct / total * 100) : 0;
      const status = op.status === 'online' ? '🟢 ONLINE' : '⚪ OFFLINE';
      return `<tr data-key="${esc(op.key)}">
        <td>${i + 1}º</td>
        <td><strong>${esc(op.name)}</strong><br><small>${status}</small></td>
        <td>${esc(op.email)}</td>
        <td>${op.correct}</td>
        <td>${op.wrong}</td>
        <td>${accuracy}%</td>
        <td><strong>${op.points}</strong></td>
      </tr>`;
    }).join('');

  body.innerHTML = rows ||
    '<tr><td colspan="7" class="empty">Nenhum operador registrado.</td></tr>';

  [...body.querySelectorAll('tr[data-key]')].forEach(row => {
    row.onclick = () => showOperator(row.dataset.key);
  });
};

// O estado oficial também passa a ser publicado no Firebase. Nesta etapa isso
// serve como base; na próxima, os operadores ouvirão este estado para iniciar
// o Game Oficial em computadores diferentes.
const originalStartHandler = $('start').onclick;
$('start').onclick = async () => {
  if (window.ccoFirebase && window.ccoFirebase.ready) {
    try {
      await window.ccoFirebase.ready;
      await window.ccoFirebase.db.ref('game').set({
        status: 'official',
        iniciadoEm: firebase.database.ServerValue.TIMESTAMP
      });
    } catch (e) {
      console.error('[CCO ADM] Não foi possível publicar o início do Game:', e);
    }
  }
  channel.postMessage({ type: 'ADMIN_GAME_STARTED' });
  setPhase('official');
};

$('stop').onclick = async () => {
  if (window.ccoFirebase && window.ccoFirebase.ready) {
    try {
      await window.ccoFirebase.ready;
      await window.ccoFirebase.db.ref('game').set({
        status: 'training',
        encerradoEm: firebase.database.ServerValue.TIMESTAMP
      });
    } catch (e) {
      console.error('[CCO ADM] Não foi possível publicar o encerramento do Game:', e);
    }
  }
  channel.postMessage({ type: 'ADMIN_GAME_STOPPED' });
  setPhase('training');
};

conectarFirebaseADM();
