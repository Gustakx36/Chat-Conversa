import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import {} from 'dotenv/config';
import express from 'express';
import user from './entidades_banco_sqlite/user.js';
// Banco Local (user) - ./entidades/user.js;
// Banco MySQL (user) - ./entidades_banco_mysql/user.js;
// Banco SQLite (user) - ./entidades_banco_sqlite/user.js;
import mensagem from './entidades_banco_sqlite/mensagem.js';
// Banco Local (mensagem) - ./entidades/user.js;
// Banco MySQL (mensagem) - ./entidades_banco_mysql/user.js;
// Banco SQLite (mensagem) - ./entidades_banco_sqlite/user.js;
import path from 'path';
import http from 'http';


// Variaveis do endpoint e do servidor
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configuração da variavel do caminho onde se localiza os arquivos estaticos (html, css, js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setando a viwe engine de leitura do "html"
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'template')));

// endpoint para acesso ao front-end da aplicação (html)
app.get('/', (req, res) => {
    // res é a variavel padrão da request com ela consigo utilizar o render junto da view engine
    // e renderizar o html da pasta template
    res.render('../template/index');
});

// endpoint para pegar as mensagens
app.get('/mensagens/:me/:user/:nivel/:amais', async (req, res) => {
    const me = req.params.me;
    const to = req.params.user;
    const nivel = parseInt(req.params.nivel);
    const amais = parseInt(req.params.amais);
    const conversa = await mensagem.conversaEmPartes(to, me, nivel, amais);
    return res.json(conversa);
})

// "endpoints" de espera e emissão que o WebSocket Possui
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
        if(!amigo) return;
        const resposta = await user.criarContato(newFriend);
        io.to(usuario.sessionId).emit('RECEIVE', resposta.user);
        io.to(amigo.sessionId).emit('CALLBACK', resposta.amigo);
    })
    socket.on('disconnect', () => {
        console.log(`${socket.id} -> desconectou`);
    });
});

// porta que será rodada a aplicação
server.listen(3000);