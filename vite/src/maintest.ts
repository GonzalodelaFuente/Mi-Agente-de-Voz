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
   * 2 Ask the local backend for a fresh token
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
   * 3 Create an Agent
   * ------------------------------------------------------- */
  const agent = new RealtimeAgent({
    name: 'Assistant',
    instructions: 'You are a helpful assistant. Talk in English.'
  });

  /* --------------------------------------------------------- 
   * 4 Create a RealtimeSession and connect with the token
   * ------------------------------------------------------- */
  const session = new RealtimeSession(agent, {
    model: 'gpt-4o-realtime-preview-2025-06-03',
    config: {
      inputAudioTranscription: { model: 'gpt-4o-mini-transcribe' }
    }
  });

  let lastMessageId = null; // Track the last processed message ID to avoid duplication
  const sessionId = Date.now().toString(); // Simple session ID based on timestamp

  // Add an event listener to react when the conversation history updates
  session.on('history_updated', async (history) => {
    const last = history.at(-1);
    if (!last || last.type !== 'message') return;

    const display = document.getElementById('transcription-display');
    if (display) {
      for (const block of last.content) {
        if (block.type === 'input_audio' || block.type === 'audio') {
          display.innerHTML += `<div>${last.role === 'user' ? 'You: ' : 'Assistant: '}${block.transcript}</div>`;
        }
      }
      lastMessageId = last.itemId;
    }

    // Save each message to the convo saver
    const message = {
      role: last.role,
      message: last.content
        .filter(block => (block.type === 'input_audio' || block.type === 'audio') && block.transcript)
        .map(block => block.transcript)
        .join(' ')
    };
    try {
      const response = await fetch('http://localhost:4000/save-convo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message })
      });
      if (!response.ok) {
        console.error('Failed to save message');
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // 4.3 connect  
  await session.connect({ apiKey: token });
  console.log('✅ Realtime session connected → id =', session.id);
}

start().catch((err) => {
  console.error('Failed to start realtime session:', err);
});