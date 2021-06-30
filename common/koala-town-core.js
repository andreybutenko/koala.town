/** Enum of possible dances for player sprite */
const DANCE = {
  NONE: 'NONE',
  VERY_HAPPY: 'Very Happy',
  DAB: 'Dab',
  CHEER: 'Cheer Leader',
  WAVE: 'Wave',
  SLEEP: 'Sleep',
};

/** Map of dances to location in sprite sheet */
const DANCE_TO_SPRITE_MAP = {
  [DANCE.VERY_HAPPY]: 0,
  [DANCE.DAB]: 1,
  [DANCE.CHEER]: 2,
  [DANCE.WAVE]: 3,
  [DANCE.SLEEP]: 4,
};

/** Enum of possible directions of player sprite */
const DIR = {
  NONE: 'NONE',
  FORWARD: 'FORWARD',
  BACKWARD: 'BACKWARD',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};

/** Map of directions to location in sprite sheet */
const DIR_TO_SPRITE_MAP = {
  [DIR.NONE]: 0,
  [DIR.LEFT]: 1,
  [DIR.RIGHT]: 2,
  [DIR.FORWARD]: 3,
  [DIR.BACKWARD]: 4,
};

/** Events that can be emitted or processed */
const EVENT = {
  SYNC: 'sync',
  ADD_PLAYER: 'add player',
  REMOVE_PLAYER: 'remove player',
  SET_TARGET: 'set target',
  SEND_CHAT: 'send chat',
  SET_DANCE: 'set dance',
};

/** Time for a chat message to be dismissed (seconds) */
const CHAT_DISMISS_TIME = 5;

/** Speed of player sprite movement (pixels per second) */
const MOVE_SPEED = 100;

/** Source size of sprites */
const SRC_SPRITE_SIZE = 135;
/** Display size of sprites */
const DSP_SPRITE_SIZE= 128;
/** Height of game view */
const GAME_HEIGHT = 600;
/** Width of game view */
const GAME_WIDTH = 800;

/** Starting x coordinate for player sprites */
const SPRITE_START_X = (GAME_WIDTH - DSP_SPRITE_SIZE) / 2;
const SPRITE_START_Y = (GAME_HEIGHT - DSP_SPRITE_SIZE) / 2;

/** Actions a player can take */
const ACTIONS = {
  chat: {
    'Greetings': [
      'Hi!',
      'Hello',
      'Hey!',
      'Goodbye',
      'See you',
    ],
    'Mood': [
      'How are you doing?',
      'Great!',
      'Good',
      'Terrible',
      'Big mood',
      'That\'s a mood',
      'Oh no',
      'Happy to hear that',
    ],
    'Animals': [
      'What are your favorite animals?',
      'Koalas, of course!',
      'Cats',
      'Dogs',
      'Ponies',
      'Turtles',
      'Frogs',
      'Fish',
      'Bottlebrush Yowies',
      'Birds',
      'Birds are not real!!',
      'Mowgli',
    ],
    'Emojis': [
      '😊',
      '😢',
      '✨',
      '🐨',
      '👌',
      '🤠',
    ],
    'Interact': [
      'Let\'s dance!',
      'Nice moves!',
      'Keep it up!',
      '#dab',
      'I\'m sleepy...',
      '\'Sko Dawgs!!',
    ],
  },
  dances: [
    'Very Happy',
    'Dab',
    'Cheer Leader',
    'Wave',
    'Sleep',
  ],
};

/**
 * Return a value clamped to be between min and max, inclusive.
 * @param {number} val Value to clamp.
 * @param {number} min Minimum value (inclusive).
 * @param {number} max Maximum value (inclusive).
 * @returns {number} Value clamped to be between min and max, inclusive.
 */
function clamp(val, min, max) {
  if (val < min) {
    return min;
  } else if (val > max) {
    return max;
  } else {
    return val;
  }
}

/**
 * Returns cloned object
 * @param {Object} obj Object
 * @returns {Object} Cloned object
 */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Checks if player currently exists in game state
 * @param {String} name Name of player to check for in game state
 * @param {GameState} gameState Current game state
 * @returns {Boolean} If player exists
 */
