// CCO 4.0 — Configuração do Firebase
// ETAPA 18 — primeiro teste de sincronização multi-computador.
// Estas informações do Firebase Web podem ficar no frontend; a proteção real
// será feita pelas Realtime Database Rules e pela autenticação.

const firebaseConfig = {
  apiKey: "AIzaSyDfxthtPcGZ9KFlr8YwVFrlC3XD0D1Bu8g",
  authDomain: "cco-40.firebaseapp.com",
  databaseURL: "https://cco-40-default-rtdb.firebaseio.com",
  projectId: "cco-40",
  storageBucket: "cco-40.firebasestorage.app",
  messagingSenderId: "806270859702",
  appId: "1:806270859702:web:56e505173244d23e1f6917"
};

firebase.initializeApp(firebaseConfig);

window.ccoFirebase = {
  auth: firebase.auth(),
  db: firebase.database(),
  ready: null
};

// Login anônimo só para o primeiro teste. Depois vamos trocar por uma
// autenticação adequada para diferenciar operador e ADM com regras seguras.
window.ccoFirebase.ready = window.ccoFirebase.auth.signInAnonymously();
