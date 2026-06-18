const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const mqtt = require("mqtt");
const fs = require("fs");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

const { ref, onValue, query, orderByKey, limitToLast } = require("firebase/database");
const { db } = require("./firebase");

// ======= FRONTEND ========

app.use(express.static("public"));


// ========= MQTT ==========
// 
// Em caso de erro verificar o ip da maquina
// terminal: "hostname -I"

const mqttClient = mqtt.connect("mqtts://localhost:8883", {

    clientId: `monitor-${process.pid}`,

    protocol: "mqtts",

    ca: fs.readFileSync("./certs/ca.crt"),
    cert: fs.readFileSync("./certs/monitor.crt"),
    key: fs.readFileSync("./certs/monitor.key"),

    rejectUnauthorized: false,

    reconnectPeriod: 5000,
    connectTimeout: 30000,

    username: "monitor",
    password: "1234"
});

function assinarTopicoMqtt() {
    mqttClient.subscribe("esp32/rain_sensor", (err) => {
        if (err) {
            
            console.log("ERRO MQTT subscribe:");
            console.log(err.message);
        }
    });
}

mqttClient.on("connect", () => {

    console.log("MQTT conectado");

    assinarTopicoMqtt();
});

mqttClient.on("reconnect", () => {
    console.log("MQTT reconectando...");
});

mqttClient.on("close", () => {
    console.log("MQTT desconectado");
});

mqttClient.on("offline", () => {
    console.log("MQTT offline");
});


mqttClient.on("message", (topic, message) => {

    console.log(topic, message.toString());

    io.emit("mqtt_message", {
        topic,
        data: message.toString()
    });
});


mqttClient.on("error", (err) => {

    console.log("ERRO MQTT:");
    console.log(err.message);

});


// ======= SERVER ========

server.listen(3000, () => {

    console.log("Servidor rodando:");
    console.log("http://localhost:3000");
});

// ======= FIREBASE ========

const LIMITE_PREVISOES = 10;
const previsaoRef = ref(db, "predicoes");
const previsaoQuery = query(
    previsaoRef,
    orderByKey(),
    limitToLast(LIMITE_PREVISOES)
);

function extrairValorPrevisao(item) {
    return item?.payload ?? item?.valor ?? item?.value ?? null;
}

function formatarPrevisoes(previsao) {
    return Object.fromEntries(
        Object.entries(previsao || {})
            .filter(([, item]) => item && extrairValorPrevisao(item) != null)
            .map(([id, item]) => [
                id,
                {
                    id,
                    payload: extrairValorPrevisao(item),
                    timestamp: item.timestamp ?? null,
                },
            ])
    );
}

let ultimaPrevisao = {};

function emitirPrevisoes(previsao) {
    ultimaPrevisao = formatarPrevisoes(previsao);

    console.log("Previsão recebida por id (últimas 10):");
    console.log(ultimaPrevisao);

    io.emit("forecast_update", ultimaPrevisao);
}

onValue(previsaoQuery, (snapshot) => {
    emitirPrevisoes(snapshot.val());
}, (err) => {
    console.log("ERRO Firebase (previsão):");
    console.log(err.message);
});

io.on("connection", (socket) => {
    if (Object.keys(ultimaPrevisao).length > 0) {
        socket.emit("forecast_update", ultimaPrevisao);
    }
});

