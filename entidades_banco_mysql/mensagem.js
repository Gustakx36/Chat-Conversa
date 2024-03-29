import connection from './connection/connection.js';

const conversaExite = async (to, from) => {
    var conversaAtual;
    const [queryMsgUm] = await connection.execute('SELECT * FROM mensagens WHERE toFrom = ?', [`${to}${from}`]);
    const [queryMsgDois] = await connection.execute('SELECT * FROM mensagens WHERE toFrom = ?', [`${from}${to}`]);
    const existeOpcaoUm = queryMsgUm.length > 0;
    const existeOpcaoDois = queryMsgDois.length > 0;
    if(existeOpcaoUm){
        conversaAtual = queryMsgUm[0];
    }
    if(existeOpcaoDois){
        conversaAtual = queryMsgDois[0];
    }
    return conversaAtual;
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

const conversaEmPartes = async (to, from, nivel, amais, mensagensPerReq) => {
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