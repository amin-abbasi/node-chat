// --------------------------------------------- Socket io - Help ---------------------------------------------
// send to current request socket client
// socket.emit('message', "this is a test");
 
// sending to all clients, include sender
// io.sockets.emit('message', "this is a test");     OR     io.emit('message', 'this is a test');
 
// sending to all clients except sender
// socket.broadcast.emit('message', "this is a test");
 
// sending to all clients in 'game' room(channel) except sender
// socket.broadcast.to('game').emit('message', 'nice game');
 
// sending to all clients in 'game' room(channel), include sender
// io.sockets.in('game').emit('message', 'cool game');      OR      io.in('...')...     OR     io.to('...')...
 
// sending to individual socketid
// io.sockets.socket(socketid).emit('message', 'for your eyes only');



module.exports = (app, config) => {

}