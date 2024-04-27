// import de conexão com banco, varia de acordo com o tipo de banco
import connection from './connection/connection.js';

// query de verificação da existencia das mensagens
const conversaExite = async (to, from) => {
    const queryMsg = await connection.get('SELECT * FROM mensagens WHERE toFrom = ? OR toFrom = ?', `${from}${to}`,`${to}${from}`);
    return queryMsg;
}

// query que faz todas as validações e registro de envio das mensagens no final retorno quem enviou e qual mensagem
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
    await connection.run(`
        INSERT INTO mensagens(idCriacao, msg, toFrom, 'to', 'from') VALUES(?, ?, ?, ?, ?)`, 
        idCriacao, 
        msg.msg, 
        conversa.toFrom, 
        msg.to, 
        msg.from);
    return {from: msg.from,  msg: msg.msg};
}

// acessar todas as mensagens
const acessarConversa = async (to, from) => {
    const conversa = await conversaExite(to, from);
    if(!conversa) return [];
    const queryMsg = await connection.all('SELECT * FROM mensagens WHERE toFrom = ?', conversa.toFrom);
    return queryMsg;
}

// acessar as mensagens em partes, a variavel mensagensPerReq define quantas mensagens por request eu vou carregar
const conversaEmPartes = async (to, from, nivel, amais) => {
    const mensagensPerReq = 20
    const incio = mensagensPerReq * nivel + amais;
    const conversa = await conversaExite(to, from);
    if(!conversa) return [];
    const queryMsg = await connection.all(
        'SELECT * FROM `mensagens` WHERE toFrom = ? AND idCriacao <= (SELECT count(*) FROM mensagens) - ? ORDER BY idCriacao DESC LIMIT ?; ', 
        conversa.toFrom, 
        incio, 
        mensagensPerReq
    );
    const conversaMsg = queryMsg.slice(0).reverse();
    return {
        mensagens: conversaMsg,     
        statusFim: conversaMsg.length == 0
    };
}

// exportando funções que vão ser utilizadas
export default { enviarMsg, conversaEmPartes };