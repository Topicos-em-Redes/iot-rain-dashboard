//se (valor <= VCHUVAF) muita chuva 
const VCHUVAF = 500;
//se (valor <= VCHUVA) chuva 
const VCHUVA = 3700;
//se (valor <= VSOL) sol 
const VSOL = 4095;
// estado do cenario
let estadoAtual = null;

// buscando a tela para animar a chuva
const canvas = document.getElementById("chuva");

//criando a tela
const ctx = canvas.getContext("2d");

//busca a imagem do sol principal no html
const imgSol = document.getElementById("sol");

//buscar a div onde ocorrera a chuva
const div = document.getElementById("caixa");

//buscar as divs que farão a troca de background
const camadas = document.querySelectorAll(".bg");

//Titulo Inicial
document.getElementById("titulo").innerText = "Nenhum Valor Coletado";

//Background inicial
trocarBackground(camadas, "linear-gradient(to bottom, #7bb2fd, #caddf6)");

window.addEventListener("mqtt_data", (event) => {

  const msg = event.detail;

  const valor = msg.data;

  const dado = verificarValor(valor);

  const data = new Date().toLocaleString('pt-BR');

  const titulo = document.getElementById("titulo");

  //Verificar em qual dos 3 estados(sol, chuva ou muita chuva), o cenario deve ficar
  //Caso o valor do sensor seja menor que 500, muita chuva
  if (dado <= VCHUVAF) {

    if (estadoAtual !== "chuva_forte") {
      //definir estado atual
      estadoAtual = "chuva_forte";
      //iniciar a chuva, tipo 2, chuva forte
      iniciarChuva(2);
      //esconder o sol
      esconder(imgSol);
      //realizar a troca do background
      trocarBackground(camadas, "linear-gradient(to bottom, #2c3f5a, #3e597f)");
      //atualizar o titulo do estado para Muita Chuva
      titulo.innerText = "Muita Chuva";
    }

  }
  else if (dado <= VCHUVA) {

    if (estadoAtual !== "chuva") {
      //definir estado atual
      estadoAtual = "chuva";
      //iniciar a chuva, tipo 1, chuva normal
      iniciarChuva(1);
      //esconder o sol
      esconder(imgSol);
      //realizar a troca do background
      trocarBackground(camadas, "linear-gradient(to bottom, #3e597f, #577eb3)");
      //atualizar o titulo do estado para Chuva
      titulo.innerText = "Chuva";
    }

  }
  else {

    if (estadoAtual !== "sol") {
      //definir estado atual
      estadoAtual = "sol";
      //caso já esteja chovendo parar a chuva
      pararChuva();
      //caso estivesse chovendo, aprecer o sol
      aparecer(imgSol);
      //realizar a troca do background
      trocarBackground(camadas, "linear-gradient(to bottom, #7bb2fd, #caddf6)");
      //atualizar o titulo do estado para Sol
      titulo.innerText = "Sol";
    }

  }

  document.getElementById("valor").innerText = dado;
  document.getElementById("hora").innerText = data;

});

//dados para a chuva
let gotas = [];
let gotasQtd = 100;
let velocidadeBase = 5;
let animando = false;
let chuvaAtiva = false;
let animacaoId;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//verificar o tipo de chuva e configura a intensidade
function tipoChuva(tipo) {
  if (tipo == 1) {
    gotasQtd = 150;
    velocidadeBase = 5;
  } else if (tipo == 2) {
    gotasQtd = 250;
    velocidadeBase = 9;
  }

  //criar as gotas
  criarGotas();
}

function criarGotas() {
  gotas = [];

  for (let i = 0; i < gotasQtd; i++) {
    gotas.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      comprimento: Math.random() * 15 + 10,
      velocidade: Math.random() * velocidadeBase + velocidadeBase,
    });
  }
}

function animarChuva() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(174,194,224,0.6)";
  ctx.lineWidth = 1;

  for (let g of gotas) {
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x, g.y + g.comprimento);
    ctx.stroke();

    g.y += g.velocidade;

    if (g.y > canvas.height) {
      g.y = -g.comprimento;
      g.x = Math.random() * canvas.width;
    }
  }

  animacaoId = requestAnimationFrame(animarChuva);
}

function iniciarChuva(tipo) {
  tipoChuva(tipo);

  if (!animando) {
    animarChuva();
    animando = true;
  }
}

function pararChuva() {
  if (animacaoId) {
    cancelAnimationFrame(animacaoId);
    animacaoId = null;
  }

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animando = false;
}

function trocarBackground(camadas, novoBackground) {
  const [bg1, bg2] = camadas;
  const atual = bg1.classList.contains("ativo") ? bg1 : bg2;
  const proximo = atual === bg1 ? bg2 : bg1;

  // define novo fundo na camada que vai aparecer
  proximo.style.background = novoBackground;

  // faz a troca visual
  proximo.classList.add("ativo");
  atual.classList.remove("ativo");
}

function aparecer(img) {
  img.style.transition = "opacity 1s";
  img.style.opacity = "1";
}

function esconder(img) {
  img.style.transition = "opacity 1s";
  img.style.opacity = "0";
}

function verificarValor(valor) {

  const dado = parseInt(valor, 10);

  if (isNaN(dado)) {
    return 0;
  }

  if (dado < 0) {
    return 0;
  }

  if (dado > 4095) {
    return 4095;
  }

  return dado;
}