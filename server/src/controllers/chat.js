module.exports = (app, configs) => {

  const Message = require('../models/message')(app, configs)

  return {
    broadcast(req, res, next) {
      app.io.emit('updateChatInfo', 'SERVER', req.body.message)
      // res.send({message: req.body.message})
    },
    send(req, res, next) {
      return Message.create(req.body)
        .then(result => {
          // res.result = result
          // next(res)
          res.send(result)
        })
        .catch(err => { console.log('---------- Send Message ERROR: ', err); next(err) })
    },
    receive(req, res, next) {
      return Message.list({ room: req.query.room })
        .then(result => {
          // res.result = result
          // next(res)
          res.send(result)
        })
        .catch(err => { console.log('---------- Recieve Message ERROR: ', err); next(err) })
    },
    details(req, res, next) {
      return Message.list({ name: req.params.userId })
        .then(result => {
          // res.result = result
          // next(res)
          res.send(result)
        })
        .catch(err => { console.log('---------- Message Details ERROR: ', err); next(err) })
    }
  }
}