const DEFAULT_CONFIG = {
  rows: 4,
  cols: 4,
  blockSize: 4,
  blankCharacter: " ",
  difficultyLevel: 10, // The higher the number, more random moves are made on startup
  directions: ["Up", "Down", "Left", "Right"],
};

let moves = 0;

function increaseMoves() {
  moves++;
}

function clearScreen() {
  console.log("\n".repeat(process.stdout.rows));
}

function outputBoard(board, config, error = "", eventGenerator = "bot") {
  clearScreen();
  let output = `
+---------------------------------------------------+
|                 SLIDING PUZZLE GAME               |
|                                                   |
|   Instructions:                                   |
|     Use the arrow keys to move the blocks around. | 
|     Try to get the blocks in order.               |
|                                                   |
|     Press Ctrl + C to quit at anytime.            |
|                                                   |
+---------------------------------------------------+
  
  
  
  
`;

  for (let i = 0; i < config.cols; i++) {
    output = output.concat(
      `${i === 0 ? "| " : ""}${Array.from(
        { length: config.blockSize },
        () => "-"
      ).join("")} | ${i === config.cols - 1 ? "\n" : ""}`
    );
  }

  board.map((entry, index) => {
    output = output.concat(
      `${
        entry.label.toString().length === 1
          ? `|    ${entry.label}`
          : `|   ${entry.label}`
      }${index % config.cols === config.cols - 1 ? " |\n" : " "}`
    );
    if (index - 1 === config.cols) output.concat("/n");
  });

  for (let i = 0; i < config.cols; i++) {
    output = output.concat(
      `${i === 0 ? "| " : ""}${Array.from(
        { length: config.blockSize },
        () => "-"
      ).join("")} | ${i === config.cols - 1 ? "\n" : ""}`
    );
  }

  output = output.concat(error + "\n");

  // Print board to terminal
  console.log(output);

  // Won?
  if (eventGenerator === "user" && checkIfUserWon(board, config) === true) {
    console.log(`You win! 🎉 (Took ${moves} moves)`);
    process.exit();
  }
}

function checkIfUserWon(board, config) {
  const { board: originalBoard } = createBoard(config);
  for (let rowIndex = 0; rowIndex < config.rows; rowIndex++) {
    for (let colIndex = 0; colIndex < config.cols; colIndex++) {
      if (
        board.find((entry) => entry.row === rowIndex && entry.col === colIndex)
          .label !==
        originalBoard.find(
          (entry) => entry.row === rowIndex && entry.col === colIndex
        ).label
      )
        return false;
    }
  }

  return true;
}

function handleArrowEvent(board, config, direction, eventGenerator = "bot") {
  const blankBlock = board.find(
    (entry) => entry.label === DEFAULT_CONFIG.blankCharacter
  );
  let error = "";

  switch (direction) {
    case "Up":
      const upBlock = board.find(
        (entry) =>
          entry.row === blankBlock.row - 1 && entry.col === blankBlock.col
      );
      if (upBlock) {
        blankBlock.label = upBlock.label;
        upBlock.label = DEFAULT_CONFIG.blankCharacter;
        if (eventGenerator === "user") increaseMoves();
      } else {
        error = "No block above";
      }
      break;
    case "Down":
      const downBlock = board.find(
        (entry) =>
          entry.row === blankBlock.row + 1 && entry.col === blankBlock.col
      );
      if (downBlock) {
        blankBlock.label = downBlock.label;
        downBlock.label = DEFAULT_CONFIG.blankCharacter;
        if (eventGenerator === "user") increaseMoves();
      } else {
        error = "No block below";
      }
      break;
    case "Left":
      const leftBlock = board.find(
        (entry) =>
          entry.row === blankBlock.row && entry.col === blankBlock.col - 1
      );
      if (leftBlock) {
        blankBlock.label = leftBlock.label;
        leftBlock.label = DEFAULT_CONFIG.blankCharacter;
        if (eventGenerator === "user") increaseMoves();
      } else {
        error = "No block to the left";
      }
      break;
    case "Right":
      const rightBlock = board.find(
        (entry) =>
          entry.row === blankBlock.row && entry.col === blankBlock.col + 1
      );
      if (rightBlock) {
        blankBlock.label = rightBlock.label;
        rightBlock.label = DEFAULT_CONFIG.blankCharacter;
        if (eventGenerator === "user") increaseMoves();
      } else {
        error = "No block to the right";
      }
      break;
  }

  outputBoard(
    board,
    config,
    eventGenerator === "system" ? "" : error,
    eventGenerator
  );
}

function setKeyboardEvents(board, config) {
  var stdin = process.stdin;

  // without this, we would only get streams once enter is pressed
  stdin.setRawMode(true);

  // resume stdin in the parent process (node app won't quit all by itself
  // unless an error or process.exit() happens)
  stdin.resume();

  // i don't want binary, do you?
  stdin.setEncoding("utf8");

  // on any data into stdin
  stdin.on("data", function (key) {
    switch (key) {
      case "\u001B\u005B\u0041":
        handleArrowEvent(board, config, "Up", "user");
        break;
      case "\u001B\u005B\u0042":
        handleArrowEvent(board, config, "Down", "user");
        break;
      case "\u001B\u005B\u0044":
        handleArrowEvent(board, config, "Left", "user");
        break;
      case "\u001B\u005B\u0043":
        handleArrowEvent(board, config, "Right", "user");
        break;
    }

    // ctrl-c
    if (key === "\u0003") {
      process.exit();
    }
  });
}

function createBoard(startUpConfig) {
  const config = { ...DEFAULT_CONFIG, ...startUpConfig };
  const { rows, cols } = config;
  const board = [];

  // Setup board
  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    for (let colIndex = 0; colIndex < cols; colIndex++) {
      board.push({
        label:
          rows * rowIndex + colIndex + 1 === rows * cols
            ? DEFAULT_CONFIG.blankCharacter
            : rows * rowIndex + colIndex + 1,
        row: rowIndex,
        col: colIndex,
      });
    }
  }

  return { config, board };
}

function randomizeBoard(board, config) {
  const numberOfMoves = Math.floor(config.difficultyLevel * Math.random() + 1);
  for (let i = 0; i < numberOfMoves; i++) {
    const randomDirection =
      config.directions[Math.floor(config.directions.length * Math.random())];
    handleArrowEvent(board, config, randomDirection);
  }
}

function start(startUpConfig = {}) {
  const { config, board } = createBoard(startUpConfig);

  randomizeBoard(board, config);
  outputBoard(board, config);
  setKeyboardEvents(board, config);
}

start();
