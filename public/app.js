//Criando os icones
//sol
const imgSolIcon = new Image();
imgSolIcon.src = "img/solIcon3.png";
//chuva
const imgChuvaIcon = new Image();
imgChuvaIcon.src = "img/chuvaIcon2.png";
//muita chuva
const imgTempestadeIcon = new Image();
imgTempestadeIcon.src = "img/chuvaForteIcon2.png";

//se (valor <= VCHUVAF) muita chuva 
const VCHUVAF = 500;
//se (valor <= VCHUVA) chuva 
const VCHUVA = 3700;
//se (valor <= VSOL) sol 
const VSOL = 4095;

const canvas = document.getElementById("graficoTempoReal");

const canvasPrevisao = document.getElementById("graficoPrevisao");

//Funcão para carregar Icone do grafico
function carregarImagem(img) {
  return new Promise((resolve, reject) => {
    if (img.complete) {
      resolve();
    } else {
      img.onload = resolve;
      img.onerror = reject;
    }
  });
}

Promise.all([

  carregarImagem(imgSolIcon),
  carregarImagem(imgChuvaIcon),
  carregarImagem(imgTempestadeIcon),

]).then(() => {

  //criando a tela 1
  const ctxGraficoTR = document
    .getElementById("graficoTempoReal")
    .getContext("2d");

  //criando a tela 2
  const ctxGraficoP = document
    .getElementById("graficoPrevisao")
    .getContext("2d");

  

  //criando o grafico da tela
  const g1 = criarGrafico(
    ctxGraficoTR,
    10,
    "Últimas 10 leituras do sensor de chuva",
  );

  const gPrevisao = criarGraficoPrevisao(
    ctxGraficoP,
    "Previsão dos próximos 30 minutos"
  );

  canvas.style.visibility = "hidden";
  canvasPrevisao.style.visibility = "hidden";

  //verifica se ha uma nova mensagem do mqtt
  window.addEventListener("mqtt_message", (event) => {

    const msg = event.detail;

    const valor = msg.data;

    const dado = verificarValor(valor);

    const horario = new Date().toLocaleTimeString('pt-BR');

    document.getElementById("tituloGerenciamento").innerText = "Gerenciamento";

    canvas.style.visibility = "visible";

    g1.adicionarDado(dado, horario);


  });

  window.addEventListener("forecast_update", (event) => {

    document.getElementById("tituloGerenciamentoPrevisao").innerText = "";

    canvasPrevisao.style.visibility = "visible";
    
    const previsoes = event.detail;

    atualizarGraficoPrevisao(gPrevisao.grafico, previsoes);

  });

});

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

///////////////Função para criar o grafico //////////////////
function criarGrafico(ctx, limite, legenda) {
  //Dados que serão utilizados na contrução do grafico
  const dados = {
    labels: [],
    datasets: [
      {
        label: legenda,
        data: [],
        borderColor: "black",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 1,
        pointBorderWidth: 0,

        //Verifica qual o valor do sensor, e envia o icone correspondente para a criação do ponto
        pointStyle: (context) => {
          const valor = context.raw;

          if (valor <= VCHUVAF) return imgTempestadeIcon;

          if (valor <= VCHUVA) return imgChuvaIcon;

          return imgSolIcon;
        },
      },
    ],
  };

  //Contrução do grafico
  const grafico = new Chart(ctx, {
    type: "line",
    data: dados,
    options: {
      responsive: true,

      scales: {
        y: {
          beginAtZero: true,
          grace: "15%",
        },
        x: {
          offset: true,
        },
      },
    },
  });

  //Função que insere os dados no grafico
  function adicionarDado(valor, tempo) {
    if (valor == null) return;

    dados.labels.push(tempo);
    dados.datasets[0].data.push(valor);

    if (dados.labels.length > limite) {
      dados.labels.shift();
      dados.datasets[0].data.shift();
    }

    grafico.update();
  }

  return { adicionarDado, grafico };
}

function atualizarGraficoPrevisao(grafico, previsoes) {

  if (!Array.isArray(previsoes)) return;

  const labels = [];
  const valores = [];

  previsoes
    .sort((a, b) => a.timestamp - b.timestamp)
    .forEach(item => {

      const horario = new Date(item.timestamp)
        .toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit"
        });

      labels.push(horario);

      valores.push(verificarValor(item.payload));

    });

  grafico.data.labels = labels;
  grafico.data.datasets[0].data = valores;

  grafico.update();

}

function criarGraficoPrevisao(ctx, legenda) {

  const dados = {

    labels: [],

    datasets: [
      {
        label: legenda,

        data: [],

        borderColor: "red",

        borderWidth: 2,

        borderDash: [5, 5],

        tension: 0.4,

        pointRadius: 5,

        pointStyle: (context) => {

          const valor = context.raw;

          if (valor <= VCHUVAF) return imgTempestadeIcon;

          if (valor <= VCHUVA) return imgChuvaIcon;

          return imgSolIcon;
        }
      }
    ]
  };

  const grafico = new Chart(ctx, {

    type: "line",

    data: dados,

    options: {

      responsive: true,

      scales: {

        y: {

          beginAtZero: true,

          max: 4095

        }

      }

    }

  });

  return { grafico };

}