document.addEventListener("DOMContentLoaded", () => {
  const itemInput = document.getElementById("item-input");
  const createButton = document.getElementById("create-button");
  const sourceList = document.getElementById("source-list");
  const targetArea = document.getElementById("target-area");

  let dragged = null;

  /* ============================
        LOCAL STORAGE
  ============================ */
  function saveState() {
    const data = {
      source: [...sourceList.querySelectorAll(".source-item")].map(el => el.textContent),
      targets: [...targetArea.querySelectorAll(".target-card")].map(card => {
        const name = card.querySelector("strong").textContent;
        const match = card.querySelector(".match-item");
        return { name, match: match ? match.textContent : null };
      })
    };
    localStorage.setItem("konfigurator-data", JSON.stringify(data));
  }

  function loadState() {
    const raw = localStorage.getItem("konfigurator-data");
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

  /* ============================
        ELEMENTY
  ============================ */

  function createSourceItem(name) {
    const el = document.createElement("div");
    el.className = "source-item";
    el.textContent = name;

    enableTouchDrag(el);

    return el;
  }

  function createTargetCard(name) {
    const card = document.createElement("div");
    card.className = "target-card";

    const label = document.createElement("strong");
    label.textContent = name;

    const drop = document.createElement("div");
    drop.className = "drop-zone";

    enableDropZone(drop);

    card.appendChild(label);
    card.appendChild(drop);

    return card;
  }

  function createMatchElement(dropZone, name) {
    const el = document.createElement("div");
    el.className = "match-item";
    el.textContent = name;

    enableTouchDrag(el);

    dropZone.appendChild(el);
  }

  /* ============================
         TOUCH DRAG & DROP
  ============================ */

  function enableTouchDrag(el) {
    el.addEventListener("touchstart", (e) => {
      dragged = el;
      el.style.opacity = "0.4";
    });

    el.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const target = document.elementFromPoint(t.clientX, t.clientY);
      document.querySelectorAll(".drop-zone").forEach(z => z.classList.remove("over"));

      const dz = target?.closest(".drop-zone");
      if (dz) dz.classList.add("over");
    });

    el.addEventListener("touchend", (e) => {
      el.style.opacity = "1";

      const t = e.changedTouches[0];
      const target = document.elementFromPoint(t.clientX, t.clientY);
      const drop = target?.closest(".drop-zone");

      if (drop && !drop.querySelector(".match-item")) {
        // jeśli przenosimy z puli 1
        if (dragged.classList.contains("source-item")) {
          createMatchElement(drop, dragged.textContent);
          dragged.remove();
        }
        // jeśli przenosimy przypisany element
        else if (dragged.classList.contains("match-item")) {
          drop.appendChild(dragged);
        }
      }

      document.querySelectorAll(".drop-zone").forEach(z => z.classList.remove("over"));

      dragged = null;

      saveState();
    });
  }

  function enableDropZone(drop) {
    drop.addEventListener("dragover", (e) => e.preventDefault());
  }

  /* ============================
        DODAWANIE NOWEJ OSOBY
  ============================ */

  function addItem() {
    const name = itemInput.value.trim();
    if (!name) return;

    sourceList.appendChild(createSourceItem(name));
    targetArea.appendChild(createTargetCard(name));

    itemInput.value = "";

    saveState();
  }

  createButton.addEventListener("click", addItem);

  /* ============================
        START
  ============================ */
  loadState();
});
