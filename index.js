import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import {} from 'dotenv/config';
import express from 'express';
import upload from './upload/upload.js';
import user from './entidades/user.js';
import mensagem from './entidades/mensagem.js';
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

app.post('/img_upload', upload.array('file[]', 1), (req, res) => {
    res.status(200).json({status : true});
});

app.get('/uploadVideo', (req, res) => {
    res.render('../template/upload');
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

app.get('/mensagens/:me/:user/:nivel/:amais', async (req, res) => {
    const me = req.params.me;
    const to = req.params.user;
    const nivel = parseInt(req.params.nivel);
    const amais = parseInt(req.params.amais);
    const mensagensPerReq = 20
    const conversa = await mensagem.conversaEmPartes(to, me, nivel, amais, mensagensPerReq);
    return res.json(conversa);
})

io.on('connection', (socket) => {
    io.emit('LOGAR');
    socket.on('LOGADO', async (nome) => {
        if(!nome) return console.log('Não exite!');
        const logado = await user.logar(nome, socket.id);
        io.to(socket.id).emit('LOGADOCALLBACK', logado);
    });
    socket.on('NEWMSG', async (msg) => {
        if(msg.to == msg.from || !await user.acessarUsuario(msg.to)) return;
        const usuario = await user.acessarUsuario(msg.from);
        const amigo = await user.acessarUsuario(msg.to);
        const resposta = await mensagem.enviarMsg(msg);
        io.to(usuario.sessionId).emit('RECEIVE', resposta);
        io.to(amigo.sessionId).emit('CALLBACK',  resposta);
    });
    socket.on('NEWFRIEND', async (newFriend) => {
        const usuario = await user.acessarUsuario(newFriend.from);
        const amigo = await user.acessarUsuario(newFriend.to);
        const resposta = await user.criarContato(newFriend);
        io.to(usuario.sessionId).emit('RECEIVE', resposta.user);
        io.to(amigo.sessionId).emit('CALLBACK', resposta.amigo);
    })
    socket.on('disconnect', () => {
        console.log(`${socket.id} -> desconectou`);
    });
});

server.listen(3000);