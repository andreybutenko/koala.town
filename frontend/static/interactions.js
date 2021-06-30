const CANVAS_FONT_SIZE = 16;
const ANIMATION_ALT_TIME = 0.08;

// Redirect to homepage if accessed webpage directly
if (!document.referrer.includes('localhost') && !document.referrer.includes('koala.town')) {
  window.location.replace('/');
}

let gameState = {
  players: [],
};

window.addEventListener('load', function() {
  const core = window.core;

  const sprites = new Image();
  sprites.src = '/static/images/spritesheet.png'
  const background = new Image();
  background.src = '/static/images/scene.png';

  let canvas;
  let ctx;
  let socket;
  let lastTick;

  /** Sets up canvas and onClick listener */
  function onLoad() {
    // Connect to socket server
    socket = io();
    const requestedPlayerName = window.location.search.split('=')[1];
    socket.emit(core.EVENT.ADD_PLAYER, { name: requestedPlayerName });
    Object.entries(core.EVENT).forEach(([eventType, eventTypeMesssage]) => {
      socket.on(eventTypeMesssage, eventData => {
        console.log({
          eventTypeMesssage, eventData, gameState
        });
        gameState = core.processEvent(eventTypeMesssage, eventData, gameState);
        console.log('New game state', gameState);
      });
    });

    // Setup canvas
    canvas = document.getElementById('canvas');
    canvas.addEventListener('click', onCanvasClick);
  
    canvas.setAttribute('width', GAME_WIDTH);
    canvas.setAttribute('height', GAME_HEIGHT);
  
    ctx = canvas.getContext('2d');
    ctx.font = `${CANVAS_FONT_SIZE}px Arial`;
    window.requestAnimationFrame(tick);

    // Setup actions
    Object.keys(core.ACTIONS.chat).forEach(categoryName => {
      addToolbarCategory(categoryName, core.ACTIONS.chat[categoryName], sendChat);
    });
    addToolbarCategory('Dance', core.ACTIONS.dances, startDance);
  }

  /**
   * Callback for when user clicks the canvas. Move to the clicked location.
   * @param {Event} e Event object from click event.
   */
  function onCanvasClick(e) {
    const eventData = {
      x: e.offsetX - core.DSP_SPRITE_SIZE / 2,
      y: e.offsetY - core.DSP_SPRITE_SIZE / 2
    }
    socket.emit(core.EVENT.SET_TARGET, eventData);
  }

  /**
   * Make player dance.
   * @param {String} dance Name of dance to dancce.
   */
  function startDance(dance) {
    socket.emit(core.EVENT.SET_DANCE, { dance });
  }

  /**
   * Send a chat message to be displayed to other players.
   * @param {String} message Message to send.
   */
  function sendChat(message) {
    socket.emit(core.EVENT.SEND_CHAT, { message });
  }

  /**
   * Callback to perform animations and render players.
   * @param {DOMHighResTimeStamp} timestamp Timestamp from requestAnimationFrame().
   */
  function tick(timestamp) {
    const deltaTime = (timestamp - lastTick) / 1000;
    lastTick = timestamp;
    ctx.drawImage(background, 0, 0);

    gameState = core.updatePlayerStates(deltaTime, gameState);

    gameState.players.forEach(drawPlayer);
    window.requestAnimationFrame(tick);
  }

  /**
   * Add a category of action to the toolbar and set up listeners so that user can interact.
   * @param {String} categoryName Name of category.
   * @param {String[]} options Array of option items within category.
   * @param {Function} onClick Callback function to call be called when an option item is clicked
   *  with the option item text as a parameter.
   */
   function addToolbarCategory(categoryName, options, onClick) {
    const toolbar = document.getElementById('toolbar');
    const chatMenu = document.getElementById('chat-menu');

    const categoryButton = document.createElement('button');
    categoryButton.innerText = categoryName;
    categoryButton.addEventListener('click', () => showActionCategory(categoryName));
    toolbar.appendChild(categoryButton);

    const categoryList = document.createElement('ul');
    categoryList.id = `list-${categoryName}`;
    options.forEach(chatOption => {
      const optionButton = document.createElement('button');
      optionButton.innerText = chatOption;
      optionButton.addEventListener('click', () => {
        hideVisibleActionCategory();
        onClick(chatOption);
      });

      const optionListItem = document.createElement('li');
      optionListItem.append(optionButton);
      categoryList.appendChild(optionListItem);
    });

    const cancelButton = document.createElement('button');
    cancelButton.classList.add('cancel-btn');
    cancelButton.innerText = 'Cancel';
    cancelButton.addEventListener('click', hideVisibleActionCategory);
    const cancelListItem = document.createElement('li');
    cancelListItem.append(cancelButton);
    categoryList.appendChild(cancelListItem);

    chatMenu.appendChild(categoryList);
  }

  /** Hide current action category list if any are open. */
  function hideVisibleActionCategory() {
    const visibleActionCategory = document.querySelector('#chat-menu ul.visible');
    if (visibleActionCategory) {
      visibleActionCategory.classList.remove('visible');
    }
  }

  /**
   * Show an action category list with the given name.
   * @param {String} categoryName Name of the action list to show.
   */
  function showActionCategory(categoryName) {
    hideVisibleActionCategory();
    document.querySelector(`#chat-menu ul#list-${categoryName}`).classList.add('visible');
  }

   /**
   * Draw a player's sprite, name, and chat bubble if there is a message to show.
   * @param {Player} player Player to draw.
   */
    function drawPlayer(player) {
      const srcX = (player.dance === core.DANCE.NONE)
        ? core.DIR_TO_SPRITE_MAP[player.walkDirection]
        : core.DANCE_TO_SPRITE_MAP[player.dance] + Object.keys(core.DIR_TO_SPRITE_MAP).length;
      const srcY = player.animationAlt ? 1 : 0;
  
      ctx.drawImage(sprites,
        srcX * core.SRC_SPRITE_SIZE,
        srcY * core.SRC_SPRITE_SIZE,
        core.SRC_SPRITE_SIZE,
        core.SRC_SPRITE_SIZE,
        player.x,
        player.y,
        core.DSP_SPRITE_SIZE,
        core.DSP_SPRITE_SIZE
      );
  
      ctx.fillStyle = '#000000';
      const nameWidth = ctx.measureText(player.name).width;
      ctx.fillText(player.name,
        player.x + (core.DSP_SPRITE_SIZE - nameWidth) / 2, player.y + core.DSP_SPRITE_SIZE);
  
      if (player.chatMessage) {
        drawChat(player.chatMessage,
          player.x + core.DSP_SPRITE_SIZE / 2, player.y - CANVAS_FONT_SIZE + 15);
      }
    }
  
    /**
     * Draw a chat bubble at a position.
     * @param {String} message Message to display in the chat bubble.
     * @param {number} centerX X-position of the center of the chat bubble.
     * @param {number} centerY Y-position of the center of the chat bubble.
     * @param {number} [arrowSize=5] Size of the arrow of the chat bubble.
     * @param {number} [paddingX=12] Horizontal padding of the chat bubble.
     * @param {number} [paddingY=10] Vertical padding of the chat bubble.
     */
    function drawChat(message, centerX, centerY, arrowSize = 5, paddingX = 12, paddingY = 10) {
      const chatWidth = ctx.measureText(message).width;
  
      const top = centerY - CANVAS_FONT_SIZE - paddingY + 4;
      const bottom = centerY + paddingY;
      const left = centerX - chatWidth / 2 - paddingX;
      const right = centerX + chatWidth / 2 + paddingX;
  
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
  
      ctx.beginPath();
      ctx.moveTo(centerX + arrowSize, bottom);
      ctx.lineTo(centerX, bottom + 1.5 * arrowSize);
      ctx.lineTo(centerX - arrowSize, bottom);
      ctx.lineTo(left + paddingX, bottom);
      ctx.lineTo(left + paddingX, bottom);
      ctx.quadraticCurveTo(left, bottom, left, bottom - paddingY);
      ctx.lineTo(left, top + paddingY);
      ctx.quadraticCurveTo(left, top, left + paddingX, top);
      ctx.lineTo(right - paddingX, top);
      ctx.quadraticCurveTo(right, top, right, top + paddingY);
      ctx.lineTo(right, bottom - paddingY);
      ctx.quadraticCurveTo(right, bottom, right - paddingX, bottom);
      ctx.lineTo(centerX + arrowSize, bottom);
      ctx.fill();
      ctx.stroke();
  
      ctx.fillStyle = '#000000';
      ctx.fillText(message, centerX - chatWidth / 2, centerY);
    }

  onLoad();
});