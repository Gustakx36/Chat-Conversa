import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import {} from 'dotenv/config';
import express from 'express';
import path from 'path';
import http from 'http';
import fs from 'fs';

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

app.get('/video', (req, res) => {
    res.render('../template/video');
});

app.get('/videoRender', (req, res) => {
    const tamanho = req.headers.range;
    if(!tamanho){
        res.status(400).send('Error');
    }
    const videoPath = './template/uploads/video.mp4';
    const videoSize = fs.statSync(videoPath).size;

    const CHUNK_SIZE = 10 ** 6;
    const start = Number(tamanho.replace(/\D/g, ''));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;
    const headers = {
        'Content-Range' : `bytes ${start}-${end}/${videoSize}`,
        'Accept-Ranges' : 'bytes',
        'Content-Length' : contentLength,
        'Content-Type' : 'video/mp4'
    };
    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
});

const users = {};
const mensagens = {};

app.get('/mensagens/:me/:user/:nivel/:amais', (req, res) => {
    const me = req.params.me;
    const to = req.params.user;
    const nivel = parseInt(req.params.nivel);
    const amais = parseInt(req.params.amais);
    const mensagensPerReq = 20
    let lista;
    const inicio = (lista) => {
        return lista.length - mensagensPerReq - (mensagensPerReq * nivel) - amais;
    };
    const fim = (lista) => {
        return lista.length - 0 - (mensagensPerReq * nivel) - amais;
    };
    if(mensagens[`${to}${me}`] == undefined){
        if(mensagens[`${me}${to}`] != undefined){
            lista = mensagens[`${me}${to}`];
        }else{
            return res.json({statusFim: true});
        }
    }else{
        lista = mensagens[`${to}${me}`];
    }
    if(inicio(lista) < 0){
        return res.json({
            mensagens: lista.slice(0, fim(lista)),     
            statusFim: true
        });
    }
    return res.json({
        mensagens: lista.slice(inicio(lista), fim(lista)),     
        statusFim: false
    });
})

var count = 1;

io.on('connection', (socket) => {
    io.emit('LOGAR');
    socket.on('LOGADO', (nome) => {
        if(nome == null){
            console.log('Não exite!');
            return;
        }
        if(users[nome] == undefined){
            users[nome] = {id: count, nome: nome, sessionId : socket.id, amigos: []};
            count += 1;
        }else{
            users[nome].sessionId = socket.id;
        }
        io.to(socket.id).emit('LOGADOCALLBACK', users[nome]);
    });
    socket.on('NEWMSG', (msg) => {
        if(msg.to == msg.from || users[msg.to] == undefined){
            return;
        }
        if(mensagens[`${msg.to}${msg.from}`] == undefined){
            mensagens[`${msg.from}${msg.to}`].push(msg);
        }else{
            mensagens[`${msg.to}${msg.from}`].push(msg);
        }
        io.to(users[msg.from].sessionId).emit('RECEIVE', {from: msg.from,  msg: msg.msg});
        io.to(users[msg.to].sessionId).emit('CALLBACK',  {from: msg.from, msg: msg.msg});
    });
    socket.on('NEWFRIEND', (newFriend) => {
        if(users[newFriend.to] == undefined){
            return;
        }
        users[newFriend.from].amigos.push(newFriend.to);
        users[newFriend.to].amigos.push(newFriend.from);
        mensagens[`${newFriend.from}${newFriend.to}`] = [];
        io.to(users[newFriend.from].sessionId).emit('RECEIVE', {from: newFriend.from, amigos: users[newFriend.from].amigos, amigosUpdate: true});
        io.to(users[newFriend.to].sessionId).emit('CALLBACK', {from: newFriend.from, amigos: users[newFriend.to].amigos, amigosUpdate: true});
    })
    socket.on('disconnect', () => {
        console.log(`${socket.id} -> desconectou`);
    });
});

server.listen(3000);