const express= require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage,} = require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom,} = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);
const port = process.env.PORT || 3000;

const publicDirectory = path.join(__dirname, '../public');
app.use(express.static(publicDirectory));

io.on('connection', (socket) => {
    console.log('New Websocket connection is established!');
    
    socket.on('join', (userInfo, callback) => {                //userInfo = {username, room}
        const {error, user} = addUser({id: socket.id, ...userInfo});

        if(error) {
            return callback(error);
        } else {
            socket.join(user.room);
            socket.emit('message', generateMessage('Admin: ', 'Welcome! You are connected...'));
            const name = user.username.charAt(0).toUpperCase() + user.username.slice(1);
            const chatRoom = user.room.charAt(0).toUpperCase() + user.room.slice(1);
            socket.broadcast.to(user.room).emit('message', generateMessage('Admin: ', `${name} has joined the ${chatRoom} room...`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room),
            })
            callback();
        }  
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed!');
        } else {
            io.to(user.room).emit('message', generateMessage(user.username, message));
            callback();
        }
    })

     socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        const locationURL = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, locationURL));
        callback();
    })
    
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            const name = user.username.charAt(0).toUpperCase() + user.username.slice(1);
            const chatRoom = user.room.charAt(0).toUpperCase() + user.room.slice(1);
            io.to(user.room).emit('message', generateMessage('Admin: ', `${name} has left the ${chatRoom} room...`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room),
            })
        }
        
    })
})

server.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}!`);
})

