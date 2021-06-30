const core = require('../common/koala-town-core.js');

let gameState = {
  players: [],
};

let io = null;

function processEvent(eventName, eventData, initiatingPlayerName) {
  if (eventName === core.EVENT.SYNC) {
    return;
  }

  // Process event on server, then emit to all clients
  const completeEventData = {
    name: initiatingPlayerName,
    ...eventData,
  }
  gameState = core.processEvent(eventName, completeEventData, gameState)
  io.emit(eventName, completeEventData);

  // For server, move player to target instantly
  if (eventName === core.EVENT.SET_TARGET) {
    gameState = core.updatePlayerAttrs(initiatingPlayerName, {
      x: eventData.x,
      y: eventData.y,
    }, gameState);
  }

  // For server, dismiss chat instantly
  if (eventName === core.EVENT.SET_TARGET) {
    gameState = core.updatePlayerAttrs(initiatingPlayerName, {
      chatMessage: null,
    }, gameState);
  }
}

function setupSockets(io_) {
  io = io_;

  io.on('connection', (socket) => {
    let connectionName = null;
    socket.emit(core.EVENT.SYNC, gameState);

    socket.on(core.EVENT.ADD_PLAYER, (eventData) => {
      if (connectionName !== null || !eventData || !eventData.name) {
        return;
      }

      const { name } = eventData;

      console.log(`Setting up player ${name}`);
      let nameSuffix = '';
      if (core.isCurrentPlayer(name, gameState)) {
        nameSuffix = 2;
        while (core.isCurrentPlayer(`${name} ${nameSuffix}`, gameState)) {
          nameSuffix++;
        }
      }

      connectionName = (nameSuffix === '') ? name : `${name} ${nameSuffix}`;
      processEvent(core.EVENT.ADD_PLAYER, {}, connectionName);
    });

    socket.on('disconnect', () => {
      if (!connectionName) {
        return;
      }

      console.log(`${connectionName}: disconnected`);
      processEvent(core.EVENT.REMOVE_PLAYER, {}, connectionName);
    });

    socket.on(core.EVENT.SET_TARGET, (eventData) => {
      if (!connectionName || !eventData || !eventData.x || !eventData.y) {
        return;
      }

      const { x, y } = eventData;

      console.log(`${connectionName}: move to ${x}, ${y}`);
      processEvent(core.EVENT.SET_TARGET, { x, y }, connectionName);
    });

    socket.on(core.EVENT.SEND_CHAT, (eventData) => {
      if (!connectionName || !eventData || !eventData.message) {
        return;
      }

      const { message } = eventData;

      console.log(`${connectionName}: chat "${message}"`);
      // TODO reject unacceptable chat messages
      processEvent(core.EVENT.SEND_CHAT, { message }, connectionName);
    });

    socket.on(core.EVENT.SET_DANCE, (eventData) => {
      if (!connectionName || !eventData || !eventData.dance) {
        return;
      }

      const { dance } = eventData;

      console.log(`${connectionName}: dance "${dance}"`);
      if (!core.ACTIONS.dances.includes(dance)) {
        console.log(`${connectionName}: rejected dance "${dance}"`);
        return;
      }
      processEvent(core.EVENT.SET_DANCE, { dance }, connectionName);
    })
  });
}

module.exports = { setupSockets };
