document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY = "konfigurator-v4";

  const sourceList = document.getElementById("source-list");
  const targetArea = document.getElementById("target-area");

  const btnAddToggle = document.getElementById("btn-add-toggle");
  const addArea = document.getElementById("add-area");
  const topInput = document.getElementById("top-input");
  const topAddBtn = document.getElementById("top-add-btn");

  const editToggle = document.getElementById("edit-toggle");
  const editStateSpan = document.getElementById("edit-state");

  const btnReset = document.getElementById("btn-reset");

  let dragged = null;
  let draggedOrigin = null;

  /* ------------------------------
      SAVE / LOAD
  ------------------------------ */
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
        const match = s.matches[i];
        if (match) {
          createMatchElement(card.querySelector(".drop-zone"), match);
        }
      });

      (s.leftovers || []).forEach(n => {
        sourceList.appendChild(createSourceItem(n));
      });

    } catch (e) { console.warn("state error", e); }
  }

  /* ------------------------------
      ELEMENT FACTORY
  ------------------------------ */
  function createSourceItem(name) {
    const el = document.createElement("div");
    el.className = "source-item";
    el.setAttribute("draggable", "true");

    const span = document.createElement("span");
    span.className = "name";
    span.textContent = name;

    const del = document.createElement("span");
    del.className = "delete";
    del.textContent = "✕";
    del.addEventListener("click", (ev) => {
      ev.stopPropagation();
      removeSource(name);
    });

    el.appendChild(span);
    el.appendChild(del);

    /* drag */
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

    drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", e => {
      e.preventDefault();
      drop.classList.remove("over");
      const text = e.dataTransfer.getData("text/plain");
      handleDrop({ name:text, sourceEl:dragged, origin:draggedOrigin }, drop);
    });

    const del = document.createElement("span");
    del.className = "delete";
    del.textContent = "✕";
    del.addEventListener("click", () => removeTargetRow(name));

    card.appendChild(label);
    card.appendChild(drop);
    card.appendChild(del);

    return card;
  }

  function createMatchElement(dropZone, name) {
    dropZone.innerHTML = "";
    const el = document.createElement("div");
    el.className = "match-item";
    el.textContent = name;
    el.setAttribute("draggable", "true");

    el.addEventListener("dragstart", (e) => {
      dragged = el;
      draggedOrigin = { type:"match", parentDrop:dropZone };
      el.classList.add("dragging");
      e.dataTransfer.setData("text/plain", name);
    });

    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      dragged = null;
      draggedOrigin = null;
    });

    enableTouchDrag(el);

    dropZone.appendChild(el);
    dropZone.classList.add("has-match");
    dropZone.classList.remove("empty");

    return el;
  }

  /* ------------------------------
      REMOVAL LOGIC
     (Twój wariant B!)
  ------------------------------ */

  // remove from Pula Osób
  function removeSource(name) {
    // usuń z lewej
    [...sourceList.children].forEach(s => {
      if (s.querySelector(".name").textContent === name) s.remove();
    });

    // usuń powiązany wiersz (prawy)
    [...targetArea.children].forEach(c => {
      if (c.querySelector("strong").textContent === name) {
        const dz = c.querySelector(".drop-zone");
        const match = dz.querySelector(".match-item");
        if (match) {
          sourceList.appendChild(createSourceItem(match.textContent));
        }
        c.remove();
      }
    });

    saveState();
  }

  // remove from Dopasowań
  function removeTargetRow(name) {
    [...targetArea.children].forEach(c => {
      if (c.querySelector("strong").textContent === name) {
        const dz = c.querySelector(".drop-zone");
        const match = dz.querySelector(".match-item");
        if (match) {
          // wraca do puli
          sourceList.appendChild(createSourceItem(match.textContent));
        }

        // usuń też z lewej
        [...sourceList.children].forEach(n => {
          if (n.querySelector(".name").textContent === name) n.remove();
        });

        c.remove();
      }
    });
    saveState();
  }

  /* ------------------------------
      DRAG & DROP LOGIC
  ------------------------------ */
  function handleDrop(payload, dropZone) {
    const name = payload.name;
    const origin = payload.origin;
    const current = dropZone.querySelector(".match-item");

    // from source
    if (origin?.type === "source") {
      if (current) {
        const old = current.textContent;
        current.remove();
        sourceList.appendChild(createSourceItem(old));
      }
      createMatchElement(dropZone, name);
      if (payload.sourceEl) payload.sourceEl.remove();
      saveState();
      return;
    }

    // from match
    if (origin?.type === "match") {
      const fromDrop = origin.parentDrop;
      if (!fromDrop || fromDrop === dropZone) return;

      const movingName = payload.sourceEl.textContent;

      if (!current) {
        // przeniesienie
        fromDrop.innerHTML = "Przeciągnij tutaj";
        fromDrop.classList.add("empty");
        fromDrop.classList.remove("has-match");

        createMatchElement(dropZone, movingName);
        saveState();
        return;
      }

      // SWAP
      const other = current.textContent;

      fromDrop.innerHTML = "Przeciągnij tutaj";
      fromDrop.classList.add("empty");
      fromDrop.classList.remove("has-match");

      dropZone.innerHTML = "Przeciągnij tutaj";
      dropZone.classList.add("empty");
      dropZone.classList.remove("has-match");

      createMatchElement(fromDrop, other);
      createMatchElement(dropZone, movingName);

      saveState();
    }
  }

  /* ------------------------------
      TOUCH DRAG (iPhone fix)
  ------------------------------ */
  function enableTouchDrag(el) {

    el.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      dragged = el;

      if (el.classList.contains("source-item"))
        draggedOrigin = { type:"source" };
      else if (el.classList.contains("match-item"))
        draggedOrigin = { type:"match", parentDrop: el.closest(".drop-zone") };

      el.classList.add("dragging");
    }, { passive:false });

    el.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const under = document.elementFromPoint(t.clientX, t.clientY);

      document.querySelectorAll(".drop-zone").forEach(d => d.classList.remove("over"));
      const dz = under?.closest(".drop-zone");
      if (dz) dz.classList.add("over");

    }, { passive:false });

    el.addEventListener("touchend", (e) => {
      el.classList.remove("dragging");
      const t = e.changedTouches[0];
      const under = document.elementFromPoint(t.clientX, t.clientY);
      const dz = under?.closest(".drop-zone");
      const inSource = under?.closest("#source-list");

      if (dz) {
        handleDrop({ name:el.textContent.trim(), sourceEl:el, origin:draggedOrigin }, dz);
      } else if (inSource) {
        // match wraca do puli
        if (draggedOrigin?.type === "match") {
          const from = draggedOrigin.parentDrop;
          from.innerHTML = "Przeciągnij tutaj";
          from.classList.add("empty");
          from.classList.remove("has-match");

          sourceList.appendChild(createSourceItem(el.textContent.trim()));
        }
      }

      document.querySelectorAll(".drop-zone").forEach(d => d.classList.remove("over"));
      dragged = null;
      draggedOrigin = null;
      saveState();
    }, { passive:false });
  }

  /* ------------------------------
      UI BUTTONS
  ------------------------------ */
  btnAddToggle.addEventListener("click", () => {
    addArea.classList.toggle("hidden");
    if (!addArea.classList.contains("hidden")) topInput.focus();
  });

  topAddBtn.addEventListener("click", () => {
    let val = topInput.value.trim();
    if (!val) return;
    addPerson(val);
    topInput.value = "";
    topInput.focus();
  });

  topInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") topAddBtn.click();
  });

  editToggle.addEventListener("click", () => {
    const editing = document.body.classList.toggle("editing");
    editStateSpan.textContent = editing ? "ON" : "OFF";
  });

  btnReset.addEventListener("click", () => {
    if (!confirm("Czy na pewno zresetować wszystko?")) return;
    localStorage.removeItem(STORAGE_KEY);
    sourceList.innerHTML = "";
    targetArea.innerHTML = "";
  });

  /* ------------------------------ */
  function addPerson(name) {
    const exists = [...targetArea.children].some(c => c.querySelector("strong").textContent === name);
    if (!exists) {
      targetArea.appendChild(createTargetCard(name));
    }
    const inSource = [...sourceList.children].some(s => s.querySelector(".name").textContent === name);
    if (!inSource) {
      sourceList.appendChild(createSourceItem(name));
    }
    saveState();
  }

  /* ------------------------------ */
  loadState();
  window.addEventListener("beforeunload", saveState);
});
