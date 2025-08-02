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
  

let lastMessageId = null; // Track the last processed message ID to avoid duplication

  // Add an event listener to react when the conversation history updates
session.on('history_updated', (history) => {
    // Get the most recent item from the history array using the last element method
    const last = history.at(-1);
    // Check if the last item exists and is of type 'message' to avoid errors
    if (!last || last.type !== 'message') return; // Exit if conditions aren't met

    // Get the HTML element where we will display the transcription
    const display = document.getElementById('transcription-display');
    // Only proceed if the display element is found in the HTML
    if (display) {
        // Loop through each content block in the last message
        for (const block of last.content) {
            // Check if the block contains audio input or output transcription data
            // Only process if this is a new message
        if (last.itemId !== lastMessageId) {
            for (const block of last.content) {
                if (block.type === 'input_audio' || block.type === 'audio') {
                    // Add the message with a role prefix and newline
                    display.textContent += `${last.role === 'user' ? 'You: ' : 'Assistant: '}${block.transcript}\n`;
                }
            }
            lastMessageId = last.itemId; // Update the last processed ID
        }
    }
}});



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