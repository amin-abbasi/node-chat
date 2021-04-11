const { celebrate, Joi, errors } = require('celebrate')

module.exports = (app, configs) => {

  const Chat = require('./controllers/chat')(app, configs)
  const ChatValidator = require('./validators/chat')(app, configs)

  // Healthcheck Endpoint
  app.get('/healthcheck', celebrate({ query: {} }), (req, res) => { res.send('200') })

  // Home Page - for testing purposes
  app.get('/v1/home', celebrate({ query: {} }), (req, res) => { res.send('Hello!') })

  app.post('/v1/chat/broadcast', celebrate(ChatValidator.broadcast), Chat.broadcast)
  app.post('/v1/chat', celebrate(ChatValidator.send), Chat.send)
  app.get('/v1/chat', celebrate(ChatValidator.receive), Chat.receive)
  app.get('/v1/chat/:userId', celebrate(ChatValidator.details), Chat.details) 

  app.use(errors())
  return app
}
