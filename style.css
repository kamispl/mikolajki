<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Mikołajkowy Konfigurator</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #f5f5f7;
      --card: rgba(255,255,255,0.75);
      --accent: #0a84ff;
      --radius: 16px;
      --shadow: 0 8px 24px rgba(0,0,0,0.08);
    }

    * { box-sizing: border-box; user-select: none; }

    body {
      margin: 0;
      font-family: Inter, system-ui;
      background: var(--bg);
    }

    .topbar {
      padding: 18px;
      background: rgba(255,255,255,0.7);
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }

    .container { max-width: 1100px; margin: 20px auto; padding: 0 16px; }

    .card {
      background: var(--card);
      border-radius: var(--radius);
      padding: 16px;
      box-shadow: var(--shadow);
      margin-bottom: 16px;
    }

    .input-row { display: flex; gap: 10px; }

    input {
      flex: 1;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid rgba(0,0,0,0.2);
    }

    button {
      padding: 12px 16px;
      border-radius: 12px;
      border: none;
      background: var(--accent);
      color: white;
      font-weight: 600;
    }

    /* ====== PULA 1 – OBOK SIEBIE + ZAWIJANIE ====== */
    .source-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
    }

    .source-item {
      background: white;
      padding: 10px 14px;
      border-radius: 999px;
      cursor: grab;
    }

    /* ====== PULA 2 – JEDEN POD DRUGIM ====== */
    .target-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 10px;
    }

    .target-card {
      background: white;
      border-radius: 14px;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .drop-zone {
      flex: 1;
      min-height: 40px;
      background: rgba(0,0,0,0.05);
      border-radius: 12px;
      padding: 6px;
    }

    .drop-zone.over { background: rgba(10,132,255,0.2); }

    .match-item {
      display: inline-block;
      background: var(--accent);
      color: white;
      padding: 8px 12px;
      border-radius: 999px;
      cursor: grab;
    }
  </style>
</head>
<body>

<header class="topbar">
  <h2>🎁 Mikołajkowy Konfigurator</h2>
</header>

<main class="container">

  <section class="card">
    <div class="input-row">
      <input id="item-input" placeholder="Dodaj osobę...">
      <button id="create-button">Dodaj</button>
    </div>
  </section>

  <!-- PULA 1 -->
  <section class="card">
    <h3>Pula 1 (przeciągane)</h3>
    <div id="source-list" class="source-list"></div>
  </section>

  <!-- PULA 2 -->
  <section class="card">
    <h3>Pula 2 (dopasowania)</h3>
    <div id="target-area" class="target-list"></div>
  </section>

</main>

<script>
  const input = document.getElementById('item-input');
  const addBtn = document.getElementById('create-button');
  const sourceList = document.getElementById('source-list');
  const targetArea = document.getElementById('target-area');

  let dragged = null;

  function addItem() {
    const name = input.value.trim();
    if (!name) return;

    // ====== PULA 1 ======
    const source = document.createElement('div');
    source.className = 'source-item';
    source.textContent = name;
    source.draggable = true;

    source.addEventListener('dragstart', () => dragged = source);

    sourceList.appendChild(source);

    // ====== PULA 2 ======
    const card = document.createElement('div');
    card.className = 'target-card';

    const label = document.createElement('strong');
    label.textContent = name;

    const drop = document.createElement('div');
    drop.className = 'drop-zone';

    drop.addEventListener('dragover', e => {
      e.preventDefault();
      drop.classList.add('over');
    });

    drop.addEventListener('dragleave', () => drop.classList.remove('over'));

    drop.addEventListener('drop', () => {
      drop.classList.remove('over');
      if (dragged && !drop.querySelector('.match-item')) {
        const match = document.createElement('div');
        match.className = 'match-item';
        match.textContent = dragged.textContent;
        match.draggable = true;

        match.addEventListener('dragstart', () => dragged = match);

        drop.appendChild(match);
        dragged.remove();
        dragged = null;
      }
    });

    card.appendChild(label);
    card.appendChild(drop);
    targetArea.appendChild(card);

    input.value = '';
  }

  addBtn.addEventListener('click', addItem);
</script>

</body>
</html>
