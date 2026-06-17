const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const mqtt = require("mqtt");
const fs = require("fs");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

const { ref, onValue } = require("firebase/database");
const { db } = require("./firebase");

// ======= FRONTEND ========

app.use(express.static("public"));


// ========= MQTT ==========
// 
// Em caso de erro verificar o ip da maquina
// terminal: "hostname -I"

const mqttClient = mqtt.connect("mqtts://localhost:8883", {

    clientId: "monitor",

    protocol: "mqtts",

    ca: fs.readFileSync("./certs/ca.crt"),
    cert: fs.readFileSync("./certs/monitor.crt"),
    key: fs.readFileSync("./certs/monitor.key"),

    rejectUnauthorized: false,

    reconnectPeriod: 0,

    username: "monitor",
    password: "1234"
});

mqttClient.on("connect", () => {

    console.log("MQTT conectado");

    mqttClient.subscribe("esp32/rain_sensor");
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

const previsaoRef = ref(db, "previsao");

onValue(previsaoRef, (snapshot) => {

    const previsao = snapshot.val() || {};

    const previsaoArray = Object.values(previsao);

    console.log("Previsão recebida:");
    console.log(previsao);

    io.emit("forecast_update", previsao);

});

