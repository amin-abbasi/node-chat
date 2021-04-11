const mongoose = require('mongoose') 
const Boom     = require('@hapi/boom')

module.exports = (app) => {

  const Schema   = mongoose.Schema
  const ObjectId = Schema.Types.ObjectId
  
  // Add your own attributes in schema
  const schema = new Schema({
    name : { type: String, required: true },
    parties : { type: [ObjectId], required: true },
    lastMessageId : { type: ObjectId, required: true },
  }, 
  {
    // strict: false,  // To allow database in order to save Mixed type data in DB
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  })

  // Choose your own model name
  const chat = (mongoose.models && mongoose.models.Chat) ? mongoose.models.Chat : mongoose.model('Chat', schema)

  return class Chat extends chat {

    // Options i.e.: { checkKeys: false }
    static create(data, options) {
      data.deletedAt = null
      const chat = new Chat(data)
      return options ? chat.save(options) : chat.save()
    }

    static details (chatId) {
      return Chat.findById(chatId)
        .then(chat => {
          if(!chat || chat._doc.deletedAt) throw Boom.notFound('Chat not found.')
          return chat._doc
        })
    }

    static list (query = {}) {
      query.deletedAt = null
      return Chat.find(query)
        .then(result => {
          return {
            total: result.length,
            list: result
          }
        })
    }

    static update (query, data) {
      return Chat.findOneAndUpdate(query, data, { new: true })
    }

    static updateById (chatId, data) {
      return Chat.details(chatId)
        .then(() => {
          return Chat.findByIdAndUpdate(chatId, data, { new: true })
        })
    }

    static delete (chatId) {
      return Chat.details(chatId)
        .then(() => {
          return Chat.findByIdAndUpdate(chatId, { deletedAt: new Date }, { new: true })
        })
    }

    static restore (chatId) {
      return Chat.details(chatId)
        .then(() => {
          return Chat.findByIdAndUpdate(chatId, { deletedAt: null }, { new: true })
        })
    }
  }

}
