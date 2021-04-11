const mongoose = require('mongoose') 
const Boom     = require('@hapi/boom')

module.exports = (app) => {

  const Schema   = mongoose.Schema
  const ObjectId = Schema.Types.ObjectId
  
  // Add your own attributes in schema
  const schema = new Schema({
    room : { type: String },
    name : { type: String },
    message : { type: String },
    deletedAt: Date
  }, 
  {
    strict: false,  // To allow database in order to save Mixed type data in DB
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  })

  // Choose your own model name
  const message = (mongoose.models && mongoose.models.Message) ? mongoose.models.Message : mongoose.model('Message', schema)

  return class Message extends message {

    // Options i.e.: { checkKeys: false }
    static create(data, options) {
      console.log('>>>>>>>>>>static create: ', data)
      // data.deletedAt = null
      const message = new Message(data)
      console.log('>>>>>>>>>>before save: ')
      return options ? message.save(options) : message.save()
    }

    static details (messageId) {
      return Message.findById(messageId)
        .then(message => {
          if(!message || message._doc.deletedAt) throw Boom.notFound('Message not found.')
          return message._doc
        })
    }

    static list (query = {}) {
      query.deletedAt = null
      return Message.find(query)
        .then(result => {
          return {
            total: result.length,
            list: result
          }
        })
    }

    static update (query, data) {
      return Message.findOneAndUpdate(query, data, { new: true })
    }

    static updateById (messageId, data) {
      return Message.details(messageId)
        .then(() => {
          return Message.findByIdAndUpdate(messageId, data, { new: true })
        })
    }

    static delete (messageId) {
      return Message.details(messageId)
        .then(() => {
          return Message.findByIdAndUpdate(messageId, { deletedAt: new Date }, { new: true })
        })
    }

    static restore (messageId) {
      return Message.details(messageId)
        .then(() => {
          return Message.findByIdAndUpdate(messageId, { deletedAt: null }, { new: true })
        })
    }
  }

}
