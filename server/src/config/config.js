const yml = require('yml')
const _   = require('lodash')

const helpers  = yml.load(`${__dirname}/helpers.yml`)
const defaults = yml.load(`${__dirname}/defaults.yml`)

module.exports = _.merge(helpers, defaults)