function isCurrentPlayer(name, gameState) {
  return gameState.players.map(player => player.name).includes(name);
}

/**
 * Updates a player's attributes
 * @throws Will throw user-readable error if player with given name does not currently exist in game state
 * @param {String} name Name of player
 * @param {Object} attrs Updated attributes
 * @param {GameState} gameState Current game state
 * @returns {GameState} Updated game state
 */
function updatePlayerAttrs(name, attrs, gameState) {
  const nameIndex = gameState.players.map(player => player.name).indexOf(name);
  if (nameIndex === -1) {
    throw `Player with name ${name} is not logged in`;
  }

  const newGameState = clone(gameState);
  newGameState.players[nameIndex] = {
    ...newGameState.players[nameIndex],
    ...attrs,
  };
  return newGameState;
}

/**
 * Add a player to the game state
 * @throws Will throw user-readable error if player with given name currently exists in game state
 * @param {String} name Name of player
 * @param {GameState} gameState Current game state
 * @returns {GameState} Updated game state
 */
function addPlayer(name, gameState) {
  if (isCurrentPlayer(name, gameState)) {
    throw `Player with name ${name} is already logged in`;
  }

  const newGameState = clone(gameState);
  newGameState.players.push({
    name: name,
    x: SPRITE_START_X,
    y: SPRITE_START_Y,
    targetX: SPRITE_START_X,
    targetY: SPRITE_START_Y,
    walkDirection: DIR.NONE, 
    dance: DANCE.NONE,
    animationStep: 0,
    animationAlt: false,
    chatMessage: null,
    chatDuration: 0,
  });
  return newGameState;
}

/**
 * Remove a player from the game state
 * @throws Will throw user-readable error if player with given name does not currently exist in game state
 * @param {String} name Name of player
 * @param {GameState} gameState Current game state
 * @returns {GameState} Updated game state
 */
function removePlayer(name, gameState) {
  const nameIndex = gameState.players.map(player => player.name).indexOf(name);
  if (nameIndex === -1) {
    throw `Player with name ${name} is not logged in`;
  }
  const newGameState = clone(gameState);
  newGameState.players.splice(nameIndex, 1);
  return newGameState;
}

/**
 * Updates a player's target position
 * @throws Will throw user-readable error if player with given name does not currently exist in game state
 * @param {String} name Name of player
 * @param {Integer} x Target X position
 * @param {Integer} y Target Y position
 * @param {GameState} gameState Current game state
 * @returns {GameState} Updated game state
 */
function setTargetLocation(name, x, y, gameState) {
  if (!isCurrentPlayer(name, gameState)) {
    throw `Player with name ${name} is not logged in`;
  }

  const newAttrs = {
    dance: DANCE.NONE,
    targetX: x,
    targetY: y,
  }
  return updatePlayerAttrs(name, newAttrs, gameState);
}

/**
 * Updates a player's chat message
 * @throws Will throw user-readable error if player with given name does not currently exist in game state
 * @param {String} name Name of player
 * @param {String} message Chat message
 * @param {GameState} gameState Current game state
 * @returns {GameState} Updated game state
 */
function sendChatMessage(name, message, gameState) {
  if (!isCurrentPlayer(name, gameState)) {
    throw `Player with name ${name} is not logged in`;
  }

  const newAttrs = {
    chatMessage: message,
    chatDuration: 0,
  };
  return updatePlayerAttrs(name, newAttrs, gameState);
}

/**
 * Updates a player's dance
 * @throws Will throw user-readable error if player with given name does not currently exist in game state
 * @param {String} name Name of player
 * @param {String} dance Dance
 * @param {GameState} gameState Current game state
 * @returns {GameState} Updated game state
 */
function setDance(name, dance, gameState) {
  if (!isCurrentPlayer(name, gameState)) {
    throw `Player with name ${name} is not logged in`;
  }

  const newAttrs = {
    dance: dance,
  };
  return updatePlayerAttrs(name, newAttrs, gameState);
}

