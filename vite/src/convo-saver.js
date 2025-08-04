import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors());

// Get the directory name in an ES module-compatible way
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store ongoing conversations (key: session ID, value: array of messages)
const ongoingConversations = new Map();

app.post('/save-convo', (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message || !message.role || !message.message) {
    return res.status(400).send('Invalid conversation data');
  }

  // If no session exists, create a new one with a timestamped folder
  if (!ongoingConversations.has(sessionId)) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const convoFolder = path.join(__dirname, `convo_${timestamp}`);
    if (!fs.existsSync(convoFolder)) {
      fs.mkdirSync(convoFolder);
    }
    ongoingConversations.set(sessionId, { folder: convoFolder, messages: [] });
  }

  // Add the new message to the session
  const convoData = ongoingConversations.get(sessionId);
  convoData.messages.push(`${message.role === 'user' ? 'You' : 'Assistant'}: ${message.message}`);

  // Save to a single file in the folder
  const filePath = path.join(convoData.folder, 'conversation.txt');
  fs.writeFile(filePath, convoData.messages.join('\n'), (err) => {
    if (err) {
      console.error('Error saving convo:', err);
      return res.status(500).send('Error saving convo');
    }
    res.send('Convo updated, bro!');
  });
});

// Optional: Endpoint to end a session and clear it
app.post('/end-convo', (req, res) => {
  const { sessionId } = req.body;
  if (ongoingConversations.has(sessionId)) {
    ongoingConversations.delete(sessionId);
    res.send('Convo ended and cleared');
  } else {
    res.status(404).send('Session not found');
  }
});

app.listen(PORT, () => {
  console.log(`Convo saver running at http://localhost:${PORT}`);
});