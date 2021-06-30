const path = require('path');

const FILES = {
  '/': '../frontend/index.html',
  '/play': '../frontend/play.html',

  '/scene.png': '../frontend/images/scene.png',
  '/spritesheet.png': '../frontend/images/spritesheet.png',

  '/core.js': '../common/koala-town-core.js',
  '/interactions.js': '../frontend/interactions.js',

  '/styles.css': '../frontend/styles.css',
};

module.exports = {
  setupFiles: (app, express) => {
    Object.entries(FILES).forEach(([resource, file]) => {
      app.get(resource, (req, res) => {
        res.sendFile(path.resolve(file));
      });
    });
  },
}