/**
 * Update players' states (move towards target, dismiss chat message, advance animation frame)
 * @param {float} deltaTime Amount of time since last update (seconds)
 * @param {GameState} gameState Current game state
 * @returns {GameState} Updated game state
 */
function updatePlayerStates(deltaTime, gameState) {
  const newGameState = clone(gameState);
  newGameState.players = newGameState.players.map(player => updatePlayerState(player, deltaTime));
  return newGameState;
}

/**
 * Update a player object's state (move towards target, dismiss chat message, advance animation frame)
 * @param {Player} player Player
 * @param {float} deltaTime Amount of time since last update (seconds)
 * @returns {Player} Updated player
 */
function updatePlayerState(player, deltaTime) {
  const newPlayer = clone(player);

  // Move player
  if (player.x !== player.targetX || player.y !== player.targetY) {
    // Calculate changes in x and y, within range of move speed
    const maxMove = deltaTime * MOVE_SPEED;
    const dX = clamp(player.targetX - player.x, -maxMove, maxMove);
    const dY = clamp(player.targetY - player.y, -maxMove, maxMove);

    newPlayer.x += dX;
    newPlayer.y += dY;

    // Calculate current walk direction
    const dXBigger = Math.abs(dX) >= Math.abs(dY);

    if (dX > 0 && dXBigger) {
      newPlayer.walkDirection = DIR.RIGHT;
    }
    else if (dX < 0 && dXBigger) {
      newPlayer.walkDirection = DIR.LEFT;
    }
    else if (dY > 0 && !dXBigger) {
      newPlayer.walkDirection = DIR.FORWAD;
    }
    else if (dY < 0 && !dXBigger) {
      newPlayer.walkDirection = DIR.BACKWARD;
    }
  }
  else {
    newPlayer.walkDirection = DIR.NONE;
  }

  // Update current animation frame
  if (player.animationStep + deltaTime > ANIMATION_ALT_TIME)  {
    newPlayer.animationStep = 0;
    newPlayer.animationAlt = !player.animationAlt;
  }
  else {
    newPlayer.animationStep += deltaTime;
  }

  // Update current chat state
  if (player.chatMessage && player.chatDuration + deltaTime > CHAT_DISMISS_TIME) {
    newPlayer.chatMessage = null;
  }
  else if (player.chatMessage) {
    newPlayer.chatDuration += deltaTime;
  }

  return newPlayer;
}

/**
 * Update game state according to updated event
 * @param {String} eventName Event name
 * @param {Object} eventData Event data
 * @param {GameState} gameState Current game state
 * @returns {GameState} Updated game state
 */
function processEvent(eventName, eventData, gameState) {
  switch(eventName) {
    case EVENT.SYNC:
      return eventData;
    case EVENT.ADD_PLAYER:
      return addPlayer(eventData.name, gameState);
    case EVENT.REMOVE_PLAYER:
      return removePlayer(eventData.name, gameState);
    case EVENT.SET_TARGET:
      return setTargetLocation(eventData.name, eventData.x, eventData.y, gameState);
    case EVENT.SEND_CHAT:
      return sendChatMessage(eventData.name, eventData.message, gameState);
    case EVENT.SET_DANCE:
      return setDance(eventData.name, eventData.dance, gameState);
  }
  return gameState;
}

const coreExports = {
  DANCE,
  DANCE_TO_SPRITE_MAP,
  DIR,
  DIR_TO_SPRITE_MAP,
  EVENT,
  CHAT_DISMISS_TIME,
  MOVE_SPEED,
  SRC_SPRITE_SIZE,
  DSP_SPRITE_SIZE,
  GAME_HEIGHT,
  GAME_WIDTH,
  SPRITE_START_X,
  SPRITE_START_Y,
  ACTIONS,
  clamp,
  clone,
  isCurrentPlayer,
  updatePlayerAttrs,
  addPlayer,
  removePlayer,
  setTargetLocation,
  sendChatMessage,
  setDance,
  updatePlayerStates,
  updatePlayerState,
  processEvent,
};

if (typeof module !== 'undefined') {
  // node export
  module.exports = coreExports;
}
else {
  // browser export
  window.core = coreExports;
}
