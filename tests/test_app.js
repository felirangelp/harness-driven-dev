/**
 * HDD Task Board — Tests (Node.js + jsdom, no framework)
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const js = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log("  PASS  " + name);
    passed++;
  } catch (e) {
    console.log("  FAIL  " + name);
    console.log("        " + e.message);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

function freshBoard() {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    resources: "usable",
    url: "http://localhost",
  });
  // Clear localStorage before loading app
  dom.window.localStorage.clear();
  dom.window.eval(js);
  return dom;
}

console.log("\nHDD Task Board Tests\n" + "=".repeat(40));

// ── Test 1: Board renders three empty columns ──

test("Board renders three empty columns", function () {
  var dom = freshBoard();
  var doc = dom.window.document;
  var columns = doc.querySelectorAll(".column");
  assert(columns.length === 3, "Expected 3 columns, got " + columns.length);

  var statuses = Array.from(columns).map(function (c) { return c.dataset.status; });
  assert(statuses.indexOf("todo") !== -1, "Missing 'todo' column");
  assert(statuses.indexOf("in-progress") !== -1, "Missing 'in-progress' column");
  assert(statuses.indexOf("done") !== -1, "Missing 'done' column");
  dom.window.close();
});

// ── Test 2: Add a task ──

test("addTask creates a card in To Do", function () {
  var dom = freshBoard();
  var TB = dom.window.TaskBoard;

  TB.addTask("Write tests");
  var tasks = TB.getTasks();
  assert(tasks.length === 1, "Expected 1 task, got " + tasks.length);
  assert(tasks[0].title === "Write tests", "Wrong title: " + tasks[0].title);
  assert(tasks[0].status === "todo", "Wrong status: " + tasks[0].status);

  var cards = dom.window.document.querySelectorAll("#list-todo .task-card");
  assert(cards.length === 1, "Expected 1 card in DOM, got " + cards.length);
  dom.window.close();
});

// ── Test 3: Move task forward ──

test("moveTask moves card to next column", function () {
  var dom = freshBoard();
  var TB = dom.window.TaskBoard;

  TB.addTask("Move me");
  var id = TB.getTasks()[0].id;

  TB.moveTask(id, "in-progress");
  assert(TB.getTasks()[0].status === "in-progress", "Task not moved to in-progress");

  var inProgressCards = dom.window.document.querySelectorAll("#list-in-progress .task-card");
  assert(inProgressCards.length === 1, "Card not rendered in in-progress column");

  TB.moveTask(id, "done");
  assert(TB.getTasks()[0].status === "done", "Task not moved to done");
  dom.window.close();
});

// ── Test 4: Delete task ──

test("deleteTask removes the card", function () {
  var dom = freshBoard();
  var TB = dom.window.TaskBoard;

  TB.addTask("Delete me");
  var id = TB.getTasks()[0].id;

  TB.deleteTask(id);
  assert(TB.getTasks().length === 0, "Task was not deleted");

  var allCards = dom.window.document.querySelectorAll(".task-card");
  assert(allCards.length === 0, "Card still in DOM after delete");
  dom.window.close();
});

// ── Test 5: Counters update correctly ──

test("Column counters update on add/move/delete", function () {
  var dom = freshBoard();
  var doc = dom.window.document;
  var TB = dom.window.TaskBoard;

  TB.addTask("Task A");
  TB.addTask("Task B");
  assert(doc.getElementById("count-todo").textContent === "2", "Todo count should be 2");

  var idA = TB.getTasks()[0].id;
  TB.moveTask(idA, "in-progress");
  assert(doc.getElementById("count-todo").textContent === "1", "Todo count should be 1");
  assert(doc.getElementById("count-in-progress").textContent === "1", "In-progress count should be 1");

  TB.deleteTask(idA);
  assert(doc.getElementById("count-in-progress").textContent === "0", "In-progress count should be 0");
  dom.window.close();
});

// ── Test 6: Clear completed removes only done tasks ──

test("clearCompleted removes only done tasks", function () {
  var dom = freshBoard();
  var doc = dom.window.document;
  var TB = dom.window.TaskBoard;

  TB.addTask("Stay in todo");
  TB.addTask("Stay in progress");
  TB.addTask("Complete me");
  TB.addTask("Complete me too");

  var tasks = TB.getTasks();
  TB.moveTask(tasks[1].id, "in-progress");
  TB.moveTask(tasks[2].id, "done");
  TB.moveTask(tasks[3].id, "done");

  assert(TB.getTasks().length === 4, "Should have 4 tasks before clear");

  TB.clearCompleted();

  var remaining = TB.getTasks();
  assert(remaining.length === 2, "Expected 2 tasks after clear, got " + remaining.length);
  assert(remaining[0].status === "todo", "First remaining should be todo");
  assert(remaining[1].status === "in-progress", "Second remaining should be in-progress");

  assert(doc.getElementById("count-done").textContent === "0", "Done count should be 0");
  assert(doc.getElementById("count-todo").textContent === "1", "Todo count should be 1");
  assert(doc.getElementById("count-in-progress").textContent === "1", "In-progress count should be 1");
  dom.window.close();
});

// ── Test 7: Clear completed button visibility ──

test("Clear completed button hidden when no done tasks", function () {
  var dom = freshBoard();
  var doc = dom.window.document;
  var TB = dom.window.TaskBoard;
  var btn = doc.getElementById("clear-completed-btn");

  assert(btn.hidden === true, "Button should be hidden initially");

  TB.addTask("Task A");
  var id = TB.getTasks()[0].id;
  TB.moveTask(id, "done");
  assert(btn.hidden === false, "Button should be visible when done tasks exist");

  TB.clearCompleted();
  assert(btn.hidden === true, "Button should be hidden after clearing");
  dom.window.close();
});

// ── Results ──

console.log("\n" + "=".repeat(40));
console.log("Results: " + passed + " passed, " + failed + " failed\n");

if (failed > 0) process.exit(1);
