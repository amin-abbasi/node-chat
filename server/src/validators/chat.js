const { celebrate, Joi, errors } = require('celebrate')
const _      = require('lodash')
Joi.objectId = () => Joi.string().regex(/^[0-9a-fA-F]{24}$/)

module.exports = (app, configs) => {
  return {
    
    broadcast: {
      body: {
        message: Joi.string().required().description('Message to broadcast')
      },
      query: {}
    },

    send: {
      body: {
        room : Joi.string().required().description('Room Name'),
        name : Joi.string().required().description('User Name'),
        message : Joi.string().required().description('Message to send')
      },
      query: {}
    },

    details: {
      params: {
        userId: Joi.objectId().required().description('User ID')
      },
      query: {}
    },

    receive: {
      query: {
        room : Joi.string().required().description('Room Name')
      }
    }
    
  }
}
