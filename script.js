/* Final script.js
   - Pula osób (lewa) + Dopasowania (prawa)
   - Dodaj ON/OFF, Usuwanie ON/OFF, Reset
   - touch-safe drag (iPhone) + desktop drag
   - delete logic per spec:
     * delete left -> remove left & its right row; if that row had match -> match returns to left
     * delete right -> remove only match (match returns to left); left row stays
   - drop-zone shows "Przeciągnij tutaj" when empty (option A)
   - match can be dragged back to left
   - persist to localStorage
*/

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "konfigurator-final";

  const sourceList = document.getElementById("source-list");
  const targetArea = document.getElementById("target-area");

  const btnAddToggle = document.getElementById("btn-add-toggle");
  const addArea = document.getElementById("add-area");
  const topInput = document.getElementById("top-input");
  const topAddBtn = document.getElementById("top-add-btn");

  const btnDeleteToggle = document.getElementById("btn-delete-toggle");
  const btnReset = document.getElementById("btn-reset");

  let dragged = null;
  let draggedOrigin = null; // {type: 'source'|'match', parentDrop: element|null}

  /* ---------- SAVE / LOAD ---------- */
  function saveState() {
    const people = [...targetArea.querySelectorAll(".target-card")].map(c => c.querySelector("strong").textContent);
    const matches = [...targetArea.querySelectorAll(".target-card")].map(c => {
      const m = c.querySelector(".match-item");
      return m ? m.textContent : null;
    });
    const leftovers = [...sourceList.querySelectorAll(".source-item")].map(s => s.querySelector(".name").textContent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ people, matches, leftovers }));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      sourceList.innerHTML = "";
      targetArea.innerHTML = "";

      (s.people || []).forEach((p, i) => {
        const card = createTargetCard(p);
        targetArea.appendChild(card);
        const mName = s.matches && s.matches[i];
        if (mName) createMatchElement(card.querySelector(".drop-zone"), mName);
      });

      (s.leftovers || []).forEach(n => {
        sourceList.appendChild(createSourceItem(n));
      });
    } catch (e) {
      console.warn("Invalid saved state", e);
    }
  }

  /* ---------- CREATE ELEMENTS ---------- */
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
    del.addEventListener("click", (ev) => {
      ev.stopPropagation();
      deleteLeft(name);
    });

    el.appendChild(label);
    el.appendChild(del);

    // desktop drag
    el.addEventListener("dragstart", (e) => {
      dragged = el;
      draggedOrigin = { type: "source" };
      el.classList.add("dragging");
      e.dataTransfer.setData("text/plain", name);
    });
    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      dragged = null;
      draggedOrigin = null;
    });

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

    // desktop drop handlers
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("over");
      const payload = e.dataTransfer.getData("text/plain");
      handleDrop({ name: payload, sourceEl: dragged, origin: draggedOrigin }, drop);
    });

    const del = document.createElement("span");
    del.className = "delete";
    del.textContent = "✕";
    del.addEventListener("click", (ev) => {
      ev.stopPropagation();
      deleteRight(name);
    });

    card.appendChild(label);
    card.appendChild(drop);
    card.appendChild(del);

    return card;
  }

  function createMatchElement(dropZone, name) {
    // ensure the dropZone is cleared and centered
    dropZone.innerHTML = "";
    const m = document.createElement("div");
    m.className = "match-item";
    m.setAttribute("draggable", "true");
    m.textContent = name;

    // desktop drag
    m.addEventListener("dragstart", (e) => {
      dragged = m;
      draggedOrigin = { type: "match", parentDrop: dropZone };
      m.classList.add("dragging");
      e.dataTransfer.setData("text/plain", name);
    });
    m.addEventListener("dragend", () => {
      if (dragged) dragged.classList.remove("dragging");
      dragged = null;
      draggedOrigin = null;
    });

    enableTouchDrag(m);

    dropZone.appendChild(m);
    dropZone.classList.add("has-match");
    dropZone.classList.remove("empty");
    return m;
  }

  /* ---------- DELETION BEHAVIOR ---------- */

  // delete left (Pula osób)
  function deleteLeft(name) {
    // remove source item(s)
    [...sourceList.querySelectorAll(".source-item")].forEach(s => {
      if (s.querySelector(".name").textContent === name) s.remove();
    });

    // remove corresponding target row, and if that row had match -> return match to left
    [...targetArea.querySelectorAll(".target-card")].forEach(card => {
      const person = card.querySelector("strong").textContent;
      if (person === name) {
        const dz = card.querySelector(".drop-zone");
        const match = dz.querySelector(".match-item");
        if (match) {
          sourceList.appendChild(createSourceItem(match.textContent));
        }
        card.remove();
      }
    });

    saveState();
  }

  // delete right (only match) — remove match and return to left; left row remains
  function deleteRight(personName) {
    [...targetArea.querySelectorAll(".target-card")].forEach(card => {
      const person = card.querySelector("strong").textContent;
      if (person === personName) {
        const dz = card.querySelector(".drop-zone");
        const match = dz.querySelector(".match-item");
        if (match) {
          sourceList.appendChild(createSourceItem(match.textContent));
          dz.innerHTML = "Przeciągnij tutaj";
          dz.classList.remove("has-match");
          dz.classList.add("empty");
        }
      }
    });
    saveState();
  }

  /* ---------- DROP / SWAP / RETURN logic ---------- */
  function handleDrop(payload, dropZone) {
    const name = payload.name;
    const origin = payload.origin;
    const currentMatch = dropZone.querySelector(".match-item");

    // from source -> assign into dropZone
    if (!origin || origin.type === "source") {
      if (currentMatch) {
        // existing match goes back to left
        const old = currentMatch.textContent;
        currentMatch.remove();
        sourceList.appendChild(createSourceItem(old));
      }
      createMatchElement(dropZone, name);
      // remove source element if it exists
      if (payload.sourceEl && payload.sourceEl.classList && payload.sourceEl.classList.contains("source-item")) {
        payload.sourceEl.remove();
      }
      saveState();
      return;
    }

    // from match -> move or swap
    if (origin.type === "match") {
      const fromDrop = origin.parentDrop;
      if (!fromDrop || fromDrop === dropZone) return;

      const movingName = payload.sourceEl ? payload.sourceEl.textContent : name;

      if (!currentMatch) {
        // simple move
        fromDrop.innerHTML = "Przeciągnij tutaj";
        fromDrop.classList.add("empty");
        fromDrop.classList.remove("has-match");
        createMatchElement(dropZone, movingName);
        saveState();
        return;
      }

      // swap
      const otherName = currentMatch.textContent;

      // clear both
      fromDrop.innerHTML = "Przeciągnij tutaj";
      fromDrop.classList.add("empty");
      fromDrop.classList.remove("has-match");

      dropZone.innerHTML = "Przeciągnij tutaj";
      dropZone.classList.add("empty");
      dropZone.classList.remove("has-match");

      // recreate swapped
      createMatchElement(fromDrop, otherName);
      createMatchElement(dropZone, movingName);
      saveState();
    }
  }

  /* ---------- TOUCH (iPhone safe) ---------- */
  function enableTouchDrag(el) {
    el.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      dragged = el;
      if (el.classList.contains("source-item")) draggedOrigin = { type: "source" };
      else if (el.classList.contains("match-item")) draggedOrigin = { type: "match", parentDrop: el.closest(".drop-zone") };
      else draggedOrigin = { type: "unknown" };
      el.classList.add("dragging");
    }, { passive: false });

    el.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const under = document.elementFromPoint(t.clientX, t.clientY);
      // highlight available drop zones
      document.querySelectorAll(".drop-zone").forEach(d => d.classList.remove("over"));
      const dz = under?.closest(".drop-zone");
      if (dz) dz.classList.add("over");
    }, { passive: false });

    el.addEventListener("touchend", (e) => {
      el.classList.remove("dragging");
      const t = e.changedTouches[0];
      const under = document.elementFromPoint(t.clientX, t.clientY);
      const dz = under?.closest(".drop-zone");
      const srcArea = under?.closest("#source-list");

      if (dz) {
        handleDrop({ name: el.textContent.trim(), sourceEl: el, origin: draggedOrigin }, dz);
      } else if (srcArea) {
        // if dragged a match back to left -> return
        if (draggedOrigin && draggedOrigin.type === "match") {
          const from = draggedOrigin.parentDrop;
          if (from) {
            const movingName = el.textContent.trim();
            from.innerHTML = "Przeciągnij tutaj";
            from.classList.remove("has-match");
            from.classList.add("empty");
            sourceList.appendChild(createSourceItem(movingName));
          }
        }
        // if dragging source within left -> nothing
      } else {
        // dropped outside -> no-op
      }

      document.querySelectorAll(".drop-zone").forEach(d => d.classList.remove("over"));
      dragged = null;
      draggedOrigin = null;
      saveState();
    }, { passive: false });
  }

  /* ---------- UI: buttons ---------- */
  btnAddToggle.addEventListener("click", () => {
    const showing = !addArea.classList.contains("hidden");
    if (showing) {
      addArea.classList.add("hidden");
      btnAddToggle.textContent = "Dodaj OFF";
    } else {
      addArea.classList.remove("hidden");
      topInput.focus();
      btnAddToggle.textContent = "Dodaj ON";
    }
  });

  topAddBtn.addEventListener("click", () => {
    const v = (topInput.value || "").trim();
    if (!v) return;
    addPerson(v);
    topInput.value = "";
    topInput.focus();
  });
  topInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") topAddBtn.click();
  });

  btnDeleteToggle.addEventListener("click", () => {
    const deleting = document.body.classList.toggle("deleting");
    btnDeleteToggle.textContent = deleting ? "Usuwanie ON" : "Usuwanie OFF";
  });

  btnReset.addEventListener("click", () => {
    if (!confirm("Na pewno zresetować wszystkie dane?")) return;
    localStorage.removeItem(STORAGE_KEY);
    sourceList.innerHTML = "";
    targetArea.innerHTML = "";
  });

  /* ---------- Add person (create target row + source item) ---------- */
  function addPerson(name) {
    if (!name) return;
    // if target row doesn't exist, create it
    const exists = [...targetArea.querySelectorAll(".target-card")].some(c => c.querySelector("strong").textContent === name);
    if (!exists) targetArea.appendChild(createTargetCard(name));
    // if source doesn't have name, add to source
    const inSource = [...sourceList.querySelectorAll(".source-item")].some(s => s.querySelector(".name").textContent === name);
    if (!inSource) sourceList.appendChild(createSourceItem(name));
    saveState();
  }

  /* ---------- Initialize ---------- */
  loadState();
  // expose small helper for debugging (optional)
  window._konfig_save = saveState;
  window._konfig_load = loadState;

  // ensure page state saved when leaving
  window.addEventListener("pagehide", saveState);
  window.addEventListener("beforeunload", saveState);
});
