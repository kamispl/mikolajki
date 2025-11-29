document.addEventListener("DOMContentLoaded", () => {

  const itemInput = document.getElementById("item-input");
  const createButton = document.getElementById("create-button");
  const sourceList = document.getElementById("source-list");
  const targetArea = document.getElementById("target-area");
  const editToggleButton = document.getElementById("edit-toggle-button");

  let isEditMode = false;
  let dragged = null;

  const KEY_SOURCE = "mk_source";
  const KEY_TARGET = "mk_target";

  const escapeHtml = s => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const cssEscape = s => s.replace(/"/g, '\\"');


  /* ===================================
     TWORZENIE ELEMENTÓW
  =================================== */

  function createSourceItem(name) {
    const li = document.createElement("li");
    li.className = "source-item";
    li.dataset.name = name;
    li.textContent = name;
    li.setAttribute("draggable", "true");

    const del = document.createElement("button");
    del.className = "small-delete";
    del.textContent = "×";
    del.onclick = () => { if (isEditMode) removePerson(name); };
    li.appendChild(del);

    li.addEventListener("dragstart", e => {
      if (isEditMode) return e.preventDefault();
      dragged = li;
      e.dataTransfer.setData("text", `source:${name}`);
    });

    li.addEventListener("dragend", () => dragged = null);

    return li;
  }


  function createTargetCard(person) {
    const li = document.createElement("li");
    li.className = "target-card";
    li.dataset.person = person;

    const header = document.createElement("div");
    header.className = "target-header";
    header.textContent = person;

    const drop = document.createElement("div");
    drop.className = "drop-zone";
    drop.dataset.targetFor = person;

    drop.addEventListener("dragover", e => {
      if (isEditMode) return;
      e.preventDefault();
      drop.classList.add("over");
    });

    drop.addEventListener("dragleave", () => drop.classList.remove("over"));

    drop.addEventListener("drop", e => {
      drop.classList.remove("over");
      if (isEditMode) return;

      const data = e.dataTransfer.getData("text");
      if (!data) return;

      const existing = drop.querySelector(".match-item");

      // źródło → docelowa karta
      if (data.startsWith("source:")) {
        const name = data.split(":")[1];

        // 1:1 ograniczenia — brak alertów
        if (existing) return;
        if (isAlreadyAssigned(name)) return;

        createMatchElement(drop, name);
        removeSourceByName(name);
        saveData();
        return;
      }

      // SWAP match → match
      if (data.startsWith("match:")) {
        const [name, fromPerson] = data.split(":")[1].split("|");
        const draggedEl = findMatchElement(fromPerson, name);
        if (!draggedEl) return;

        if (existing) {
          // wymiana miejsc
          const parentFrom = draggedEl.parentElement;
          drop.appendChild(draggedEl);
          parentFrom.appendChild(existing);
        } else {
          drop.appendChild(draggedEl);
        }

        saveData();
      }
    });

    li.appendChild(header);
    li.appendChild(drop);

    return li;
  }


  function createMatchElement(dropZone, name) {
    const span = document.createElement("span");
    span.className = "match-item";
    span.dataset.name = name;
    span.setAttribute("draggable", "true");
    span.textContent = name;

    const rm = document.createElement("button");
    rm.className = "remove-match";
    rm.textContent = "×";
    rm.onclick = () => {
      if (!isEditMode) return;
      span.remove();
      if (!sourceList.querySelector(`[data-name="${cssEscape(name)}"]`)) {
        sourceList.appendChild(createSourceItem(name));
      }
      saveData();
    };
    span.appendChild(rm);

    span.addEventListener("dragstart", e => {
      if (isEditMode) return e.preventDefault();
      const fromCard = span.closest(".target-card").dataset.person;
      dragged = span;
      e.dataTransfer.setData("text", `match:${name}|${fromCard}`);
    });

    span.addEventListener("dragend", () => dragged = null);

    dropZone.appendChild(span);
  }


  /* ===================================
     UTILS
  =================================== */

  function findMatchElement(person, name) {
    return targetArea.querySelector(
      `.target-card[data-person="${cssEscape(person)}"] .match-item[data-name="${cssEscape(name)}"]`
    );
  }

  function isAlreadyAssigned(name) {
    return !!document.querySelector(`.match-item[data-name="${cssEscape(name)}"]`);
  }

  function removeSourceByName(name) {
    const el = sourceList.querySelector(`[data-name="${cssEscape(name)}"]`);
    if (el) el.remove();
  }


  /* ===================================
     GŁÓWNE FUNKCJE
  =================================== */

  function addNewItem() {
    const name = itemInput.value.trim();
    if (!name) return;

    // nie pozwalaj dodać duplikatu, ale bez alertów
    if (sourceList.querySelector(`[data-name="${cssEscape(name)}"]`)) return;
    if (targetArea.querySelector(`[data-person="${cssEscape(name)}"]`)) return;

    sourceList.appendChild(createSourceItem(name));
    targetArea.appendChild(createTargetCard(name));

    itemInput.value = "";
    saveData();
  }


  function removePerson(name) {
    removeSourceByName(name);

    const card = targetArea.querySelector(`[data-person="${cssEscape(name)}"]`);
    if (card) {
      const assigned = card.querySelector(".match-item");
      if (assigned) {
        const assignedName = assigned.dataset.name;
        if (!sourceList.querySelector(`[data-name="${cssEscape(assignedName)}"]`)) {
          sourceList.appendChild(createSourceItem(assignedName));
        }
      }
      card.remove();
    }

    saveData();
  }


  /* ===================================
     STORAGE
  =================================== */

  function saveData() {
    const sources = [...sourceList.children].map(li => li.dataset.name);

    const targets = {};
    targetArea.querySelectorAll(".target-card").forEach(card => {
      const person = card.dataset.person;
      const matchEl = card.querySelector(".match-item");
      targets[person] = matchEl ? matchEl.dataset.name : null;
    });

    localStorage.setItem(KEY_SOURCE, JSON.stringify(sources));
    localStorage.setItem(KEY_TARGET, JSON.stringify(targets));
  }


  function loadData() {
    sourceList.innerHTML = "";
    targetArea.innerHTML = "";

    const sources = JSON.parse(localStorage.getItem(KEY_SOURCE) || "[]");
    const targets = JSON.parse(localStorage.getItem(KEY_TARGET) || "{}");

    const allPeople = new Set([...sources, ...Object.keys(targets)]);

    allPeople.forEach(p => {
      targetArea.appendChild(createTargetCard(p));
    });

    sources.forEach(s => {
      sourceList.appendChild(createSourceItem(s));
    });

    for (const person in targets) {
      const assigned = targets[person];
      if (!assigned) continue;

      const drop = targetArea.querySelector(
        `.target-card[data-person="${cssEscape(person)}"] .drop-zone`
      );

      if (drop) {
        createMatchElement(drop, assigned);
        removeSourceByName(assigned);
      }
    }
  }


  /* ===================================
     EVENTY
  =================================== */

  createButton.onclick = addNewItem;
  itemInput.addEventListener("keypress", e => {
    if (e.key === "Enter") addNewItem();
  });

  editToggleButton.onclick = () => {
    isEditMode = !isEditMode;
    document.body.classList.toggle("edit-mode", isEditMode);
  };


  /* INIT */
  loadData();

});
