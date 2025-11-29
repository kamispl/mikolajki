/*  
  PEŁNY DZIAŁAJĄCY DRAG&DROP NA iPHONE
  Zwijanie puli osób + usuwanie + zapisywanie
*/

document.addEventListener("DOMContentLoaded", () => {

  const STORAGE = "mikolajki-data";

  const source = document.getElementById("source-list");
  const sourceWrapper = document.getElementById("source-wrapper");
  const togglePool = document.getElementById("toggle-pool");

  const targets = document.getElementById("target-area");

  const btnAddToggle = document.getElementById("btn-add-toggle");
  const addArea = document.getElementById("add-area");
  const topInput = document.getElementById("top-input");
  const topAddBtn = document.getElementById("top-add-btn");
  const btnDeleteToggle = document.getElementById("btn-delete-toggle");
  const btnReset = document.getElementById("btn-reset");

  let deleteMode = false;

  /* ------------------------------------------
     LOCAL STORAGE
  ------------------------------------------- */
  function save() {
    const people = [];
    const matches = [];

    [...targets.querySelectorAll(".target-card")].forEach(card => {
      const person = card.querySelector("strong").textContent;
      const dz = card.querySelector(".drop-zone");
      const match = dz.querySelector(".match-item");

      people.push(person);
      matches.push(match ? match.textContent : null);
    });

    const pool = [...source.querySelectorAll(".source-item")].map(x => x.dataset.name);

    localStorage.setItem(STORAGE, JSON.stringify({ people, matches, pool }));
  }

  function load() {
    const d = JSON.parse(localStorage.getItem(STORAGE) || "{}");

    source.innerHTML = "";
    targets.innerHTML = "";

    if (d.people) {
      d.people.forEach((p, i) => {
        const c = createTargetCard(p);
        targets.appendChild(c);

        if (d.matches[i]) {
          setMatch(c.querySelector(".drop-zone"), d.matches[i]);
        }
      });
    }

    if (d.pool) {
      d.pool.forEach(name => {
        source.appendChild(createSourceItem(name));
      });
    }
  }

  /* ------------------------------------------
     ELEMENTS
  ------------------------------------------- */

  function createSourceItem(name) {
    const div = document.createElement("div");
    div.className = "source-item";
    div.dataset.name = name;
    div.textContent = name;

    const del = document.createElement("span");
    del.className = "delete";
    del.textContent = "✕";
    div.appendChild(del);

    del.addEventListener("click", (e)=> {
      e.stopPropagation();
      if (!deleteMode) return;
      deleteFromSource(name);
    });

    enableTouchDrag(div, "source");
    return div;
  }

  function createTargetCard(name) {
    const card = document.createElement("div");
    card.className = "target-card";

    const label = document.createElement("strong");
    label.textContent = name;

    const dz = document.createElement("div");
    dz.className = "drop-zone empty";
    dz.textContent = "Przeciągnij tutaj";

    const del = document.createElement("span");
    del.className = "delete";
    del.textContent = "✕";

    del.addEventListener("click", () => {
      if (!deleteMode) return;
      deleteMatch(name);
    });

    card.appendChild(label);
    card.appendChild(dz);
    card.appendChild(del);

    return card;
  }

  function setMatch(dropZone, name) {
    dropZone.innerHTML = "";

    const pill = document.createElement("div");
    pill.className = "match-item";
    pill.textContent = name;

    enableTouchDrag(pill, "match");

    dropZone.appendChild(pill);
    dropZone.classList.remove("empty");
    dropZone.classList.add("has-match");
  }

  /* ------------------------------------------
     DELETE
  ------------------------------------------- */

  function deleteFromSource(name) {
    [...source.querySelectorAll(".source-item")].forEach(x => {
      if (x.dataset.name === name) x.remove();
    });

    [...targets.querySelectorAll(".target-card")].forEach(card => {
      const p = card.querySelector("strong").textContent;
      if (p === name) {
        const dz = card.querySelector(".drop-zone");
        const match = dz.querySelector(".match-item");

        if (match) {
          source.appendChild(createSourceItem(match.textContent));
        }
        card.remove();
      }
    });

    save();
  }

  function deleteMatch(person) {
    [...targets.querySelectorAll(".target-card")].forEach(card => {
      if (card.querySelector("strong").textContent === person) {
        const dz = card.querySelector(".drop-zone");
        const match = dz.querySelector(".match-item");

        if (match) {
          source.appendChild(createSourceItem(match.textContent));
          dz.textContent = "Przeciągnij tutaj";
          dz.classList.add("empty");
          dz.classList.remove("has-match");
        }
      }
    });

    save();
  }

  /* ------------------------------------------
     DRAG & DROP — DZIAŁA NA iPHONE
  ------------------------------------------- */

  let dragElem = null;
  let dragOriginalParent = null;
  let ghost = null;

  function enableTouchDrag(elem, type) {
    elem.addEventListener("touchstart", startTouch, { passive:false });
    elem.addEventListener("touchmove", moveTouch, { passive:false });
    elem.addEventListener("touchend", endTouch);

    elem.addEventListener("mousedown", startMouse);
  }

  function startMouse(e) {
    e.preventDefault();
    beginDrag(this, e.clientX, e.clientY);
    document.addEventListener("mousemove", moveMouse);
    document.addEventListener("mouseup", endMouse);
  }
  function moveMouse(e) { moveGhost(e.clientX, e.clientY); }
  function endMouse(e) {
    finishDrag(e.clientX, e.clientY);
    document.removeEventListener("mousemove", moveMouse);
    document.removeEventListener("mouseup", endMouse);
  }

  function startTouch(e) {
    e.preventDefault();
    const t = e.touches[0];
    beginDrag(this, t.clientX, t.clientY);
  }
  function moveTouch(e) {
    const t = e.touches[0];
    moveGhost(t.clientX, t.clientY);
  }
  function endTouch(e) {
    const t = e.changedTouches[0];
    finishDrag(t.clientX, t.clientY);
  }

  /* ---------------------------------------
     START DRAG
  ----------------------------------------- */
  function beginDrag(elem, x, y) {
    dragElem = elem;
    dragOriginalParent = elem.parentElement;

    ghost = elem.cloneNode(true);
    ghost.style.position = "fixed";
    ghost.style.left = x+"px";
    ghost.style.top = y+"px";
    ghost.style.zIndex = "9999";
    ghost.style.opacity = "0.85";
    ghost.classList.add("dragging");
    ghost.style.pointerEvents = "none";
    document.body.appendChild(ghost);
  }

  function moveGhost(x,y) {
    if (!ghost) return;
    ghost.style.left = x+"px";
    ghost.style.top = y+"px";
  }

  /* ---------------------------------------
     FINISH DRAG
  ----------------------------------------- */
  function finishDrag(x, y) {
    if (!ghost || !dragElem) return;

    const target = document.elementFromPoint(x,y);

    const dz = target?.closest(".drop-zone");
    const pool = target?.closest("#source-list");

    if (dz) handleDropZone(dragElem, dz);
    else if (pool) handleDropPool(dragElem);

    ghost.remove();
    ghost = null;
    dragElem = null;

    save();
  }

  function handleDropZone(elem, dz) {
    const name = elem.textContent.trim();
    const old = dz.querySelector(".match-item");

    if (elem.classList.contains("source-item")) {
      elem.remove();
      if (old) source.appendChild(createSourceItem(old.textContent));
      setMatch(dz, name);
      return;
    }

    if (elem.classList.contains("match-item")) {
      const from = dragOriginalParent;
      const fromDZ = from;

      if (old) {
        // SWAP
        const oldName = old.textContent;
        fromDZ.innerHTML = "";
        setMatch(fromDZ, oldName);

        dz.innerHTML = "";
        setMatch(dz, name);
      } else {
        // MOVE
        fromDZ.textContent = "Przeciągnij tutaj";
        fromDZ.classList.add("empty");
        fromDZ.classList.remove("has-match");

        setMatch(dz, name);
      }
    }
  }

  function handleDropPool(elem) {
    const name = elem.textContent.trim();

    if (elem.classList.contains("match-item")) {
      const from = dragOriginalParent;
      from.textContent = "Przeciągnij tutaj";
      from.classList.add("empty");
      from.classList.remove("has-match");

      source.appendChild(createSourceItem(name));
    }
  }

  /* ------------------------------------------
     UI BUTTONS
  ------------------------------------------- */

  // Zwijanie puli osób
  togglePool.addEventListener("click", () => {
    const collapsed = sourceWrapper.classList.toggle("collapsed");
    togglePool.textContent = collapsed ? "▲" : "▼";
  });

  // Dodaj ON/OFF
  btnAddToggle.addEventListener("click",()=>{
    addArea.classList.toggle("hidden");
    btnAddToggle.textContent = addArea.classList.contains("hidden")
      ? "Dodaj OFF" : "Dodaj ON";
  });

  topAddBtn.addEventListener("click",()=>{
    const name = topInput.value.trim();
    if (!name) return;
    addPerson(name);
    topInput.value = "";
  });

  function addPerson(name){
    if (![...targets.querySelectorAll("strong")].some(x => x.textContent===name)){
      targets.appendChild(createTargetCard(name));
    }
    source.appendChild(createSourceItem(name));
    save();
  }

  btnDeleteToggle.addEventListener("click",()=>{
    deleteMode = !deleteMode;
    btnDeleteToggle.textContent = deleteMode ? "Usuwanie ON" : "Usuwanie OFF";
    document.body.classList.toggle("deleting", deleteMode);
  });

  btnReset.addEventListener("click",()=>{
    if (!confirm("Zresetować wszystko?")) return;
    localStorage.removeItem(STORAGE);
    source.innerHTML = "";
    targets.innerHTML = "";
  });

  /* INIT */
  load();
});
