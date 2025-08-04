/**
 * main.ts (browser entry)
 * -------------------------------------------------------------
 * Fetch an ephemeral OpenAI Realtime token from our Express
 * backend, then connect a RealtimeSession.  No UI yet—this is
 * just to prove the round-trip works.
 */
console.log('🔵 main.ts loaded');

import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';   // 1️⃣ SDK helper

async function start() {
  /* ---------------------------------------------------------
   * 2  Ask the local backend for a fresh token
   * ------------------------------------------------------- */
  const resp = await fetch('http://localhost:3000/api/realtime/session', {
    method: 'POST'              // must be POST to match server.ts
  });

  if (!resp.ok) {
    throw new Error(`Token server HTTP ${resp.status}`);
  }

  const { token } = await resp.json();   // resp.json() parses the body
  console.log('Received token:', token.slice(0, 12) + '…');

  /* ---------------------------------------------------------
   * 3  Create an Agent
   * ------------------------------------------------------- */
  const agent = new RealtimeAgent({
  name: 'Assistant',
  instructions: 'You are a helpful assistant. Talk in English.'
});

  /* ---------------------------------------------------------
   * 4  Create a RealtimeSession and connect with the token
   * ------------------------------------------------------- */
  const session = new RealtimeSession(agent, {
    model: 'gpt-4o-realtime-preview-2025-06-03',
    config: {
        inputAudioTranscription: { model: 'gpt-4o-mini-transcribe' }
    }
});
  

let lastMessageId = null;

session.on('history_updated', (history) => {
  const last = history.at(-1);
  if (!last || last.type !== 'message') return;

  const display = document.getElementById('transcription-display');
  if (display) {
    for (const block of last.content) {
      if (block.type === 'input_audio' || block.type === 'audio') {
        const transcriptionText = block.transcript || 'Transcription failed';
        const entry = document.createElement('div');
        entry.textContent = `${last.role === 'user' ? 'You: ' : 'Assistant: '}${transcriptionText}`;
        display.appendChild(entry);
      }
    }
  }
});



  // 4.3 connect  
  await session.connect({ apiKey: token });
  console.log('✅ Realtime session connected → id =');



}


start().catch((err) => {
  console.error('Failed to start realtime session:', err);
});