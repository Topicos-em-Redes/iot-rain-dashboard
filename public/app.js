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

const LIMITE_LEITURAS = 10;

const canvas = document.getElementById("graficoChuva");

let graficoCombinado = null;
let previsaoPendente = null;
const leiturasPendentes = [];

function extrairValorSensor(data) {
  if (data == null) return null;

  if (typeof data === "object") {
    return data.payload ?? data.valor ?? data.value ?? data.data;
  }

  const texto = String(data).trim();

  if (texto.startsWith("{")) {
    try {
      const obj = JSON.parse(texto);
      return obj.payload ?? obj.valor ?? obj.value ?? obj.data ?? texto;
    } catch {
      return texto;
    }
  }

  return texto;
}

function formatarHorario(data) {
  return new Date(data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function aplicarLeituraMqtt(msg) {
  const valor = verificarValor(extrairValorSensor(msg.data));
  const horario = formatarHorario(Date.now());

  if (!graficoCombinado) {
    leiturasPendentes.push({ valor, horario });
    return;
  }

  document.getElementById("tituloGerenciamento").innerText = "Gerenciamento";
  canvas.style.visibility = "visible";
  graficoCombinado.adicionarLeitura(valor, horario);
}

window.addEventListener("mqtt_message", (event) => {
  aplicarLeituraMqtt(event.detail);
});

function aplicarPrevisao(previsoes) {
  if (!graficoCombinado) {
    previsaoPendente = previsoes;
    return;
  }

  document.getElementById("tituloGerenciamento").innerText = "Gerenciamento";
  canvas.style.visibility = "visible";
  graficoCombinado.atualizarPrevisao(previsoes);
}

window.addEventListener("forecast_update", (event) => {
  aplicarPrevisao(event.detail);
});

function iconePorValor(valor) {
  if (valor == null || Number.isNaN(valor)) return false;
  if (valor <= VCHUVAF) return imgTempestadeIcon;
  if (valor <= VCHUVA) return imgChuvaIcon;
  return imgSolIcon;
}

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

function iniciarGrafico() {
  const ctx = canvas.getContext("2d");
  graficoCombinado = criarGraficoCombinado(ctx);

  canvas.style.visibility = "hidden";

  if (previsaoPendente) {
    aplicarPrevisao(previsaoPendente);
    previsaoPendente = null;
  }

  if (leiturasPendentes.length > 0) {
    document.getElementById("tituloGerenciamento").innerText = "Gerenciamento";
    canvas.style.visibility = "visible";

    for (const leitura of leiturasPendentes) {
      graficoCombinado.adicionarLeitura(leitura.valor, leitura.horario);
    }

    leiturasPendentes.length = 0;
  }
}

Promise.all([

  carregarImagem(imgSolIcon),
  carregarImagem(imgChuvaIcon),
  carregarImagem(imgTempestadeIcon),

]).then(iniciarGrafico).catch((err) => {
  console.error("Erro ao carregar icones do grafico:", err);
  iniciarGrafico();
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

function normalizarTimestamp(timestamp) {
  if (timestamp == null) return NaN;

  if (typeof timestamp === "string" && Number.isNaN(Number(timestamp))) {
    return Date.parse(timestamp);
  }

  const valor = Number(timestamp);
  return valor < 1e12 ? valor * 1000 : valor;
}

function normalizarPrevisoes(previsoes) {
  const entradas = Array.isArray(previsoes)
    ? previsoes.map((item) => [item.id ?? "", item])
    : Object.entries(previsoes || {});

  return entradas
    .filter(([, item]) => item && extrairValorSensor(item) != null)
    .map(([id, item]) => ({
      id,
      timestamp: item.timestamp != null
        ? normalizarTimestamp(item.timestamp)
        : NaN,
      valor: verificarValor(
        item.payload ?? item.valor ?? item.value ?? extrairValorSensor(item)
      ),
    }))
    .filter((item) => item.id && !Number.isNaN(item.timestamp))
    .map((item) => ({
      horario: formatarHorario(item.timestamp),
      valor: item.valor,
    }));
}

function criarGraficoCombinado(ctx) {
  const leituras = { labels: [], valores: [] };
  let previsao = { labels: [], valores: [] };

  const dados = {
    labels: [],
    datasets: [
      {
        label: "Leituras do sensor (MQTT)",
        data: [],
        borderColor: "black",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointBorderWidth: 0,
        spanGaps: false,
        pointStyle: (context) => iconePorValor(context.raw),
      },
      {
        label: "Previsão",
        data: [],
        borderColor: "red",
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 5,
        pointStyle: (context) => iconePorValor(context.raw),
      },
    ],
  };

  const grafico = new Chart(ctx, {
    type: "line",
    data: dados,
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 4095,
          grace: "15%",
        },
        x: {
          offset: true,
        },
      },
    },
  });

  function atualizarGrafico() {
    const nLeituras = leituras.labels.length;
    const nPrevisao = previsao.labels.length;

    dados.labels = [...leituras.labels, ...previsao.labels];
    dados.datasets[0].data = [
      ...leituras.valores,
      ...Array(nPrevisao).fill(null),
    ];
    dados.datasets[1].data = [
      ...Array(nLeituras).fill(null),
      ...previsao.valores,
    ];

    grafico.update();
  }

  function adicionarLeitura(valor, tempo) {
    if (valor == null) return;

    leituras.labels.push(tempo);
    leituras.valores.push(valor);

    if (leituras.labels.length > LIMITE_LEITURAS) {
      leituras.labels.shift();
      leituras.valores.shift();
    }

    atualizarGrafico();
  }

  function atualizarPrevisao(previsoes) {
    const itens = normalizarPrevisoes(previsoes);

    previsao = {
      labels: itens.map((item) => item.horario),
      valores: itens.map((item) => item.valor),
    };

    atualizarGrafico();
  }

  return { adicionarLeitura, atualizarPrevisao, grafico };
}
