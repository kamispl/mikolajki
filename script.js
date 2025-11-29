/* script.js
   - Option A layout (rows)
   - touch-safe drag & drop for iPhone (elementFromPoint)
   - desktop drag & drop for mouse
   - edit mode toggle
   - swap logic, return-to-source, save/load state
*/

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("item-input");
  const addBtn = document.getElementById("create-button");
  const sourceList = document.getElementById("source-list");
  const targetArea = document.getElementById("target-area");
  const editToggle = document.getElementById("edit-toggle");
  const editStateSpan = document.getElementById("edit-state");
  const STORAGE_KEY = "konfigurator-state-v2";

  let dragged = null;
  let draggedOrigin = null; // {type: 'source'|'match', parentDrop: element|null}
  let isEditing = false;

  /* ---------------------------
     STATE (save / load)
  --------------------------- */
  function saveState() {
    const state = {
      people: [...targetArea.querySelectorAll(".target-card")].map(card => card.querySelector("strong").textContent),
      matches: [...targetArea.querySelectorAll(".target-card")].map(card => {
        const m = card.querySelector(".match-item");
        return m ? m.textContent : null;
      }),
      sourceLeftovers: [...sourceList.querySelectorAll(".source-item")].map(s => s.querySelector(".name").textContent)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    // Clear UI
    sourceList.innerHTML = "";
    targetArea.innerHTML = "";
    // Build target rows (people) in order
    (s.people || []).forEach((name, idx) => {
      const card = createTargetCard(name);
      targetArea.appendChild(card);
      const matchName = (s.matches && s.matches[idx]) || null;
      if (matchName) {
        createMatchElement(card.querySelector(".drop-zone"), matchName);
      }
    });
    // Add leftover source items (those not yet assigned)
    (s.sourceLeftovers || []).forEach(n => {
      sourceList.appendChild(createSourceItem(n));
    });
    // Note: If some names are both in targets and in leftovers (broken state), we keep as-is.
  }

  /* ---------------------------
     CREATE ELEMENTS
  --------------------------- */
  function createSourceItem(name) {
    const el = document.createElement("div");
    el.className = "source-item";
    el.setAttribute("draggable", "true");

    const label = document.createElement("span");
    label.className = "name";
    label.textContent = name;

    const del = document.createElement("span");
    del.className = "delete";
    del.textContent = "✕";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      removePerson(name);
    });

    el.appendChild(label);
    el.appendChild(del);

    // Desktop drag
    el.addEventListener("dragstart", (e) => {
      dragged = el;
      draggedOrigin = { type: "source", parentDrop: null };
      el.classList.add("dragging");
      e.dataTransfer.setData("text/plain", name);
      e.dataTransfer.effectAllowed = "move";
    });
    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      dragged = null;
      draggedOrigin = null;
    });

    // Touch drag
    enableTouchDrag(el);

    return el;
  }

  function createTargetCard(name) {
    const card = document.createElement("div");
    card.className = "target-card";

    const label = document.createElement("strong");
    label.textContent = name;

    const drop = document.createElement("div");
    drop.className = "drop-zone empty";
    drop.textContent = "Przeciągnij tutaj";

    const del = document.createElement("span");
    del.className = "delete";
    del.textContent = "✕";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      removePerson(name);
    });

    card.appendChild(label);
    card.appendChild(drop);
    card.appendChild(del);

    // Desktop drop handlers
    drop.addEventListener("dragover", (e) => {
      e.preventDefault();
      drop.classList.add("over");
    });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));

    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("over");
      const payload = e.dataTransfer.getData("text/plain");
      handleDrop({ name: payload, sourceEl: dragged, origin: draggedOrigin }, drop);
    });

    // Also allow clicking an occupied drop-zone to remove match back to source (optional)
    drop.addEventListener("click", () => {
      // if click and editing? ignore
    });

    return card;
  }

  function createMatchElement(dropZone, name) {
    // If already a match exists, don't duplicate
    const existing = dropZone.querySelector(".match-item");
    if (existing) return existing;

    const m = document.createElement("div");
    m.className = "match-item";
    m.setAttribute("draggable", "true");
    m.textContent = name;

    // Desktop drag
    m.addEventListener("dragstart", (e) => {
      dragged = m;
      // parent drop is the dropZone
      draggedOrigin = { type: "match", parentDrop: dropZone };
      m.classList.add("dragging");
      e.dataTransfer.setData("text/plain", name);
      e.dataTransfer.effectAllowed = "move";
    });
    m.addEventListener("dragend", () => {
      if (dragged) dragged.classList.remove("dragging");
      dragged = null;
      draggedOrigin = null;
    });

    // Touch drag
    enableTouchDrag(m);

    // append and update UI
    dropZone.innerHTML = ""; // replace content so match centers
    dropZone.appendChild(m);
    dropZone.classList.add("has-match");
    dropZone.classList.remove("empty");
    return m;
  }

  /* ---------------------------
     REMOVE person fully (from both lists)
  --------------------------- */
  function removePerson(name) {
    // Remove from source list
    [...sourceList.querySelectorAll(".source-item")].forEach(s => {
      if (s.querySelector(".name").textContent === name) s.remove();
    });
    // Remove target card
    [...targetArea.querySelectorAll(".target-card")].forEach(card => {
      const person = card.querySelector("strong").textContent;
      if (person === name) card.remove();
    });
    // Remove any matches equal to name
    [...document.querySelectorAll(".match-item")].forEach(m => {
      if (m.textContent === name) {
        const parent = m.closest(".drop-zone");
        if (parent) {
          parent.innerHTML = "Przeciągnij tutaj";
          parent.classList.remove("has-match");
          parent.classList.add("empty");
        }
      }
    });
    saveState();
  }

  /* ---------------------------
     HANDLE drop logic (swap/assign/return)
     params: {name, sourceEl, origin} and dropZone element
  --------------------------- */
  function handleDrop(payload, dropZone) {
    const name = payload.name;
    const origin = payload.origin; // may be null for dataTransfer-only
    // identify current occupant
    const currentMatch = dropZone.querySelector(".match-item");

    // if origin is a source-item (from left): assign into drop
    if (!origin || origin.type === "source") {
      // If target occupied -> move existing back to source list (or swap)
      if (currentMatch) {
        // Move currentMatch back to source (append)
        const existingName = currentMatch.textContent;
        // Remove current match
        currentMatch.remove();
        dropZone.innerHTML = "Przeciągnij tutaj";
        dropZone.classList.remove("has-match");
        dropZone.classList.add("empty");
        // add existingName back to source
        sourceList.appendChild(createSourceItem(existingName));
      }
      // Now create match with name and remove source origin element if exists
      createMatchElement(dropZone, name);
      // remove original source element from left (if present)
      if (payload.sourceEl && payload.sourceEl.classList.contains("source-item")) payload.sourceEl.remove();
      saveState();
      return;
    }

    // if origin is a match dragged from another drop zone
    if (origin.type === "match") {
      const fromDrop = origin.parentDrop;
      if (!fromDrop) return;

      // If dropZone is the same as fromDrop, nothing to do
      if (fromDrop === dropZone) {
        saveState();
        return;
      }

      // If dropZone empty: simply move match there
      if (!currentMatch) {
        // move element
        const moving = dragged;
        if (moving) {
          // remove from old parent (clear it)
          fromDrop.innerHTML = "Przeciągnij tutaj";
          fromDrop.classList.remove("has-match");
          fromDrop.classList.add("empty");

          // append to new drop
          dropZone.innerHTML = "";
          dropZone.appendChild(moving);
          dropZone.classList.add("has-match");
          dropZone.classList.remove("empty");
        } else {
          // fallback: create new and remove old text
          const nameMoving = payload.name;
          // remove previous
          fromDrop.innerHTML = "Przeciągnij tutaj";
          fromDrop.classList.remove("has-match");
          fromDrop.classList.add("empty");
          createMatchElement(dropZone, nameMoving);
        }
        saveState();
        return;
      }

      // If dropZone occupied -> swap: exchange texts between drops
      if (currentMatch) {
        const moving = dragged;
        if (moving) {
          // Extract nodes
          const other = currentMatch;
          // Keep text
          const movingName = moving.textContent;
          const otherName = other.textContent;

          // Remove both from DOM, then recreate so events rebind correctly
          fromDrop.innerHTML = "Przeciągnij tutaj";
          fromDrop.classList.remove("has-match");
          fromDrop.classList.add("empty");

          dropZone.innerHTML = "Przeciągnij tutaj";
          dropZone.classList.remove("has-match");
          dropZone.classList.add("empty");

          // Put other into fromDrop
          createMatchElement(fromDrop, otherName);
          // Put moving into dropZone
          createMatchElement(dropZone, movingName);
        } else {
          // fallback safe
          const otherName = currentMatch.textContent;
          const movingName = payload.name;
          fromDrop.innerHTML = "Przeciągnij tutaj";
          fromDrop.classList.remove("has-match");
          fromDrop.classList.add("empty");
          createMatchElement(fromDrop, otherName);
          dropZone.innerHTML = "";
          createMatchElement(dropZone, movingName);
        }
        saveState();
        return;
      }
    }
  }

  /* ---------------------------
     Touch drag implementation (shared for source & match)
     - uses elementFromPoint
  --------------------------- */
  function enableTouchDrag(el) {
    el.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      dragged = el;
      // Determine origin
      if (el.classList.contains("source-item")) {
        draggedOrigin = { type: "source", parentDrop: null };
      } else if (el.classList.contains("match-item")) {
        const p = el.closest(".drop-zone");
        draggedOrigin = { type: "match", parentDrop: p };
      } else {
        draggedOrigin = { type: "unknown", parentDrop: null };
      }
      el.classList.add("dragging");
    }, {passive:false});

    el.addEventListener("touchmove", (e) => {
      e.preventDefault(); // prevent scrolling while dragging
      const t = e.touches[0];
      // highlight drop under finger
      const under = document.elementFromPoint(t.clientX, t.clientY);
      document.querySelectorAll(".drop-zone").forEach(z => z.classList.remove("over"));
      const dz = under?.closest(".drop-zone");
      if (dz) dz.classList.add("over");
    }, {passive:false});

    el.addEventListener("touchend", (e) => {
      el.classList.remove("dragging");
      const t = e.changedTouches[0];
      const under = document.elementFromPoint(t.clientX, t.clientY);
      const dz = under?.closest(".drop-zone");
      const srcArea = under?.closest("#source-list");

      // if dropped onto a drop-zone
      if (dz) {
        handleDrop({ name: el.textContent.trim(), sourceEl: el, origin: draggedOrigin }, dz);
      }
      // if dropped back onto source list area (return to left)
      else if (srcArea) {
        // If dragging a match back to source: remove from its drop and add to source list
        if (draggedOrigin && draggedOrigin.type === "match") {
          // remove from old drop
          const from = draggedOrigin.parentDrop;
          if (from) {
            const movingName = el.textContent.trim();
            from.innerHTML = "Przeciągnij tutaj";
            from.classList.remove("has-match");
            from.classList.add("empty");
            // add back to source as item
            sourceList.appendChild(createSourceItem(movingName));
          }
        }
        // If dragging a source within source area, just leave it (no action)
        saveState();
      } else {
        // dropped on empty space (no-op)
      }

      // cleanup highlight
      document.querySelectorAll(".drop-zone").forEach(z => z.classList.remove("over"));
      dragged = null;
      draggedOrigin = null;
    }, {passive:false});
  }

  /* ---------------------------
     Adding person: create row in targets and source item left
     (in Option A we always create a target row for each created person)
  --------------------------- */
  function addPerson(name) {
    if (!name) return;
    // Avoid duplicate target rows with same name
    const exists = [...targetArea.querySelectorAll(".target-card")].some(c => c.querySelector("strong").textContent === name);
    if (exists) {
      // If same person already exists as a target row, but is currently not in source, just create source item
      // If person already completely exists both sides, do nothing
      const inSource = [...sourceList.querySelectorAll(".source-item")].some(s => s.querySelector(".name").textContent === name);
      if (!inSource) sourceList.appendChild(createSourceItem(name));
      saveState();
      return;
    }

    // Create both: a target row (person) and a source item
    targetArea.appendChild(createTargetCard(name));
    sourceList.appendChild(createSourceItem(name));
    saveState();
  }

  /* ---------------------------
     edit toggle
  --------------------------- */
  editToggle.addEventListener("click", () => {
    isEditing = !isEditing;
    document.body.classList.toggle("editing", isEditing);
    editStateSpan.textContent = isEditing ? "ON" : "OFF";
  });

  /* ---------------------------
     Hook add button and enter key
  --------------------------- */
  addBtn.addEventListener("click", () => {
    const v = input.value.trim();
    if (!v) return;
    addPerson(v);
    input.value = "";
    input.focus();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addBtn.click();
  });

  /* ---------------------------
     Initialize: load state or prepare empty
  --------------------------- */
  function bootstrapEmpty() {
    // if no state, nothing to do
  }

  loadState();
  bootstrapEmpty();

  /* ---------------------------
     Make drop zones accept clicks for keyboard users - optional
  --------------------------- */
  document.addEventListener("click", (e) => {
    // remove over states if any stray
    document.querySelectorAll(".drop-zone").forEach(z => z.classList.remove("over"));
  });

  /* ---------------------------
     Expose save on unload just in case
  --------------------------- */
  window.addEventListener("pagehide", saveState);
  window.addEventListener("beforeunload", saveState);
});
