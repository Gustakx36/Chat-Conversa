import connection from './connection/connection.js';

const usuarioExiste = async (user) => {
    const [queryUser] = await connection.execute('SELECT * FROM users WHERE nome = ?', [user]);
    return queryUser.length > 0;
}

const acessarUsuario = async (user, sessionId) => {
    if(!sessionId){
        const [queryUser] = await connection.execute('SELECT * FROM users WHERE nome = ?', [user]);
        const [queryUserAmigos] = await connection.execute('SELECT * FROM amigos WHERE idUser = ?', [queryUser[0].id]);
        queryUser[0].amigos = queryUserAmigos.map((item) => {
            return item.nome
        });
        return queryUser[0];
    }
    await connection.execute('UPDATE users SET sessionId = ? WHERE nome = ?', [sessionId, user]);
    const [queryUser] = await connection.execute('SELECT * FROM users WHERE nome = ?', [user]);
    const [queryUserAmigos] = await connection.execute('SELECT * FROM amigos WHERE idUser = ?', [queryUser[0].id]);
    queryUser[0].amigos = queryUserAmigos.map((item) => {
        return item.nome
    });
    return queryUser[0];
}

const criarUsuario = async (user, sessionId) => {
    await connection.execute('INSERT INTO users (nome, sessionId) VALUES(?, ?)', [user, sessionId]);
    const userAtual = acessarUsuario(user);
    return userAtual;
}

const logar = async (user, sessionId) => {
    if(await usuarioExiste(user)){
        const userAtual = await acessarUsuario(user, sessionId);
        return userAtual;
    }  
    const userAtual = await criarUsuario(user, sessionId);
    return userAtual
}

const criarContato = async (novoAmigo) => {
    if(!await usuarioExiste(novoAmigo.to)) return false;
    const userAtual = await acessarUsuario(novoAmigo.from);
    const amigo = await acessarUsuario(novoAmigo.to);
    const amizadeCriada = await connection.execute('SELECT * FROM amigos WHERE idUser = ? AND nome = ?', [userAtual.id, novoAmigo.to]);
    if(amizadeCriada > 0) return false;
    await connection.execute('INSERT INTO amigos (nome, idUser) VALUES(?, ?)', [novoAmigo.to, userAtual.id]);
    await connection.execute('INSERT INTO amigos (nome, idUser) VALUES(?, ?)', [userAtual.nome, amigo.id]);
    const userAtualUpdate = await acessarUsuario(novoAmigo.from);
    const amigoUpdate = await acessarUsuario(novoAmigo.to);
    return {
        user : {from: novoAmigo.from, amigos: userAtualUpdate.amigos, amigosUpdate: true},
        amigo : {from: novoAmigo.from, amigos: amigoUpdate.amigos, amigosUpdate: true}
    };
}

export default { logar, criarContato, acessarUsuario };