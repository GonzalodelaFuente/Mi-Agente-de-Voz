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
  instructions: 'You are a helpful assistant.'
});

  /* ---------------------------------------------------------
   * 4  Create a RealtimeSession and connect with the token
   * ------------------------------------------------------- */
  const session = new RealtimeSession(agent, {
  model: 'gpt-4o-realtime-preview-2025-06-03'
  }
  ); // empty constructor
  
  // 4.1  print each transcription chunk as soon as it arrives
  session.on('history_updated', (history) => {
  // prove the handler runs
  console.log('📡 history update (#items =', history.length, ')');

  // dump the newest element in a readable way
  const last = history.at(-1);
  console.dir(last, { depth: null });
});



  // 4.3 connect  
  await session.connect({ apiKey: token });
  console.log('✅ Realtime session connected → id =');

  session.on('history_updated', (history) => {
  // returns the full history of the session
  console.log(history)})

}


start().catch((err) => {
  console.error('Failed to start realtime session:', err);
});