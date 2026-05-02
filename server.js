const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, '.tasks.json');

app.use(express.json());
app.use(express.static(__dirname));

function loadTasks() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('Could not parse tasks.json, starting fresh:', err.message);
    return [];
  }
}

function saveTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

let tasks = loadTasks();
console.log(`Loaded ${tasks.length} task(s) from ${DATA_FILE}`);

// GET /tasks
app.get('/tasks', (_req, res) => {
  res.json(tasks);
});

// POST /tasks  { text, completed?, dueDate?, description? }
app.post('/tasks', (req, res) => {
  const { text, completed = false, dueDate = null, description = null, dueSoon = 4 } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Task text is required.' });
  }
  const task = { id: crypto.randomUUID(), text: text.trim(), completed, dueDate, description, dueSoon: Number(dueSoon) || 4 };
  tasks.push(task);
  saveTasks(tasks);
  res.status(201).json(task);
});

// PUT /tasks/:id  { text?, completed?, dueDate?, description? }
app.put('/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found.' });

  const { text, completed, dueDate, description, dueSoon } = req.body;
  if (text !== undefined) {
    tasks[idx].text = text.trim();
  } 
  if (completed !== undefined) {
    tasks[idx].completed = completed;
  } 
  if (dueDate !== undefined) {
    tasks[idx].dueDate = dueDate || null;
  }
  if (description !== undefined) {
    tasks[idx].description = description || null;
  }
  if (dueSoon !== undefined) {
    tasks[idx].dueSoon = Number(dueSoon) || 4;
  }

  saveTasks(tasks);
  res.json(tasks[idx]);
});

// DELETE /tasks/:id
app.delete('/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found.' });
  tasks.splice(idx, 1);
  saveTasks(tasks);
  res.status(204).send();
});

// GET /keepalive  — SSE stream; when the browser tab closes, shut down
app.get('/keepalive', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();
  // Send a comment every 15 s to prevent proxy timeouts
  const ping = setInterval(() => res.write(': ping\n\n'), 15000);
  req.on('close', () => {
    clearInterval(ping);
    console.log('Browser window closed — shutting down server.');
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
