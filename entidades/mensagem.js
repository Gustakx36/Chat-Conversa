const mensagens = {};

const conversaExite = (to, from) => {
    var conversaAtual;
    if(!mensagens[`${to}${from}`]){
        conversaAtual = mensagens[`${from}${to}`];
    }
    if(!mensagens[`${from}${to}`]){
        conversaAtual = mensagens[`${to}${from}`];
    }
    return conversaAtual;
}

const enviarMsg = (msg) => {
    const conversa = conversaExite(msg.to, msg.from);
    if(!conversa) return{};
    conversa.push(msg);
    return {from: msg.from,  msg: msg.msg};
}

const criarConversa = (novaConversa) => {
    const conversa = conversaExite(novaConversa.to, novaConversa.from);
    if(!conversa) mensagens[`${novaConversa.from}${novaConversa.to}`] = [];
    return;
}

const conversaEmPartes = (to, me, nivel, amais, mensagensPerReq) => {
    const conversa = conversaExite(to, me);
    if(!conversa) return {statusFim: true};
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

export default { enviarMsg, criarConversa, conversaEmPartes };