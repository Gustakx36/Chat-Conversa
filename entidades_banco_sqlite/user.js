// import de conexão com banco, varia de acordo com o tipo de banco
import connection from './connection/connection.js';

// função de verificação da existencia do usuário
const usuarioExiste = async (user) => {
    const queryUser = await connection.all('SELECT * FROM users WHERE nome = ?', user);
    return queryUser.length > 0;
}

// função para acessar o usuário
const acessarUsuario = async (user, sessionId) => {
    if(sessionId){
        await connection.run('UPDATE users SET sessionId = ? WHERE nome = ?', sessionId, user);
    }
    const queryUser = await connection.get('SELECT * FROM users WHERE nome = ?', user);
    if(queryUser === undefined) return false;
    const queryUserAmigos = await connection.all('SELECT * FROM amigos WHERE idUser = ?', queryUser.id);
    queryUser.amigos = queryUserAmigos.map((item) => {
        return item.nome
    });
    return queryUser;
}

// função para criar um usuário novo
const criarUsuario = async (user, sessionId) => {
    await connection.run('INSERT INTO users (nome, sessionId) VALUES(?, ?)', user, sessionId);
    const userAtual = acessarUsuario(user);
    return userAtual;
}

// função para validar login do usuário ao se conectar no servidor
const logar = async (user, sessionId) => {
    if(await usuarioExiste(user)){
        const userAtual = await acessarUsuario(user, sessionId);
        return userAtual;
    }  
    const userAtual = await criarUsuario(user, sessionId);
    return userAtual
}

// função que valida e cria um registro no banco para referenciar uma ligação entre dois usuários
const criarContato = async (novoAmigo) => {
    if(!await usuarioExiste(novoAmigo.to)) return false;
    const userAtual = await acessarUsuario(novoAmigo.from);
    const amigo = await acessarUsuario(novoAmigo.to);
    const amizadeCriada = await connection.all('SELECT * FROM amigos WHERE idUser = ? AND nome = ?', userAtual.id, novoAmigo.to);
    if(amizadeCriada > 0) return false;
    await connection.run('INSERT INTO amigos (nome, idUser) VALUES(?, ?)', novoAmigo.to, userAtual.id);
    await connection.run('INSERT INTO amigos (nome, idUser) VALUES(?, ?)', userAtual.nome, amigo.id);
    const userAtualUpdate = await acessarUsuario(novoAmigo.from);
    const amigoUpdate = await acessarUsuario(novoAmigo.to);
    return {
        user : {from: novoAmigo.from, amigos: userAtualUpdate.amigos, amigosUpdate: true},
        amigo : {from: novoAmigo.from, amigos: amigoUpdate.amigos, amigosUpdate: true}
    };
}

// exportando funções que vão ser utilizadas
export default { logar, criarContato, acessarUsuario };