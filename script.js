 
/* ========================================
   1. ANIMAÇÕES DE ENTRADA
======================================== */

const elementosEntrada = document.querySelectorAll(
    'section, .seção, .card, .sentido-sismico'
);

if ('IntersectionObserver' in window) {
    const observador = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add('visivel');
                observador.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.15 });

    elementosEntrada.forEach((elemento) => {
        elemento.classList.add('revelar');
        observador.observe(elemento);
    });
} else {
    elementosEntrada.forEach((elemento) => {
        elemento.classList.add('visivel');
    });
}


/* ========================================
   2. BARRA DE PROGRESSO
======================================== */

const barraProgresso = document.getElementById('barra-progresso');

function atualizarProgresso() {
    if (!barraProgresso) return;

    const alturaTotal =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

    const porcentagem = alturaTotal > 0
        ? (window.scrollY / alturaTotal) * 100
        : 0;

    barraProgresso.style.width = porcentagem + '%';
}

window.addEventListener('scroll', atualizarProgresso);
window.addEventListener('resize', atualizarProgresso);
atualizarProgresso();


/* ========================================
   3. CARDS INTERATIVOS
======================================== */

const cards = document.querySelectorAll('.toph-app .card');
const modalElemento = document.getElementById('modalCard');

if (modalElemento && window.bootstrap?.Modal) {
    const modalBootstrap =
        bootstrap.Modal.getOrCreateInstance(modalElemento);

    cards.forEach((card) => {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');

        function abrirCard() {
            const titulo =
                card.querySelector('h3')?.textContent.trim() || '';

            const descricao =
                card.querySelector('p')?.textContent.trim() || '';

            const imagem = card.querySelector('img');

            document.getElementById('modalTitulo').textContent = titulo;
            document.getElementById('modalDescricao').textContent = descricao;

            const imagemModal = document.getElementById('modalImagem');

            imagemModal.src = imagem ? imagem.src : '';
            imagemModal.alt = titulo;

            modalBootstrap.show();
        }

        card.addEventListener('click', abrirCard);

        card.addEventListener('keydown', (evento) => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                abrirCard();
            }
        });
    });
}


/* ========================================
   4. SENTIDO SÍSMICO
======================================== */

const botaoSismico = document.getElementById('ativar-sismico');
const camadaSismica = document.getElementById('efeito-sismico');

let modoSismicoAtivo = false;
let intervaloOndas = null;
let temporizadorSismico = null;

const DURACAO_MODO = 5000;
const DURACAO_ONDA = 2600;
const INTERVALO_ENTRE_ONDAS = 800;
const DURACAO_BRILHO = 1000;

const seletoresDetectaveis = [
    'header',
    'nav',
    '.sentido-sismico',
    'section > h2',
    'section > p',
    '.centralizar',
    '.flex',
    '.flex-img',
    '.ul-flex',
    '.seção > h2',
    '.card',
    '.giff-container',
    'footer'
].join(', ');

let temporizadoresPendentes = new Set();
let temporizadoresBrilho = new Map();


function agendar(callback, atraso) {
    const id = setTimeout(() => {
        temporizadoresPendentes.delete(id);
        callback();
    }, Math.max(0, atraso));

    temporizadoresPendentes.add(id);
    return id;
}


function destacarElemento(elemento) {
    if (!modoSismicoAtivo || !elemento.isConnected) return;

    elemento.classList.add('elemento-detectado');

    const anterior = temporizadoresBrilho.get(elemento);

    if (anterior !== undefined) {
        clearTimeout(anterior);
        temporizadoresPendentes.delete(anterior);
    }

    const novoTemporizador = agendar(() => {
        elemento.classList.remove('elemento-detectado');
        temporizadoresBrilho.delete(elemento);
    }, DURACAO_BRILHO);

    temporizadoresBrilho.set(elemento, novoTemporizador);
}


/* CRIAR ONDAS */

function criarOnda() {
    if (!modoSismicoAtivo || !camadaSismica) return;

    const largura = window.innerWidth;
    const altura = window.innerHeight;

    const x = Math.random() * largura;
    const y = Math.random() * altura;

    const onda = document.createElement('div');

    onda.className = 'onda-sismica';
    onda.style.left = x + 'px';
    onda.style.top = y + 'px';
    onda.style.animationDuration = DURACAO_ONDA + 'ms';

    const maiorDistancia = Math.max(
        Math.hypot(x, y),
        Math.hypot(largura - x, y),
        Math.hypot(x, altura - y),
        Math.hypot(largura - x, altura - y)
    );

    onda.style.setProperty(
        '--escala-final',
        Math.max(1, maiorDistancia / 50)
    );

    camadaSismica.appendChild(onda);

    const elementos = document.querySelectorAll(seletoresDetectaveis);

    elementos.forEach((elemento) => {
        const retangulo = elemento.getBoundingClientRect();

        if (retangulo.width === 0 || retangulo.height === 0) return;

        const centroX = retangulo.left + retangulo.width / 2;
        const centroY = retangulo.top + retangulo.height / 2;

        const distancia = Math.hypot(
            centroX - x,
            centroY - y
        );

        const atraso = maiorDistancia > 0
            ? (distancia / maiorDistancia) * DURACAO_ONDA
            : 0;

        agendar(() => {
            destacarElemento(elemento);
        }, atraso);
    });

    onda.addEventListener('animationend', () => {
        onda.remove();
    }, { once: true });
}


/* DESATIVAR SENTIDO SÍSMICO */

function desativarSismico() {
    modoSismicoAtivo = false;

    clearInterval(intervaloOndas);
    clearTimeout(temporizadorSismico);

    intervaloOndas = null;
    temporizadorSismico = null;

    temporizadoresPendentes.forEach((id) => {
        clearTimeout(id);
    });

    temporizadoresPendentes.clear();
    temporizadoresBrilho.clear();

    document.body.classList.remove('modo-sismico');

    document.querySelectorAll('.elemento-detectado').forEach((elemento) => {
        elemento.classList.remove('elemento-detectado');
    });

    camadaSismica.replaceChildren();

    botaoSismico.classList.remove('ativo');
    botaoSismico.textContent = 'Ativar Sentido Sísmico';
    botaoSismico.setAttribute('aria-pressed', 'false');
}


/* ATIVAR SENTIDO SÍSMICO */

if (botaoSismico && camadaSismica) {
    botaoSismico.addEventListener('click', () => {

        if (modoSismicoAtivo) {
            desativarSismico();
            return;
        }

        modoSismicoAtivo = true;

        document.body.classList.add('modo-sismico');

        botaoSismico.classList.add('ativo');
        botaoSismico.textContent = 'Desativar Sentido Sísmico';
        botaoSismico.setAttribute('aria-pressed', 'true');

        criarOnda();

        intervaloOndas = setInterval(
            criarOnda,
            INTERVALO_ENTRE_ONDAS
        );

        temporizadorSismico = setTimeout(
            desativarSismico,
            DURACAO_MODO
        );
    });
}


/* ========================================
   5. VOLTAR AO TOPO
======================================== */

const botaoTopo = document.getElementById('voltar-topo');

if (botaoTopo) {

    function atualizarBotaoTopo() {
        botaoTopo.classList.toggle(
            'visivel',
            window.scrollY > 400
        );
    }

    window.addEventListener('scroll', atualizarBotaoTopo);
    atualizarBotaoTopo();

    botaoTopo.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
