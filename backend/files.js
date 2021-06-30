const path = require('path');

const FILES = {
  '/': '../frontend/index.html',
  '/favicon.png': '../frontend/static/images/favicon.png',
  '/play': '../frontend/play.html',
  '/core.js': '../common/koala-town-core.js',
};

module.exports = {
  setupFiles: (app, express) => {
    Object.entries(FILES).forEach(([resource, file]) => {
      app.get(resource, (req, res) => {
        res.sendFile(path.resolve(file));
      });
    });

    app.use('/static', express.static('../frontend/static'))
  },
}
