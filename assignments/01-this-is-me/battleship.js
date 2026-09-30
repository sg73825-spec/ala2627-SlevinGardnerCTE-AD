(() => {
  const size = 8;
  const letters = 'ABCDEFGH';
  const shipTypes = [
    { name: 'Carrier', length: 4, model: 'carrier' },
    { name: 'Destroyer', length: 3, model: 'destroyer' },
    { name: 'Submarine', length: 3, model: 'submarine' },
    { name: 'Patrol boat', length: 2, model: 'patrol' }
  ];
  const setupBoard = document.querySelector('#setup-board');
  const enemyBoard = document.querySelector('#enemy-board');
  const playerBoard = document.querySelector('#player-board');
  const setupBoardWrap = document.querySelector('#setup-board-wrap');
  const setupControls = document.querySelector('#setup-controls');
  const battleBoards = document.querySelector('#battle-boards');
  const battleInfo = document.querySelector('#battle-info');
  const statusText = document.querySelector('#status');
  const shipToPlace = document.querySelector('#ship-to-place');
  const orientationButton = document.querySelector('#orientation');
  const startButton = document.querySelector('#start-battle');
  const shotsLeftText = document.querySelector('#shots-left');
  const fleetStatus = document.querySelector('#fleet-status');
  const fleetList = document.querySelector('#fleet-list');
  const newGameButton = document.querySelector('#new-game');

  let playerFleet;
  let enemyFleet;
  let playerShots;
  let enemyShots;
  let nextShipIndex;
  let horizontal;
  let mode;
  let volleyShots;
  let turnNumber;

  function cellsFor(row, col, length, isHorizontal) {
    return Array.from({ length }, (_, offset) => `${row + (isHorizontal ? 0 : offset)},${col + (isHorizontal ? offset : 0)}`);
  }

  function overlaps(cells, fleet) {
    const occupied = new Set(fleet.flatMap((ship) => ship.cells));
    return cells.some((cell) => occupied.has(cell));
  }

  function randomFleet() {
    const fleet = [];
    shipTypes.forEach((type) => {
      let cells;
      do {
        const isHorizontal = Math.random() < .5;
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        cells = cellsFor(row, col, type.length, isHorizontal);
      } while (cells.some((cell) => {
        const [row, col] = cell.split(',').map(Number);
        return row >= size || col >= size;
      }) || overlaps(cells, fleet));
      fleet.push({ ...type, cells });
    });
    return fleet;
  }

  function coordinateLabel(cell) {
    const [row, col] = cell.split(',').map(Number);
    return `${letters[col]}${row + 1}`;
  }

  function makeBoard(board, kind) {
    board.replaceChildren();
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const cellKey = `${row},${col}`;
        const button = document.createElement('button');
        button.className = 'cell';
        button.type = 'button';
        button.dataset.cell = cellKey;
        button.setAttribute('aria-label', `${coordinateLabel(cellKey)}: untried`);
        button.addEventListener('click', () => {
          if (kind === 'setup') placeShip(row, col);
          if (kind === 'enemy') fireAtEnemy(cellKey, button);
        });
        board.append(button);
      }
    }
  }

  function drawFleet(board, fleet) {
    board.querySelectorAll('.ship-model').forEach((model) => model.remove());
    fleet.forEach((ship) => {
      const [row, col] = ship.cells[0].split(',').map(Number);
      const firstCell = board.querySelector(`[data-cell="${ship.cells[0]}"]`);
      const lastCell = board.querySelector(`[data-cell="${ship.cells.at(-1)}"]`);
      if (!firstCell || !lastCell) return;
      const horizontalShip = row === Number(ship.cells.at(-1).split(',')[0]);
      const model = document.createElement('img');
      model.className = `ship-model${horizontalShip ? '' : ' ship-model--vertical'}`;
      model.src = `assets/ship-${ship.model}.svg`;
      model.alt = '';
      model.setAttribute('aria-hidden', 'true');
      model.title = ship.name;
      const boardBox = board.getBoundingClientRect();
      const firstBox = firstCell.getBoundingClientRect();
      const lastBox = lastCell.getBoundingClientRect();
      const cellWidth = firstBox.width;
      const cellHeight = firstBox.height;
      const length = ship.cells.length;
      const shipWidth = lastBox.right - firstBox.left - 6;
      model.style.width = `${shipWidth}px`;
      model.style.height = `${cellHeight * 0.72}px`;
      if (horizontalShip) {
        model.style.left = `${firstBox.left - boardBox.left + 3}px`;
        model.style.top = `${firstBox.top - boardBox.top + (cellHeight - cellHeight * 0.72) / 2}px`;
      } else {
        const centerX = firstBox.left - boardBox.left + cellWidth / 2;
        const centerY = (firstBox.top + lastBox.bottom) / 2 - boardBox.top;
        model.style.left = `${centerX - shipWidth / 2}px`;
        model.style.top = `${centerY - cellHeight * 0.72 / 2}px`;
        model.style.transform = 'rotate(90deg)';
      }
      board.append(model);
    });
  }

  function updateSetup() {
    const nextShip = shipTypes[nextShipIndex];
    if (nextShip) {
      shipToPlace.textContent = `${nextShip.name} · ${nextShip.length} spaces`;
      statusText.textContent = `Place your ${nextShip.name} (${nextShip.length} spaces). Choose a direction, then select a starting square.`;
      startButton.disabled = true;
    } else {
      shipToPlace.textContent = 'Fleet ready!';
      statusText.textContent = 'Your fleet is ready. Start the battle when you’re set!';
      startButton.disabled = false;
    }
  }

  function placeShip(row, col) {
    if (mode !== 'placing' || nextShipIndex >= shipTypes.length) return;
    const ship = shipTypes[nextShipIndex];
    const cells = cellsFor(row, col, ship.length, horizontal);
    if (cells.some((cell) => {
      const [r, c] = cell.split(',').map(Number);
      return r >= size || c >= size;
    })) {
      statusText.textContent = `That ${ship.name} would extend past the edge. Pick another starting square.`;
      return;
    }
    if (overlaps(cells, playerFleet)) {
      statusText.textContent = 'Those squares are already taken. Try a different spot.';
      return;
    }
    playerFleet.push({ ...ship, cells });
    cells.forEach((cell) => {
      const square = setupBoard.querySelector(`[data-cell="${cell}"]`);
      square.classList.add('ship');
      square.textContent = '■';
      square.setAttribute('aria-label', `${coordinateLabel(cell)}: ${ship.name}`);
    });
    drawFleet(setupBoard, playerFleet);
    const listItem = fleetList.querySelector(`[data-ship="${ship.name}"]`);
    listItem.classList.add('placed');
    listItem.querySelector('span').textContent = '✓';
    nextShipIndex += 1;
    updateSetup();
  }

  function sunkCount(fleet, shots) {
    return fleet.filter((ship) => ship.cells.every((cell) => shots.has(cell))).length;
  }

  function updateBattleInfo() {
    shotsLeftText.textContent = mode === 'enemy-turn' ? 'Enemy is firing…' : `${4 - volleyShots} shots left this turn`;
    fleetStatus.textContent = `You ${sunkCount(enemyFleet, playerShots)} / 4 · Enemy ${sunkCount(playerFleet, enemyShots)} / 4`;
  }

  function endGame(didWin) {
    mode = 'over';
    statusText.textContent = didWin
      ? `Victory! Your fleet won after ${turnNumber} ${turnNumber === 1 ? 'turn' : 'turns'}. Start a new game to play again.`
      : `Your fleet was sunk. The enemy wins. Start a new game and try again!`;
    enemyBoard.querySelectorAll('button').forEach((cell) => { cell.disabled = true; });
  }

  function fireAtEnemy(key, button) {
    if (mode !== 'player-turn' || playerShots.has(key)) return;
    playerShots.add(key);
    volleyShots += 1;
    button.disabled = true;
    const ship = enemyFleet.find((vessel) => vessel.cells.includes(key));
    if (ship) {
      button.classList.add('hit');
      button.textContent = '✦';
      const [firstRow] = ship.cells[0].split(',').map(Number);
      const [lastRow] = ship.cells.at(-1).split(',').map(Number);
      const direction = firstRow === lastRow ? 'horizontal' : 'vertical';
      button.classList.add('ship-damaged', `ship-damaged--${direction}`);
      const damageMark = document.createElement('span');
      damageMark.className = 'ship-damage';
      damageMark.setAttribute('aria-hidden', 'true');
      button.append(damageMark);
      button.setAttribute('aria-label', `${coordinateLabel(key)}: hit on enemy ${ship.name}`);
      const isSunk = ship.cells.every((cell) => playerShots.has(cell));
      statusText.textContent = isSunk ? `You sank the enemy ${ship.name}!` : `Hit at ${coordinateLabel(key)}!`;
    } else {
      button.classList.add('miss');
      button.textContent = '·';
      button.setAttribute('aria-label', `${coordinateLabel(key)}: miss`);
      statusText.textContent = `Splash at ${coordinateLabel(key)}. ${4 - volleyShots} ${4 - volleyShots === 1 ? 'shot' : 'shots'} left this turn.`;
    }
    updateBattleInfo();
    if (sunkCount(enemyFleet, playerShots) === shipTypes.length) {
      endGame(true);
      updateBattleInfo();
    } else if (volleyShots === 4) {
      mode = 'enemy-turn';
      statusText.textContent = 'Volley complete. The enemy is preparing its four shots…';
      updateBattleInfo();
      window.setTimeout(computerTurn, 500);
    }
  }

  function computerTurn() {
    if (mode !== 'enemy-turn') return;
    updateBattleInfo();
    statusText.textContent = 'Enemy turn! Your fleet is under fire…';
    const available = Array.from({ length: size * size }, (_, index) => `${Math.floor(index / size)},${index % size}`).filter((cell) => !enemyShots.has(cell));
    const targets = [];
    for (let shot = 0; shot < 4 && available.length; shot += 1) {
      const index = Math.floor(Math.random() * available.length);
      targets.push(available.splice(index, 1)[0]);
    }
    let shotIndex = 0;
    function fireNext() {
      if (mode !== 'enemy-turn') return;
      const key = targets[shotIndex];
      enemyShots.add(key);
      const square = playerBoard.querySelector(`[data-cell="${key}"]`);
      square.disabled = true;
      const ship = playerFleet.find((vessel) => vessel.cells.includes(key));
      if (ship) {
        square.classList.add('hit');
        square.textContent = '✦';
        square.setAttribute('aria-label', `${coordinateLabel(key)}: your ship hit`);
        statusText.textContent = `Enemy hit your fleet at ${coordinateLabel(key)}.`;
      } else {
        square.classList.add('miss');
        square.textContent = '·';
        square.setAttribute('aria-label', `${coordinateLabel(key)}: enemy missed`);
        statusText.textContent = `Enemy missed at ${coordinateLabel(key)}.`;
      }
      updateBattleInfo();
      if (sunkCount(playerFleet, enemyShots) === shipTypes.length) {
        endGame(false);
        updateBattleInfo();
        return;
      }
      shotIndex += 1;
      if (shotIndex < targets.length) window.setTimeout(fireNext, 400);
      else {
        mode = 'player-turn';
        volleyShots = 0;
        turnNumber += 1;
        updateBattleInfo();
        statusText.textContent = `Your turn ${turnNumber}! Choose up to four new target squares.`;
      }
    }
    window.setTimeout(fireNext, 400);
  }

  function startBattle() {
    if (playerFleet.length !== shipTypes.length || mode !== 'placing') return;
    mode = 'player-turn';
    enemyFleet = randomFleet();
    playerShots = new Set();
    enemyShots = new Set();
    volleyShots = 0;
    turnNumber = 1;
    makeBoard(enemyBoard, 'enemy');
    makeBoard(playerBoard, 'player');
    playerFleet.forEach((ship) => ship.cells.forEach((cell) => {
      const square = playerBoard.querySelector(`[data-cell="${cell}"]`);
      square.classList.add('ship');
      square.textContent = '■';
      square.setAttribute('aria-label', `${coordinateLabel(cell)}: your ${ship.name}`);
    }));
    setupControls.hidden = true;
    setupBoardWrap.hidden = true;
    battleBoards.hidden = false;
    battleInfo.hidden = false;
    drawFleet(playerBoard, playerFleet);
    document.querySelector('#game-title').textContent = 'Battle stations';
    statusText.textContent = 'Your turn 1! Choose up to four target squares on the enemy grid.';
    updateBattleInfo();
  }

  function newGame() {
    playerFleet = [];
    enemyFleet = [];
    playerShots = new Set();
    enemyShots = new Set();
    nextShipIndex = 0;
    horizontal = true;
    mode = 'placing';
    volleyShots = 0;
    turnNumber = 1;
    orientationButton.textContent = 'Direction: Horizontal';
    orientationButton.setAttribute('aria-pressed', 'true');
    fleetList.querySelectorAll('li').forEach((item) => {
      item.classList.remove('placed');
      item.querySelector('span').textContent = item.dataset.ship === 'Carrier' ? '4' : item.dataset.ship === 'Patrol boat' ? '2' : '3';
    });
    setupControls.hidden = false;
    setupBoardWrap.hidden = false;
    battleBoards.hidden = true;
    battleInfo.hidden = true;
    document.querySelector('#game-title').textContent = 'Fleet setup';
    makeBoard(setupBoard, 'setup');
    updateSetup();
  }

  orientationButton.addEventListener('click', () => {
    horizontal = !horizontal;
    orientationButton.textContent = `Direction: ${horizontal ? 'Horizontal' : 'Vertical'}`;
    orientationButton.setAttribute('aria-pressed', String(horizontal));
    statusText.textContent = `Direction set to ${horizontal ? 'horizontal' : 'vertical'}. Select a starting square for your ship.`;
  });
  startButton.addEventListener('click', startBattle);
  newGameButton.addEventListener('click', newGame);
  window.addEventListener('resize', () => {
    if (playerFleet?.length) {
      if (!setupBoardWrap.hidden) drawFleet(setupBoard, playerFleet);
      if (!battleBoards.hidden) drawFleet(playerBoard, playerFleet);
    }
  });
  newGame();
})();
