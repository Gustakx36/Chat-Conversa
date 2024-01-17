import mensagem from './mensagem.js';

const users = {};
var count = 1;

const usuarioExiste = (user) => {
    return users[user] != undefined;
}

const acessarUsuario = (user, sessionId) => {
    if(!sessionId){
        return users[user];
    }
    users[user].sessionId = sessionId
    return users[user];
}

const criarUsuario = (user, sessionId) => {
    users[user] = {id: count, nome: user, sessionId : sessionId, amigos: []};
    count += 1;
    return acessarUsuario(user);
}

const adicionarAmigo = (user, amigo) => {
    users[user].amigos.push(amigo);
    return users[user].amigos;
}

const logar = (user, sessionId) => {
    console.log(sessionId)
    if(usuarioExiste(user)) return acessarUsuario(user, sessionId);
    return criarUsuario(user, sessionId);
}

const criarContato = (novoAmigo) => {
    if(!users[novoAmigo.to]) return false;
    if(users[novoAmigo.from].amigos.includes(novoAmigo.to)) return false;
    const userFrom = adicionarAmigo(novoAmigo.from, novoAmigo.to);
    const userTo = adicionarAmigo(novoAmigo.to, novoAmigo.from);
    mensagem.criarConversa(novoAmigo);
    return {
        user : {from: novoAmigo.from, amigos: userFrom, amigosUpdate: true},
        amigo : {from: novoAmigo.from, amigos: userTo, amigosUpdate: true}
    };
}

export default { logar, criarContato, acessarUsuario };