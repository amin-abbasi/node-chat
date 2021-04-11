const mongoose = require('mongoose') 
const Boom     = require('@hapi/boom')

module.exports = (app) => {

  const Schema   = mongoose.Schema
  const ObjectId = Schema.Types.ObjectId
  
  // Add your own attributes in schema
  const schema = new Schema({
    email : { type: String, unique: true },
    name : { type: String, required: true, unique: true },
    name : { type: String },
    rooms : { type: [ String ] },
    defaultRoom : { type: String },
    lastMessageId : { type: ObjectId },
  }, 
  {
    // strict: false,  // To allow database in order to save Mixed type data in DB
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  })

  // Choose your own model name
  const user = (mongoose.models && mongoose.models.User) ? mongoose.models.User : mongoose.model('User', schema)

  return class User extends user {


    static getOrCreate(username) {
      return User.list({ username: username })
        .then(user => {
          if(user.length == 0) return User.create({ username: username })
          return user[0]
        })
    }

    // Options i.e.: { checkKeys: false }
    static create(data, options) {
      data.deletedAt = null
      const user = new User(data)
      return options ? user.save(options) : user.save()
    }

    static details (userId) {
      return User.findById(userId)
        .then(user => {
          if(!user || user._doc.deletedAt) throw Boom.notFound('User not found.')
          return user._doc
        })
    }

    static list (query = {}) {
      query.deletedAt = null
      return User.find(query)
        .then(result => {
          return {
            total: result.length,
            list: result
          }
        })
    }

    static update (query, data) {
      return User.findOneAndUpdate(query, data, { new: true })
    }

    static updateById (userId, data) {
      return User.details(userId)
        .then(() => {
          return User.findByIdAndUpdate(userId, data, { new: true })
        })
    }

    static delete (userId) {
      return User.details(userId)
        .then(() => {
          return User.findByIdAndUpdate(userId, { deletedAt: new Date }, { new: true })
        })
    }

    static restore (userId) {
      return User.details(userId)
        .then(() => {
          return User.findByIdAndUpdate(userId, { deletedAt: null }, { new: true })
        })
    }
  }

}
