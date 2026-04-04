// ── API base URL ───────────────────────────────────────────────────────────────
const API = '/tasks';

// ── DOM refs ───────────────────────────────────────────────────────────────────
const taskInput = document.getElementById('new-task');
const dueDateInput = document.getElementById('new-due-date');
const dueSoonInput = document.getElementById('new-due-soon');
const descriptionInput = document.getElementById('new-description');
const addButton = document.getElementsByTagName('button')[0];
const incompleteTaskHolder = document.getElementById('incomplete-tasks');
const completedTasksHolder = document.getElementById('completed-tasks');

// ── Helper: format YYYY-MM-DD → { text, cls } ────────────────────────────────
function formatDueDate(dateStr, dueSoon = 4) {
  if (!dateStr) return { text: '', cls: '' };
  const [y, m, d] = dateStr.split('-').map(Number);
  const due   = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  let taskStatus = '';
  if (diff < 0) {
    taskStatus = 'overdue';
  } else if (diff <= dueSoon) {
    taskStatus = 'due-soon';
  } else {
    taskStatus = 'due-future';
  }
  if (diff === 0) return { text: 'Due today',    cls: 'due-today' };
  return {
    text: `Due ${due.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} (${Math.abs(diff)} day${Math.abs(diff) > 1 ? 's' : ''})`,
    cls: taskStatus,
  };
}

// ── Helper: refresh due-date badge (reads dueSoon from data attribute) ────────
function refreshDueBadge(listItem, dateStr) {
  const span    = listItem.querySelector('.due-date');
  const dueSoon = parseInt(listItem.dataset.dueSoon) || 4;
  span.className   = 'due-date';
  span.textContent = '';
  if (dateStr) {
    const { text, cls } = formatDueDate(dateStr, dueSoon);
    span.textContent = text;
    span.classList.add(cls);
  }
}

// ── Sort a <ul> by each <li>'s data-due attribute ─────────────────────────────
function sortTaskList(ul) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group 0 = upcoming/today, Group 1 = no due date, Group 2 = overdue
  function group(dateStr) {
    if (!dateStr) return 1;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d) < today ? 2 : 0;
  }

  Array.from(ul.children)
    .sort((a, b) => {
      const da = a.dataset.due;
      const db = b.dataset.due;
      const ga = group(da);
      const gb = group(db);
      if (ga !== gb) return ga - gb;
      if (!da && !db) return 0;
      if (!da) return  1;
      if (!db) return -1;
      return da.localeCompare(db);
    })
    .forEach(li => ul.appendChild(li));
}

// ── Toggle description ────────────────────────────────────────────────────────
const toggleDesc = function () {
  const listItem = this.parentNode;
  const open = listItem.classList.toggle('desc-visible');
  this.textContent = open ? '▴ Hide details' : '▾ Show details';
};

function refreshToggleBtn(listItem, description) {
  const btn = listItem.querySelector('.toggle-desc');
  if (description) {
    listItem.classList.add('has-description');
    btn.textContent = listItem.classList.contains('desc-visible') ? '▴ Hide details' : '▾ Show details';
  } else {
    listItem.classList.remove('has-description');
    listItem.classList.remove('desc-visible');
  }
}

// ── Part 1 – Build a task <li> ────────────────────────────────────────────────
const createNewTaskElement = function (taskString, id, completed = false, dueDate = null, description = null, dueSoon = 4) {
  const listItem      = document.createElement('li');
  listItem.dataset.id   = id;
  listItem.dataset.due  = dueDate  || '';
  listItem.dataset.dueSoon = dueSoon;

  const checkBox = document.createElement('input');
  const label = document.createElement('label');
  const editInput = document.createElement('input');
  const editButton = document.createElement('button');
  const deleteButton = document.createElement('button');
  const dueDateSpan = document.createElement('span');
  const editDueDate = document.createElement('input');
  const editDueSoonLabel = document.createElement('span');   // sits next to editDueDate
  const editDueSoon = document.createElement('input');  // number input in edit mode
  const editDueSoonUnit = document.createElement('span');   // unit label floats after number
  const toggleBtn = document.createElement('button');
  const descSpan = document.createElement('span');
  const editDescArea = document.createElement('textarea');

  label.innerText = taskString;
  checkBox.type = 'checkbox';
  checkBox.checked = completed;
  editInput.type = 'text';

  editButton.innerText = 'Edit';
  editButton.className = 'edit';
  deleteButton.innerText = 'Delete';
  deleteButton.className = 'delete';

  // Due date badge
  dueDateSpan.className = 'due-date';
  if (dueDate) {
    const { text, cls } = formatDueDate(dueDate, dueSoon);
    dueDateSpan.textContent = text;
    dueDateSpan.classList.add(cls);
  }

  // Edit: date picker
  editDueDate.type = 'date';
  editDueDate.className = 'edit-due-date';
  editDueDate.value = dueDate || '';

  // Edit: due-soon
  editDueSoonLabel.className = 'edit-due-soon-label';
  editDueSoonLabel.textContent = 'Alert';
  editDueSoon.type = 'number';
  editDueSoon.className = 'edit-due-soon';
  editDueSoon.value = dueSoon;
  editDueSoon.min = 0;
  editDueSoon.max = 90;
  editDueSoonUnit.className = 'edit-due-soon-unit';
  editDueSoonUnit.textContent = 'day(s) before';

  // Toggle button
  toggleBtn.className = 'toggle-desc';
  toggleBtn.textContent = '▾ Show details';
  if (description) listItem.classList.add('has-description');

  // Description display / edit
  descSpan.className = 'task-description';
  descSpan.textContent = description || '';
  editDescArea.className = 'edit-description';
  editDescArea.placeholder = 'Add a description…';
  editDescArea.value = description || '';

  listItem.appendChild(checkBox);
  listItem.appendChild(label);
  listItem.appendChild(editInput);
  listItem.appendChild(editButton);
  listItem.appendChild(deleteButton);
  listItem.appendChild(dueDateSpan);
  listItem.appendChild(editDueDate);
  listItem.appendChild(editDueSoonLabel);
  listItem.appendChild(editDueSoon);
  listItem.appendChild(editDueSoonUnit);
  listItem.appendChild(toggleBtn);
  listItem.appendChild(descSpan);
  listItem.appendChild(editDescArea);
  return listItem;
};

