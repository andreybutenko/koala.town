module.exports = {
  setupFiles: (app) => {
    app.get('/', (req, res) => {
      res.send('<h1>Hello world</h1>');
    });
  },
}
