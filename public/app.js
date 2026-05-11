
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

  //criando a tela
  const ctxGraficoTR = document
    .getElementById("graficoTempoReal")
    .getContext("2d");

  //criando o grafico da tela
  const g1 = criarGrafico(
    ctxGraficoTR,
    10,
    "Últimas 10 leituras do sensor de chuva",
  );

  canvas.style.visibility = "hidden";

  //verifica se ha uma nova mensagem do mqtt
  window.addEventListener("mqtt_data", (event) => {

    const msg = event.detail;

    const valor = msg.data;

    const dado = verificarValor(valor);

    const horario = new Date().toLocaleTimeString('pt-BR');

    document.getElementById("tituloGerenciamento").innerText = "Gerenciamento";

    canvas.style.visibility = "visible";

    g1.adicionarDado(dado, horario);


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

