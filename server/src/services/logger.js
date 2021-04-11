// initialize our logger (in our case, winston + papertrail)

const winston = require('winston') 
const expressWinston = require('express-winston') 
// const winstonPapertrail = require('winston-papertrail') 

module.exports = (server, config) => {

  const logFormat = winston.format.printf((info) => {
    return `[${info.timestamp}] ${JSON.stringify(info.meta)} ${info.level}: ${info.message}`
  })

  server.use(
    expressWinston.logger({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: `${__dirname}/logs/app.log` })
      ],
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        winston.format.json(),
        logFormat
      ),
      meta: true,
      expressFormat: true,
      colorize: true,
    })
  )
  return server
}
