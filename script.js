document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("item-input");
  const addBtn = document.getElementById("create-button");
  const sourceList = document.getElementById("source-list");
  const targetArea = document.getElementById("target-area");

  let dragged = null;

  /* ======================================================
        LOCAL STORAGE — ZAPIS / ODCZYT
  ====================================================== */

  function saveState() {
    const data = {
      source: [...sourceList.querySelectorAll(".source-item")].map(el =>
        el.querySelector(".name").textContent),
      
      targets: [...targetArea.querySelectorAll(".target-card")].map(card => {
        const name = card.querySelector("strong").textContent;
        const match = card.querySelector(".match-item");
        return { name, match: match ? match.textContent : null };
      })
    };
    localStorage.setItem("konfigurator-state", JSON.stringify(data));
  }

  function loadState() {
    const raw = localStorage.getItem("konfigurator-state");
    if (!raw) return;

    const data = JSON.parse(raw);

    data.source.forEach(name => {
      sourceList.appendChild(createSourceItem(name));
    });

    data.targets.forEach(obj => {
      const card = createTargetCard(obj.name);
      if (obj.match) {
        const dz = card.querySelector(".drop-zone");
        createMatchElement(dz, obj.match);
      }
      targetArea.appendChild(card);
    });
  }

  /* ======================================================
          TWORZENIE ELEMENTÓW
  ====================================================== */

  function createSourceItem(name) {
    const el = document.createElement("div");
    el.className = "source-item";

    const label = document.createElement("span");
    label.className = "name";
    label.textContent = name;

    const del = document.createElement("span");
    del.className = "delete";
    del.textContent = "✕";
    del.addEventListener("click", () => removePerson(name));

    el.appendChild(label);
    el.appendChild(del);

    enableTouchDrag(el);
    return el;
  }

  function createTargetCard(name) {
    const card = document.createElement("div");
    card.className = "target-card";

    const label = document.createElement("strong");
    label.textContent = name;

    const del = document.createElement("span");
    del.className = "delete";
    del.textContent = "✕";
    del.addEventListener("click", () => removePerson(name));

    const drop = document.createElement("div");
    drop.className = "drop-zone";

    enableDropZone(drop);

    card.appendChild(label);
    card.appendChild(drop);
    card.appendChild(del);

    return card;
  }

  function createMatchElement(dropZone, name) {
    const el = document.createElement("div");
    el.className = "match-item";
    el.textContent = name;

    enableTouchDrag(el);
    dropZone.appendChild(el);
  }

  /* ======================================================
          USUWANIE OSOBY
  ====================================================== */

  function removePerson(name) {

    [...sourceList.querySelectorAll(".source-item")].forEach(item => {
      if (item.querySelector(".name").textContent === name) item.remove();
    });

    [...targetArea.querySelectorAll(".target-card")].forEach(card => {
      if (card.querySelector("strong").textContent === name) card.remove();
    });

    [...document.querySelectorAll(".match-item")].forEach(m => {
      if (m.textContent === name) m.remove();
    });

    saveState();
  }

  /* ======================================================
          TOUCH DRAG (iPhone SAFE)
  ====================================================== */

  function enableTouchDrag(el) {
    el.addEventListener("touchstart", () => {
      dragged = el;
      el.style.opacity = "0.4";
    });

    el.addEventListener("touchmove", (e) => {
      e.preventDefault(); 
      const t = e.touches[0];
      const over = document.elementFromPoint(t.clientX, t.clientY);

      document.querySelectorAll(".drop-zone")
        .forEach(z => z.classList.remove("over"));

      const dz = over?.closest(".drop-zone");
      if (dz) dz.classList.add("over");
    });

    el.addEventListener("touchend", (e) => {
      el.style.opacity = "1";
      const t = e.changedTouches[0];
      const over = document.elementFromPoint(t.clientX, t.clientY);
      const dz = over?.closest(".drop-zone");

      if (dz && !dz.querySelector(".match-item")) {

        if (dragged.classList.contains("source-item")) {
          createMatchElement(dz, dragged.querySelector(".name").textContent);
          dragged.remove();
        }

        else if (dragged.classList.contains("match-item")) {
          dz.appendChild(dragged);
        }
      }

      document.querySelectorAll(".drop-zone")
        .forEach(z => z.classList.remove("over"));

      dragged = null;
      saveState();
    });
  }

  function enableDropZone(drop) {
    drop.addEventListener("dragover", e => e.preventDefault());
  }

  /* ======================================================
          DODAWANIE OSOBY
  ====================================================== */

  function addItem() {
    const name = input.value.trim();
    if (!name) return;

    sourceList.appendChild(createSourceItem(name));
    targetArea.appendChild(createTargetCard(name));

    input.value = "";
    saveState();
  }

  addBtn.addEventListener("click", addItem);

  /* ======================================================
          START
  ====================================================== */

  loadState();
});