// ── Part 2 – Add task (POST /tasks) ───────────────────────────────────────────
const addTask = function () {
  if (taskInput.value.trim() === '') return;

  fetch(API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      text:        taskInput.value,
      completed:   false,
      dueDate:     dueDateInput.value     || null,
      dueSoon:     parseInt(dueSoonInput.value) || 4,
      description: descriptionInput.value.trim() || null,
    }),
  })
    .then(res => res.json())
    .then(task => {
      const listItem = createNewTaskElement(task.text, task.id, task.completed, task.dueDate, task.description, task.dueSoon);
      incompleteTaskHolder.appendChild(listItem);
      bindTaskEvents(listItem, taskCompleted);
      sortTaskList(incompleteTaskHolder);
      taskInput.value = '';
      dueDateInput.value = '';
      dueSoonInput.value = 4;
      descriptionInput.value = '';
    })
    .catch(err => console.error('Failed to add task:', err));
};

// ── Part 3 – Edit task (PUT /tasks/:id) ───────────────────────────────────────
const editTask = function () {
  const listItem = this.parentNode;
  const editInput = listItem.querySelector('input[type=text]');
  const label = listItem.querySelector('label');
  const editDueDate = listItem.querySelector('.edit-due-date');
  const editDueSoon = listItem.querySelector('.edit-due-soon');
  const descSpan = listItem.querySelector('.task-description');
  const editDescArea = listItem.querySelector('.edit-description');
  const inEditMode = listItem.classList.contains('editMode');

  if (inEditMode) {
    const newText = editInput.value.trim() || label.innerText;
    const newDueDate = editDueDate.value || null;
    const newDueSoon = parseInt(editDueSoon.value) || 4;
    const newDesc = editDescArea.value.trim() || null;

    label.innerText = newText;
    descSpan.textContent = newDesc || '';
    listItem.dataset.due = newDueDate || '';
    listItem.dataset.dueSoon = newDueSoon;
    refreshDueBadge(listItem, newDueDate);
    refreshToggleBtn(listItem, newDesc);
    sortTaskList(listItem.parentNode);

    fetch(`${API}/${listItem.dataset.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text: newText, dueDate: newDueDate, dueSoon: newDueSoon, description: newDesc }),
    }).catch(err => console.error('Failed to update task:', err));
  } else {
    editInput.value = label.innerText;
    editDescArea.value = descSpan.textContent;
  }

  listItem.classList.toggle('editMode');
  this.textContent = inEditMode ? 'Edit' : 'Save';
};

// ── Part 4 – Delete task ──────────────────────────────────────────────────────
const deleteTask = function () {
  const listItem = this.parentNode;
  fetch(`${API}/${listItem.dataset.id}`, { method: 'DELETE' })
    .then(() => listItem.parentNode.removeChild(listItem))
    .catch(err => console.error('Failed to delete task:', err));
};

// ── Part 5 – Mark complete ────────────────────────────────────────────────────
const taskCompleted = function () {
  const listItem = this.parentNode;
  fetch(`${API}/${listItem.dataset.id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ completed: true }),
  }).catch(err => console.error('Failed to mark complete:', err));
  completedTasksHolder.appendChild(listItem);
  sortTaskList(completedTasksHolder);
  bindTaskEvents(listItem, taskIncomplete);
};

// ── Part 6 – Mark incomplete ──────────────────────────────────────────────────
const taskIncomplete = function () {
  const listItem = this.parentNode;
  fetch(`${API}/${listItem.dataset.id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ completed: false }),
  }).catch(err => console.error('Failed to mark incomplete:', err));
  incompleteTaskHolder.appendChild(listItem);
  sortTaskList(incompleteTaskHolder);
  bindTaskEvents(listItem, taskCompleted);
};

// ── Part 7 – Bind events ──────────────────────────────────────────────────────
const bindTaskEvents = function (taskListItem, checkBoxEventHandler) {
  taskListItem.querySelector('input[type=checkbox]').onchange = checkBoxEventHandler;
  taskListItem.querySelector('button.edit').onclick = editTask;
  taskListItem.querySelector('button.delete').onclick = deleteTask;
  taskListItem.querySelector('button.toggle-desc').onclick = toggleDesc;
};

// ── Part 8 – Wire up Add button + Enter ──────────────────────────────────────
addButton.addEventListener('click', addTask);
taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });

// ── Part 9 – Load tasks on page load ─────────────────────────────────────────
fetch(API)
  .then(res => res.json())
  .then(tasks => {
    tasks.forEach(task => {
      const listItem = createNewTaskElement(task.text, task.id, task.completed, task.dueDate, task.description, task.dueSoon ?? 4);
      if (task.completed) {
        completedTasksHolder.appendChild(listItem);
        bindTaskEvents(listItem, taskIncomplete);
      } else {
        incompleteTaskHolder.appendChild(listItem);
        bindTaskEvents(listItem, taskCompleted);
      }
    });
    sortTaskList(incompleteTaskHolder);
    sortTaskList(completedTasksHolder);
  })
  .catch(err => console.error('Failed to load tasks:', err));
