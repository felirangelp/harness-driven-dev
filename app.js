/**
 * HDD Task Board — Vanilla JS Kanban
 */

(function () {
  "use strict";

  const STATUSES = ["todo", "in-progress", "done"];

  // ── State ──

  function loadTasks() {
    try {
      return JSON.parse(localStorage.getItem("hdd-tasks")) || [];
    } catch {
      return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem("hdd-tasks", JSON.stringify(tasks));
  }

  let tasks = loadTasks();

  // ── Rendering ──

  function updateCounts() {
    STATUSES.forEach(function (status) {
      var count = tasks.filter(function (t) { return t.status === status; }).length;
      document.getElementById("count-" + status).textContent = count;
    });
  }

  function createCard(task) {
    var card = document.createElement("div");
    card.className = "task-card";
    card.dataset.id = task.id;
    card.setAttribute("draggable", "true");

    card.addEventListener("dragstart", function (e) {
      e.dataTransfer.setData("text/plain", task.id);
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", function () {
      card.classList.remove("dragging");
    });

    var title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    var actions = document.createElement("div");
    actions.className = "task-actions";

    // Move buttons based on current status
    var idx = STATUSES.indexOf(task.status);

    if (idx > 0) {
      var leftBtn = document.createElement("button");
      leftBtn.textContent = "\u2190";
      leftBtn.title = "Move to " + STATUSES[idx - 1];
      leftBtn.addEventListener("click", function () {
        moveTask(task.id, STATUSES[idx - 1]);
      });
      actions.appendChild(leftBtn);
    }

    if (idx < STATUSES.length - 1) {
      var rightBtn = document.createElement("button");
      rightBtn.textContent = "\u2192";
      rightBtn.title = "Move to " + STATUSES[idx + 1];
      rightBtn.addEventListener("click", function () {
        moveTask(task.id, STATUSES[idx + 1]);
      });
      actions.appendChild(rightBtn);
    }

    var delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "\u00d7";
    delBtn.title = "Delete";
    delBtn.addEventListener("click", function () {
      deleteTask(task.id);
    });
    actions.appendChild(delBtn);

    card.appendChild(title);
    card.appendChild(actions);
    return card;
  }

  function render() {
    STATUSES.forEach(function (status) {
      var list = document.getElementById("list-" + status);
      list.innerHTML = "";
      tasks
        .filter(function (t) { return t.status === status; })
        .forEach(function (t) { list.appendChild(createCard(t)); });
    });
    updateCounts();
  }

  // ── Actions ──

  function addTask(title) {
    if (!title || !title.trim()) return;
    tasks.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: title.trim(),
      status: "todo",
    });
    saveTasks(tasks);
    render();
  }

  function moveTask(id, newStatus) {
    tasks = tasks.map(function (t) {
      if (t.id === id) {
        return Object.assign({}, t, { status: newStatus });
      }
      return t;
    });
    saveTasks(tasks);
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    saveTasks(tasks);
    render();
  }

  // ── Event listeners ──

  document.getElementById("add-task-btn").addEventListener("click", function () {
    var input = document.getElementById("new-task-input");
    addTask(input.value);
    input.value = "";
    input.focus();
  });

  document.getElementById("new-task-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      addTask(this.value);
      this.value = "";
    }
  });

  // ── Drag and Drop ──

  function setupDropZones() {
    var lists = document.querySelectorAll(".task-list");
    lists.forEach(function (list) {
      list.addEventListener("dragover", function (e) {
        e.preventDefault();
        list.closest(".column").classList.add("drag-over");
      });

      list.addEventListener("dragleave", function (e) {
        if (!list.contains(e.relatedTarget)) {
          list.closest(".column").classList.remove("drag-over");
        }
      });

      list.addEventListener("drop", function (e) {
        e.preventDefault();
        list.closest(".column").classList.remove("drag-over");
        var taskId = e.dataTransfer.getData("text/plain");
        var newStatus = list.closest(".column").dataset.status;
        if (taskId && newStatus) {
          moveTask(taskId, newStatus);
        }
      });
    });
  }

  setupDropZones();

  // ── Theme Toggle ──

  function loadTheme() {
    return localStorage.getItem("hdd-theme") || "dark";
  }

  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    var btn = document.getElementById("theme-toggle-btn");
    if (btn) {
      btn.textContent = theme === "dark" ? "Light" : "Dark";
    }
    localStorage.setItem("hdd-theme", theme);
  }

  function toggleTheme() {
    var current = loadTheme();
    applyTheme(current === "dark" ? "light" : "dark");
  }

  document.getElementById("theme-toggle-btn").addEventListener("click", toggleTheme);
  applyTheme(loadTheme());

  // ── Export ──

  function exportTasks() {
    var json = JSON.stringify(tasks, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "tasks_export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  document.getElementById("export-json-btn").addEventListener("click", exportTasks);

  // ── Expose for testing ──

  if (typeof window !== "undefined") {
    window.TaskBoard = {
      addTask: addTask,
      moveTask: moveTask,
      deleteTask: deleteTask,
      exportTasks: exportTasks,
      getTasks: function () { return tasks.slice(); },
      reset: function () {
        tasks = [];
        saveTasks(tasks);
        render();
      },
    };
  }

  // ── Init ──

  render();
})();
