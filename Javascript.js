function handleDragStart(event) {
  sourceCell = event.target.parentNode;
  event.dataTransfer.setData("text/plain", "");
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleDrop(event) {
  event.preventDefault();

  const sourceIndex = Array.from(boardContainer.children).indexOf(sourceCell);
  const targetCell = event.target.closest(".board-container > div");
  const targetIndex = Array.from(boardContainer.children).indexOf(targetCell);

  if (!isLegalMove(sourceIndex, targetIndex)) {
    return;
  }

  // Update the game state
  const move = { from: sourceIndex, to: targetIndex };
  gameState = makeMove(gameState, move);

  // TODO:  renderBoard with flipped mode instead of flipBoard() which will change the game state
  renderBoard();

  if (checkEndGame()) {
    return;
  }

  // AI play here
  if (gameState.slice(-1) === "R") {
    setTimeout(() => {
      //At lower depths it prioritizes taking opponent pieces.
      // At higher depths it starts valuing board position more.
      // It chooses moves that open up opportunities and avoid traps several turns ahead.
      // DEPTH is 3 here
      const move = bestMove(gameState, 1); // depth 1 is the fastest
      gameState = makeMove(gameState, move);
      renderBoard();
      if (checkEndGame()) {
        return;
      }
    }, 500);
  }
}

function showRules() {
  const rulesElement = document.getElementById("rules");
  if (rulesElement) {
    rulesElement.remove();
  } else {
    const rulesElement = document.createElement("div");
    rulesElement.id = "rules";
    rulesElement.style.marginTop = "10px";
    rulesElement.style.marginLeft = "auto";
    rulesElement.innerHTML =
      "Sphinx: Moves 1 square forward, backward, left, and right<br><br>" +
      "Centaur: Jumps forward, backward, left, and right 2 squares (can jump over other pieces)<br><br>" +
      "Yeti: Can move diagonally up to 3 squares.<br><br>" +
      "Gnome: Can move any direction diagonally one square<br><br>" +
      "All Pieces Take Other Pieces By Moving Onto Them";

    rulesButton.insertAdjacentElement("afterend", rulesElement);
  }
}

function evaluateBoard(inGameState) {
  let score = 0;
  // Iterate over the game board and add/subtract values based on piece type and color
  for (let i = 0; i < num_rows; i++) {
    for (let j = 0; j < num_columns; j++) {
      const pieceChar = inGameState[i * num_columns + j];
      score += pieceValues[pieceChar] || 0;
    }
  }
  return score;
}

function getAllPossibleMoves(inGameState) {
  let possibleMoves = [];
  const currentPlayer = inGameState.slice(-1);
  const currentPlayerIsRed = currentPlayer === "R"; // true if red, false if blue

  // Loop over all cells in the game state
  for (let i = 0; i < inGameState.length - 1; i++) {
    // gameState.length - 1 to ignore the last character indicating the current player
    const piece = inGameState[i];

    // Skip the iteration if the cell is empty
    if (piece === ".") {
      continue;
    }

    const pieceIsRed = piece === piece.toUpperCase(); // true if red, false if blue

    // If this piece belongs to the current player
    if (
      (currentPlayerIsRed && pieceIsRed) ||
      (!currentPlayerIsRed && !pieceIsRed)
    ) {
      // Check all cells as potential target cells
      for (let j = 0; j < inGameState.length - 1; j++) {
        if (i !== j && isLegalMove(i, j)) {
          possibleMoves.push({ from: i, to: j });
        }
      }
    }
  }
  return possibleMoves;
}

function makeMove(gameState, move) {
  let { from, to } = move; // Destructure move object to get 'from' and 'to' indices
  let piece = gameState[from];

  // Move piece from source to target and leave source cell empty
  let newState = gameState.substr(0, to) + piece + gameState.substr(to + 1);
  newState = newState.substr(0, from) + "." + newState.substr(from + 1);

  // Switch the current player
  newState = newState.slice(0, -1) + (newState.slice(-1) === "B" ? "R" : "B");

  return newState;
}

function minimax(inGameState, depth, isMaximizingPlayer) {
  if (depth === 5) {
    // TODO: the evaluateBoard should consider red or blue
    // console.log("Game state:", inGameState, "Score:", evaluateBoard(inGameState));
    return evaluateBoard(inGameState);
  }

  let bestValue;

  if (isMaximizingPlayer) {
    // For Red
    bestValue = -Infinity;
    for (let move of getAllPossibleMoves(inGameState)) {
      let newState = makeMove(inGameState, move);
      let value = minimax(newState, depth - 1, false);
      bestValue = Math.max(bestValue, value);
    }
    // console.log( "Best value for red:", bestValue);
  } else {
    // For Blue
    bestValue = Infinity;
    for (let move of getAllPossibleMoves(inGameState)) {
      let newState = makeMove(inGameState, move);
      let value = minimax(newState, depth - 3, true);
      bestValue = Math.min(bestValue, value);
      // console.log(
      //   "Move:",
      //   move,
      //   "Value:",
      //   value,
      //   "newscore:",
      //   evaluateBoard(newState)
      // );
    }
    // console.log( "Best value for blue:", bestValue);
  }

  return bestValue;
}

// depth 3

function bestMove(inGameState, depth) {
  let bestValue = -Infinity;
  let moveBest = null; // Initialize moveBest as null

  for (let move of getAllPossibleMoves(inGameState)) {
    let newState = makeMove(inGameState, move);
    let value = minimax(newState, depth, false);

    // Check if the move captures an opponent's piece
    const opponentPiece = inGameState[move.to];
    const currentPlayer = inGameState.slice(-1);
    const currentPlayerIsRed = currentPlayer === "R";
    const opponentPieceIsRed = opponentPiece === opponentPiece.toUpperCase();

    // If the opponent's piece is captured, choose this move
    if ((currentPlayerIsRed && !opponentPieceIsRed) || (!currentPlayerIsRed && opponentPieceIsRed)) {
      moveBest = move;
      break; // Exit the loop if a capturing move is found
    }

    if (value >= bestValue) {
      bestValue = value;
      moveBest = move;
    }
  }

  return moveBest;
}


function hasNoPieces(player) {
  const playerIsRed = player === "R";
  for (let i = 0; i < gameState.length - 1; i++) {
    const piece = gameState[i];
    if (piece !== ".") {
      const pieceIsRed = piece === piece.toUpperCase();
      if ((playerIsRed && pieceIsRed) || (!playerIsRed && !pieceIsRed)) {
        // This player still has at least one piece
        return false;
      }
    }
  }
  // No pieces of this player were found
  return true;
}

function checkEndGame() {
  if (hasNoPieces("R")) {
    turnIndicator.textContent = "Blue wins!";
    // end the game
    return true;
  } else if (hasNoPieces("B")) {
    turnIndicator.textContent = "Red wins!";
    // end the game
    return true;
  }

  // The game has not ended
  return false;
}

function renderBoard() {
  while (boardContainer.firstChild) {
    boardContainer.removeChild(boardContainer.firstChild);
  }

  for (let i = 0; i < num_rows; i++) {
    for (let j = 0; j < num_columns; j++) {
      const cell = document.createElement("div");
      cell.style.backgroundColor = (i + j) % 2 === 0 ? "purple" : "white";
      cell.style.display = "flex";
      cell.style.justifyContent = "center";
      cell.style.alignItems = "center";
      cell.style.fontSize = "20px";
      cell.style.border = "1px solid black";

      const pieceChar = gameState[i * num_columns + j];
      if (pieceChar !== ".") {
        const letterElement = document.createElement("div");
        letterElement.textContent = pieceChar.toUpperCase();
        letterElement.className = `letter letter-${pieceChar.toLowerCase()}`;
        letterElement.setAttribute("draggable", true);
        letterElement.addEventListener("dragstart", handleDragStart);

        if (pieceChar === pieceChar.toUpperCase()) {
          letterElement.style.color = "red";
        } else {
          letterElement.style.color = "blue";
        }

        cell.appendChild(letterElement);
      }

      cell.addEventListener("dragover", handleDragOver);
      cell.addEventListener("drop", handleDrop);

      boardContainer.appendChild(cell);
    }
  }

  const currentPlayer = gameState.slice(-1);
  turnIndicator.textContent =
    currentPlayer === "R" ? "Red player's turn" : "Blue player's turn";
  turnIndicator.style.color = currentPlayer === "R" ? "red" : "blue";
}

function isLegalMove(sourceIndex, targetIndex) {
  const sourceRow = Math.floor(sourceIndex / num_columns);
  const sourceCol = sourceIndex % num_columns;
  const targetRow = Math.floor(targetIndex / num_columns);
  const targetCol = targetIndex % num_columns;

  const piece = gameState[sourceIndex];
  const pieceType = piece.toLowerCase();
  const pieceColor = piece === piece.toUpperCase() ? "R" : "B";

  const targetPiece = gameState[targetIndex];

  // If the target piece is not empty and its color is the same as the source piece color, return false
  if (targetPiece !== ".") {
    const targetPieceColor =
      targetPiece === targetPiece.toUpperCase() ? "R" : "B";
    if (pieceColor === targetPieceColor) {
      return false;
    }
  }

  if (pieceColor !== gameState.slice(-1)) {
    return false;
  }

  if (sourceIndex === targetIndex) {
    return false;
  }

  const rowDistance = Math.abs(targetRow - sourceRow);
  const colDistance = Math.abs(targetCol - sourceCol);

  switch (pieceType) {
    case "s":
      if (rowDistance > 1 || colDistance > 1) {
        return false;
      }
      break;
    case "c":
      if (
        (rowDistance !== 2 || colDistance !== 0) &&
        (rowDistance !== 0 || colDistance !== 2)
      ) {
        return false;
      }
      break;
    case "y":
      // Yeti can move diagonally up to 2 squares
      if (rowDistance !== colDistance || rowDistance > 2) {
        return false;
      }

      // Yeti cannot jump over other pieces
      // Check if all cells between source and target are empty
      let rowStep = (targetRow - sourceRow) / rowDistance;
      let colStep = (targetCol - sourceCol) / colDistance;
      let checkRow = sourceRow + rowStep;
      let checkCol = sourceCol + colStep;
      while (checkRow !== targetRow && checkCol !== targetCol) {
        let checkIndex = checkRow * num_columns + checkCol;
        if (gameState[checkIndex] !== ".") {
          return false;
        }
        checkRow += rowStep;
        checkCol += colStep;
      }
      break;
    case "g":
      if (rowDistance !== 1 || colDistance !== 1) {
        return false;
      }
      break;
    default:
      return false;
  }

  return true;
}

// main program
const num_rows = 6;
const num_columns = 5;
let flipped = true;
let sourceCell;

let gameState = "CYSYC.GGG............ggg.cysycB";
// let gameState = ".YSYC.GGG.Cg..........gg.cysycR";

const pieceValues = {
  S: 10,
  s: -10,
  C: 5,
  c: -5,
  Y: 4,
  y: -4,
  G: 2,
  g: -2,
};

const outerContainer = document.createElement("div");
outerContainer.style.display = "flex";
outerContainer.style.justifyContent = "center";

const boardContainer = document.createElement("div");
boardContainer.className = "board-container";
boardContainer.style.display = "grid";
boardContainer.style.gridTemplateColumns = `repeat(${num_columns}, 50px)`;
boardContainer.style.gridTemplateRows = `repeat(${num_rows}, 50px)`;

const turnIndicator = document.createElement("p");
turnIndicator.style.fontSize = "20px";
turnIndicator.style.textAlign = "center";

const rulesButton = document.createElement("button");
rulesButton.textContent = "Rules";
rulesButton.addEventListener("click", showRules);

const rulesContainer = document.createElement("div");
rulesContainer.style.marginBottom = "10px";
rulesContainer.appendChild(rulesButton);

const gameContainer = document.createElement("div");
gameContainer.style.display = "flex";
gameContainer.style.flexDirection = "column";
gameContainer.style.alignItems = "center";
gameContainer.appendChild(rulesContainer);
gameContainer.appendChild(boardContainer);
gameContainer.appendChild(turnIndicator);

outerContainer.appendChild(gameContainer);
document.body.appendChild(outerContainer);

renderBoard();
