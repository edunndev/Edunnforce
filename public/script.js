class CarteiraBruteforce {
    constructor() {
        this.executando = false;
        this.tentativas = 0;
        this.totalBtc = 0;
        this.totalEth = 0;
        this.precoBtc = 0;
        this.precoEth = 0;
        this.maxLinhasLog = 100;
        this.wordlist = [];
        this.configurarEventos();
        this.buscarPrecos();
        this.carregarPalavras();
        setInterval(() => this.buscarPrecos(), 5 * 60 * 1000);
        this.atualizarEstadoVazio();
    }

    async carregarPalavras() {
        try {
            const resposta = await fetch('/api/words');
            const palavras = await resposta.json();
            this.wordlist = palavras;
            this.btnIniciar.disabled = false;
        } catch (erro) {
            console.error('Erro ao carregar palavras:', erro);
            this.adicionarLog('Erro ao carregar palavras. Tente novamente mais tarde.');
            this.btnIniciar.disabled = true;
        }
    }

    configurarEventos() {
        this.btnIniciar = document.getElementById('btnIniciar');
        this.btnParar = document.getElementById('btnParar');
        this.elementoTentativas = document.getElementById('tentativas');
        this.areaLog = document.getElementById('areaLog');
        this.listaCarteiras = document.getElementById('listaCarteiras');
        this.qtdPalavras = document.getElementById('qtdPalavras');
        this.elementoValorTotal = document.getElementById('valorTotal');

        this.btnIniciar.addEventListener('click', () => this.iniciar());
        this.btnParar.addEventListener('click', () => this.parar());
    }

    atualizarEstadoVazio() {
        if (this.listaCarteiras.children.length === 0) {
            this.listaCarteiras.innerHTML = '<div class="estado-vazio">Nenhum</div>';
        }
    }

    testarCarteira(mnemonico, endBtc, endEth) {
        this.adicionarLog('Testando carteira...');
        this.adicionarLog(`Mnemônico: ${mnemonico}`);
        this.adicionarLog(`BTC: ${endBtc}`);
        this.adicionarLog(`ETH: ${endEth}`);
        this.adicionarLog('------------------------');
    }

    async buscarPrecos() {
        try {
            const resposta = await fetch('/api/prices');
            const dados = await resposta.json();
            
            this.precoBtc = dados.bitcoin.usd;
            this.precoEth = dados.ethereum.usd;
        } catch (erro) {
            console.error('Erro ao buscar preços:', erro);
        }
    }

    formatarUSD(valor) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(valor);
    }

    async iniciar() {
        this.executando = true;
        this.btnIniciar.disabled = true;
        this.btnParar.disabled = false;
        
        while (this.executando) {
            await this.gerarEVerificarCarteira();
            await new Promise(resolve => setTimeout(resolve, 1));
        }
    }

    parar() {
        this.executando = false;
        this.btnIniciar.disabled = false;
        this.btnParar.disabled = true;
    }

    adicionarLog(texto) {
        const linhaLog = document.createElement('div');
        linhaLog.textContent = texto;
        this.areaLog.insertBefore(linhaLog, this.areaLog.firstChild);
        
        while (this.areaLog.children.length > this.maxLinhasLog) {
            this.areaLog.removeChild(this.areaLog.lastChild);
        }
        
        this.areaLog.scrollTop = 0;
    }

    gerarMnemonico() {
        const numPalavras = parseInt(this.qtdPalavras.value);
        const palavras = [];
        for (let i = 0; i < numPalavras; i++) {
            const indiceAleatorio = Math.floor(Math.random() * this.wordlist.length);
            palavras.push(this.wordlist[indiceAleatorio]);
        }
        return palavras.join(' ');
    }

    gerarEnderecoBitcoin() {
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let endereco = '1';
        for (let i = 0; i < 33; i++) {
            endereco += chars[Math.floor(Math.random() * chars.length)];
        }
        return endereco;
    }

    gerarEnderecoEthereum() {
        const chars = '0123456789abcdef';
        let endereco = '0x';
        for (let i = 0; i < 40; i++) {
            endereco += chars[Math.floor(Math.random() * chars.length)];
        }
        return endereco;
    }

    async verificarSaldoBitcoin(endereco) {
        try {
            const resposta = await fetch(`/api/btc/balance/${endereco}`);
            const dados = await resposta.json();
            return dados[endereco]?.final_balance / 100000000 || 0;
        } catch (erro) {
            console.error('Erro ao verificar saldo BTC:', erro);
            return 0;
        }
    }

    async verificarSaldoEthereum(endereco) {
        try {
            const resposta = await fetch(`/api/eth/balance/${endereco}`);
            const dados = await resposta.json();
            return dados.status === "1" ? parseInt(dados.result) / 1e18 : 0;
        } catch (erro) {
            console.error('Erro ao verificar saldo ETH:', erro);
            return 0;
        }
    }

    async gerarEVerificarCarteira() {
        try {
            const mnemonico = this.gerarMnemonico();
            const enderecoBtc = this.gerarEnderecoBitcoin();
            const enderecoEth = this.gerarEnderecoEthereum();
            
            this.tentativas++;
            this.elementoTentativas.textContent = this.tentativas;

            this.adicionarLog(`Gerado: ${mnemonico}`);

            const [saldoBtc, saldoEth] = await Promise.all([
                this.verificarSaldoBitcoin(enderecoBtc),
                this.verificarSaldoEthereum(enderecoEth)
            ]);

            if (saldoBtc > 0 || saldoEth > 0) {
                this.totalBtc += saldoBtc;
                this.totalEth += saldoEth;
                
                if (this.listaCarteiras.querySelector('.estado-vazio')) {
                    this.listaCarteiras.innerHTML = '';
                }
                
                const valorTotalUSD = (saldoBtc * this.precoBtc) + (saldoEth * this.precoEth);
                const totalAtual = parseFloat(this.elementoValorTotal.textContent.replace('$', ''));
                this.elementoValorTotal.textContent = this.formatarUSD(totalAtual + valorTotalUSD);
                
                this.adicionarCarteiraLista({
                    mnemonico,
                    enderecoBtc,
                    enderecoEth,
                    saldoBtc,
                    saldoEth,
                });
            }
        } catch (erro) {
            console.error('Erro ao gerar carteira:', erro);
        }
    }

    adicionarCarteiraLista(carteira) {
        const infoCarteira = document.createElement('div');
        infoCarteira.className = 'carteira-item';
        
        let html = `<div>Encontrada: ${carteira.mnemonico}</div>`;
        
        if (carteira.saldoBtc > 0) {
            const valorBtc = carteira.saldoBtc * this.precoBtc;
            html += `<div class="saldo">BTC: ${carteira.saldoBtc.toFixed(8)} (${this.formatarUSD(valorBtc)})</div>`;
        }
        if (carteira.saldoEth > 0) {
            const valorEth = carteira.saldoEth * this.precoEth;
            html += `<div class="saldo">ETH: ${carteira.saldoEth.toFixed(8)} (${this.formatarUSD(valorEth)})</div>`;
        }
        
        html += `<button class="btn-testar" onclick="app.testarCarteira('${carteira.mnemonico}', '${carteira.enderecoBtc}', '${carteira.enderecoEth}')">Testar</button>`;
        
        infoCarteira.innerHTML = html;
        this.listaCarteiras.insertBefore(infoCarteira, this.listaCarteiras.firstChild);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        window.app = new CarteiraBruteforce();
    } catch (erro) {
        console.error('Erro ao inicializar aplicação:', erro);
        document.getElementById('areaLog').innerHTML = 
            '<div class="erro">Erro ao inicializar. Por favor, recarregue a página.</div>';
    }
});
