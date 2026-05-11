const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const mqtt = require("mqtt");
const fs = require("fs");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

// ======= FRONTEND ========

app.use(express.static("public"));


// ========= MQTT ==========
// 
// Em caso de erro verificar o ip da maquina
// terminal: "hostname -I"

const mqttClient = mqtt.connect("mqtts://192.168.1.108:8883", {

    clientId: "monitor",

    protocol: "mqtts",

    ca: fs.readFileSync("./certs/ca.crt"),
    cert: fs.readFileSync("./certs/monitor.crt"),
    key: fs.readFileSync("./certs/monitor.key"),

    rejectUnauthorized: false,

    reconnectPeriod: 0
});

mqttClient.on("connect", () => {

    console.log("MQTT conectado");

    mqttClient.subscribe("interface");
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