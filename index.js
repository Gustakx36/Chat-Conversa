import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import {} from 'dotenv/config';
import express from 'express';
import user from './entidades/user.js';
import mensagem from './entidades/mensagem.js';
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