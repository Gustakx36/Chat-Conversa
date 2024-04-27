// mesmo arquivo do sql só que implmentando o mysql
import connection from './connection/connection.js';

const conversaExite = async (to, from) => {
    const [queryMsg] = await connection.execute('SELECT * FROM mensagens WHERE toFrom = ? OR toFrom = ?', [`${to}${from}`, `${from}${to}`]);
    return queryMsg;
}

const enviarMsg = async (msg) => {
    var conversa = await conversaExite(msg.to, msg.from);
    let idCriacao;
    if(!conversa) {
        conversa = {};
        conversa.toFrom = `${msg.to}${msg.from}`;
        idCriacao = 1;
    }else{
        const todosItens = await acessarConversa(msg.to, msg.from);
        const ultimoId = todosItens[todosItens.length - 1].idCriacao;
        idCriacao = ultimoId + 1;
    }
    await connection.execute('INSERT INTO mensagens(idCriacao, msg, toFrom, `to`, `from`) VALUES(?, ?, ?, ?, ?)', [idCriacao, msg.msg, conversa.toFrom, msg.to, msg.from]);
    return {from: msg.from,  msg: msg.msg};
}

const acessarConversa = async (to, from) => {
    const conversa = await conversaExite(to, from);
    if(!conversa) return [];
    const [queryMsg] = await connection.execute('SELECT * FROM mensagens WHERE toFrom = ?', [conversa.toFrom]);
    return queryMsg;
}

const conversaEmPartes = async (to, from, nivel, amais) => {
    const mensagensPerReq = 20
    const incio = mensagensPerReq * nivel + amais;
    const conversa = await conversaExite(to, from);
    if(!conversa) return [];
    const [queryMsg] = await connection.execute(
        'SELECT * FROM `mensagens` WHERE toFrom = ? AND idCriacao <= (SELECT count(*) FROM `mensagens`) - ? ORDER BY idCriacao DESC LIMIT ?; ', 
        [conversa.toFrom, incio, mensagensPerReq]
    );
    const conversaMsg = queryMsg.slice(0).reverse()
    return {
        mensagens: conversaMsg,     
        statusFim: conversaMsg.length == 0
    };
}

export default { enviarMsg, conversaEmPartes };