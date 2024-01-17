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
    if(!conversa) {
        conversa = {};
        conversa.toFrom = `${msg.to}${msg.from}`;
    };
    await connection.execute('INSERT INTO mensagens(msg, toFrom, `to`, `from`) VALUES(?, ?, ?, ?)', [msg.msg, conversa.toFrom, msg.to, msg.from]);
    return {from: msg.from,  msg: msg.msg};
}

const acessarConversa = async (to, from) => {
    const conversa = await conversaExite(to, from);
    if(!conversa) return [];
    const [queryMsg] = await connection.execute('SELECT * FROM mensagens WHERE toFrom = ?', [conversa.toFrom]);
    return queryMsg;
}

const conversaEmPartes = async (to, me, nivel, amais, mensagensPerReq) => {
    const conversa = await acessarConversa(to, me);
    
    if(conversa.length == 0) return {statusFim: true};
    const inicio = () => {
        return conversa.length - mensagensPerReq - (mensagensPerReq * nivel) - amais;
    };
    const fim = () => {
        return conversa.length - 0 - (mensagensPerReq * nivel) - amais;
    };
    if(inicio(conversa) < 0){
        return {
            mensagens: conversa.slice(0, fim()),     
            statusFim: true
        };
    }
    return {
        mensagens: conversa.slice(inicio(), fim()),     
        statusFim: false
    };
}

export default { enviarMsg, conversaEmPartes };