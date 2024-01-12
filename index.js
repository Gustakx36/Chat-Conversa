import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import {} from 'dotenv/config';
import express from 'express';
import path from 'path';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'template')));

app.get('/', (req, res) => {
    res.render('../template/index');
});

const users = {};
var count = 1;
const mensagens = {};

app.get('/mensagens/:me/:user', (req, res) => {
    const me = req.params.me;
    const to = req.params.user;
    if(mensagens[`${to}${me}`] == undefined){
        if(mensagens[`${me}${to}`] != undefined){
            return res.json({mensagens: mensagens[`${me}${to}`]});
        }else{
            return;
        }
    }else{
        return res.json({mensagens: mensagens[`${to}${me}`]});
    }
})

io.on('connection', (socket) => {
    io.emit('LOGAR');
    socket.on('LOGADO', (user) => {
        if(user == null){
            console.log('Não exite!');
            return;
        }
        if(users[user] == undefined){
            users[user] = {id: count, nome: user, sessionId : socket.id, amigos: []};
            count += 1;
        }else{
            users[user].sessionId = socket.id;
        }
        io.to(socket.id).emit('LOGADOCALLBACK', users[user]);
        console.log(users)
    });
    socket.on('NEWMSG', (msg) => {
        if(msg.to == msg.from){
            return;
        }
        if(users[msg.to] == undefined){
            console.log('Não exite!');
            return;
        }
        if(mensagens[`${msg.to}${msg.from}`] == undefined){
            if(mensagens[`${msg.from}${msg.to}`] == undefined){
                console.log(msg);
                users[msg.from].amigos.push(msg.to);
                users[msg.to].amigos.push(msg.from);
                mensagens[`${msg.to}${msg.from}`] = [msg];
                io.to(users[msg.from].sessionId).emit('RECEIVE', {from: msg.from, msg: msg.msg, amigos: users[msg.from].amigos, status: true});
                return io.to(users[msg.to].sessionId).emit('CALLBACK', {from: msg.from, msg: msg.msg, user: users[msg.to]});
            }else{
                mensagens[`${msg.from}${msg.to}`].push(msg);
            }
        }else{
            mensagens[`${msg.to}${msg.from}`].push(msg);
        }
        io.to(users[msg.from].sessionId).emit('RECEIVE', {from: msg.from,  msg: msg.msg, status: false});
        io.to(users[msg.to].sessionId).emit('CALLBACK',  {from: msg.from, msg: msg.msg});
    });
    socket.on('NEWFRIEND', (newUser) => {
        if(users[newUser.to] == undefined){
            return;
        }
        users[newUser.from].amigos.push(newUser.to);
        users[newUser.to].amigos.push(newUser.from);
        mensagens[`${newUser.from}${newUser.to}`] = [];
        io.to(users[newUser.from].sessionId).emit('RECEIVE', {from: newUser.from, amigos: users[newUser.from].amigos, status: true});
        return io.to(users[newUser.to].sessionId).emit('CALLBACK', {from: newUser.from, user: users[newUser.to]});
    })
    socket.on('disconnect', () => {
        console.log(`${socket.id} -> desconectou`);
    });
});

server.listen(3000);