// Import npm modules
const _       = require('lodash')
const cors    = require('cors')
const path    = require('path')
const colors  = require('colors')
const config  = require('./config/config')
const express = require('express')
const favicon = require('serve-favicon')
const shortID = require('shortid')
require('dotenv').config()
const app = express()

// initialize middleware
app.use(cors())
app.set('trust proxy', 1)
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(__dirname))
app.use('/static', express.static('node_modules'))
app.use(favicon(path.join(__dirname, 'views', 'favicon.ico')))
app.use(require('./services/response_decorator')) // add response decorator (success & error) to system

// add logger to system
const logger = require('./services/logger')(app, config)

// --------------------------------------------- Socket io ---------------------------------------------
const User    = require('./models/user')(app)
const Chat    = require('./models/chat')(app)
const Message = require('./models/message')(app)

// add Redis
require('./services/redis')(app, config)

// require the database library (which instantiates a connection to mongodb)
require('./services/db')(config)

// add routes
require('./routes')(app, config)

const globalData = { allUsers: {}, allRooms: [] }
const http = require('http').Server(app)
const io   = require('socket.io')(http, { cors: { origin: '*' } })

// app.set('io', io)
io.sockets.on('connection', (socket) => {

  // Broadcast o all
  console.log('SOCKET-IO -- Chat connection is ONLINE!')
  io.emit('updateChatInfo', 'SERVER', 'Chat connection is ONLINE!', new Date().toLocaleString())

  // Listens for 'away' to change status
  socket.on('away', (user) => {
    console.log(`SOCKET-IO --> Room: '${user.defaultRoom}' -- '${user.name}' is AWAY!`)
  })

  // Listens for new user
  socket.on('addUser', (input) => {
    const now = new Date().toLocaleString()
    if(!input) socket.emit('updateChatInfo', 'error', 'No user info gotten.', now)
    else {
      const inputs = input.split(',')
      // TODO: base of existence check is 'name' --> it should be changed to 'email' in the future
      // Fetch Data from Redis
      // Promise.all([fetchRedisData('user:*'), fetchRedisData('room:*')])
      //   .then(([users, rooms]) => {
      //     console.log('>>>>>>>>users: ', users)
      //     if(users.find(user => user.name == input)) socket.emit('error', 'User already exists, please choose another name.')
      //     else {

      //       // Create a new user
      //       const user = {
      //         id: 'user_' + shortID.generate(),
      //         name: input,
      //         rooms: [`room-${input}`],
      //         defaultRoom: `room-${input}`,
      //         // socketId: socket.id
      //       }
      //       // save user in redis
      //       client.set(`user:${user.id}`, JSON.stringify(user))

      //       // save room in redis
      //       client.set(`room:${user.defaultRoom}`, JSON.stringify({ name: user.defaultRoom, owner: user.name }))

      //       socket.user = user

      //       globalData.allUsers[user.name] = user
      //       // globalData.allRooms.push(user.defaultRoom)
      //       // globalData.allRooms = _.uniq(globalData.allRooms)

      //       socket.join(user.defaultRoom)
      //       socket.emit('userJoined', user)
      //       socket.emit('getMessages')
      //       socket.emit('updateChatInfo', 'SERVER', `You have connected to "${user.defaultRoom}"`)
      //       socket.broadcast.to(user.defaultRoom).emit('updateChatInfo', 'SERVER', `"${user.name}" has connected to this room.`)
      //       io.emit('updateGlobalData', globalData)
      //       console.log('SOCKET-IO -- User Added: ', user)
      //     }
      //   })
      //   .catch((err) => {
      //     console.log('>>>>>>>>fetchRedisData err: ', err)
      //   })

      if(globalData.allUsers[input]) socket.emit('updateChatInfo', 'error', 'User already exists, please choose another name.', now)
      else {

        // Create a new user
        const user = {
          id: 'user_' + shortID.generate(),
          name: input,
          rooms: [`room-${input}`],
          defaultRoom: `room-${input}`,
          // socketId: socket.id
        }
        socket.user = user

        globalData.allUsers[user.name] = user
        globalData.allRooms.push(user.defaultRoom)
        globalData.allRooms = _.uniq(globalData.allRooms)

        socket.join(user.defaultRoom)
        socket.emit('userJoined', user)
        socket.emit('getMessages')
        socket.emit('updateChatInfo', 'SERVER', `You have connected to "${user.defaultRoom}"`, now)
        socket.broadcast.to(user.defaultRoom).emit('updateChatInfo', 'SERVER', `"${user.name}" has connected to this room.`, now)
        io.emit('updateGlobalData', globalData)
        console.log('SOCKET-IO -- User Added: ', user)
      }
    }

  })

  // Listens for switch default room
  socket.on('switchRoom', (oldRoom, newRoom) => {
    const now = new Date().toLocaleString()
    // if(!_.find(globalData.allRooms, (room) => { return room.name == newRoom }))
    //   return socket.emit('error', `"${newRoom}" does not exist in rooms list.`, now)
    if(newRoom == oldRoom) return socket.emit('updateChatInfo', 'error', 'You are already in this room.', now)
    // socket.leave(oldRoom)
    socket.join(newRoom)

    socket.user.defaultRoom = newRoom
    socket.user.rooms.push(newRoom)
    socket.user.rooms = _.uniq(socket.user.rooms)
    globalData.allUsers[socket.user.name] = socket.user

    socket.emit('userJoined', socket.user)
    socket.emit('updateChatInfo', 'SERVER', `You have switched your room from "${oldRoom}" and joined "${newRoom}"`, now)
    socket.broadcast.to(newRoom).emit('updateChatInfo', 'SERVER', `"${socket.user.name}" has switched to this room as default.`, now)
    socket.broadcast.to(oldRoom).emit('updateChatInfo', 'SERVER', `"${socket.user.name}" has removed this room as default.`, now)
    io.emit('updateGlobalData', globalData)
    console.log('SOCKET-IO -- User switched room: ', socket.user)
  })

  // Listens for add room
  socket.on('addRoom', (oldRoom, newRoom) => {
    const now = new Date().toLocaleString()
    if(_.find(globalData.allRooms, (room) => { return room.name == newRoom })) return socket.emit('error', `"${newRoom}" already exists in rooms list.`, now)
    if(newRoom == oldRoom) return socket.emit('error', `Room "${newRoom}" is already created in the system.`, now)
    // socket.leave(oldRoom)
    socket.join(newRoom)

    socket.user.defaultRoom = newRoom
    socket.user.rooms.push(newRoom)
    globalData.allUsers[socket.user.name] = socket.user
    globalData.allRooms.push({
      name: newRoom,
      owner: socket.user.name
    })

    socket.emit('userJoined', socket.user)
    socket.emit('updateChatInfo', 'SERVER', `You have joined a new room: "${newRoom}"`, now)
    socket.broadcast.to(oldRoom).emit('updateChatInfo', 'SERVER', `"${socket.user.name}" has removed this room as default.`, now)
    io.emit('updateGlobalData', globalData)
    console.log('SOCKET-IO -- User added a new room: ', socket.user)
  })

  // Listens for leave (remove) room
  socket.on('removeRoom', (user, removeRoom) => {
    const now = new Date().toLocaleString()
    if(!socket.user.rooms.includes(removeRoom)) return socket.emit('error', `"${removeRoom}" does not exist in user rooms list.`, now)
    // if(!_.find(globalData.allRooms, (room) => { return (room.name == removeRoom && room.owner == user.name) }))
    //   return socket.emit('error', `User can not delete this room.`, now)

    socket.leave(removeRoom)
    socket.user.rooms = _.pull(socket.user.rooms, removeRoom)
    if(user.defaultRoom == removeRoom) {
      if(socket.user.rooms.length > 0) socket.user.defaultRoom = socket.user.rooms[0]
      else delete socket.user.defaultRoom
    }
    globalData.allUsers[socket.user.name] = socket.user

    socket.emit('userJoined', socket.user)
		socket.emit('updateChatInfo', 'SERVER', `You have left "${removeRoom}"`, now)
    socket.broadcast.to(removeRoom).emit('updateChatInfo', 'SERVER', `${socket.user.name} has left this room.`, now)
    io.emit('updateGlobalData', globalData)
    console.log('SOCKET-IO -- User switched room: ', socket.user)
  })

	// When the client emits 'sendMessage', this listens and executes
	socket.on('sendMessage', (user) => {
    if(!user.name) return
    const now = new Date().toLocaleString()
    socket.emit('updateChatInfo', user.name, user.message, now)
    socket.broadcast.to(user.room).emit('updateChatInfo', user.name, user.message, now)
    console.log('SOCKET-IO -- User send chat --> ', socket.user)
	})

	// When the user disconnects.. perform this
	socket.on('disconnect', () => {
    console.log('>>>>>>>>> globalData.allUsers: ', globalData.allUsers)
	  if(socket.user && socket.user.name) delete globalData.allUsers[socket.user.name]
    // socket.broadcast.to(socket.user.defaultRoom).emit('updateChatInfo', 'SERVER',
    //       `"${socket.user.name}" has disconnected from room: "${socket.user.defaultRoom}"`)
    io.emit('updateGlobalData', globalData)
    const name = _.has(socket, 'user.name') ? socket.user.name : '---'
    console.log('SOCKET-IO -- Connection is OFFLINE! -- name: ', name)
	})

  socket.on('error', (err) => {
    socket.emit('updateChatInfo', 'error', err)
    console.log('SOCKET-IO ERROR: ', err)
  })
})

// app.io = io
// app.get('/', (req, res) => { res.sendFile(path.join(__dirname + '/views/index.html')) })
//------------------------------------------------------------------------------------------------

// listen on the designated port found in the configuration
http.listen(process.env.SERVER_PORT || 4000, err => {
  if (err) {
    logger.error(err)
    process.exit(1)
  }

  // output the status of the app in the terminal
  const url = `${process.env.SERVER_PROTOCOL || 'http'}://${process.env.SERVER_HOST || 'localhost'}:${process.env.SERVER_PORT || 4000}`
  console.info(colors.green(`API is now running on ${colors.cyan(url)} in ${process.env.NODE_ENV || 'development'} mode`))
})

module.exports = http
