/**
 * main.ts (browser entry)
 * -------------------------------------------------------------
 * 1️⃣ Fetch an ephemeral OpenAI token from your Express backend
 * 2️⃣ Kick off a streaming chat-completion via Server-Sent Events
 * 3️⃣ Log the assistant’s tokens to the console as they arrive
 */

console.log('🔵 main.ts loaded');

// 1️⃣ Grab references to your UI (if any)
// For a headless demo, we’ll just prompt and log to console
// Uncomment & adapt if you have inputs/buttons:
// const inputEl = document.querySelector<HTMLInputElement>('#userInput')!;
// const sendBtn = document.querySelector<HTMLButtonElement>('#sendBtn')!;

async function start() {
  try {
    // ─────────────────────────────────────────────────────────────
    // A) Fetch a short-lived token from your backend
    // ─────────────────────────────────────────────────────────────
    const tokenResp = await fetch('http://localhost:3000/api/realtime/session');
    if (!tokenResp.ok) {
      throw new Error(`Token request failed: ${tokenResp.status} ${tokenResp.statusText}`);
    }
    const { token } = await tokenResp.json();
    console.log('🔑 Received token');

    // ─────────────────────────────────────────────────────────────
    // B) Open a streaming request to your chat endpoint
    // ─────────────────────────────────────────────────────────────
    const userMessage = window.prompt('You:') || 'Hello!';
    const chatResp = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`        // pass the token to your server
      },
      body: JSON.stringify({ messages: [{ role: 'user', content: userMessage }] })
    });
    if (!chatResp.ok || !chatResp.body) {
      throw new Error(`Chat request failed: ${chatResp.status} ${chatResp.statusText}`);
    }

    console.log('🚀 Stream opened, awaiting assistant tokens...');

    // ─────────────────────────────────────────────────────────────
    // C) Read streamed chunks and log them as they arrive
    // ─────────────────────────────────────────────────────────────
    const reader = chatResp.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        // decode & split SSE frames ("data:…\n\n")
        const text = decoder.decode(value, { stream: true });
        text.split(/\n\n/).forEach((frame) => {
          if (!frame.trim()) return;
          const payload = frame.replace(/^data:\s*/, '');
          if (payload === '[DONE]') {
            console.log('\n✅ Stream complete');
          } else {
            // log each partial chunk
            process.stdout ? process.stdout.write(payload) : console.log(payload);
          }
        });
      }
    }
  } catch (err: any) {
    console.error('🔥 Error in streaming chat:', err);
  }
}

start();
