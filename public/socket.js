const socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
});

socket.on("connect", () => {
    console.log("Socket conectado");
});

socket.on("disconnect", () => {
    console.log("Socket desconectado");
});

socket.on("connect_error", (err) => {
    console.log("Socket erro:", err.message);
});

socket.on("mqtt_message", (msg) => {
    window.dispatchEvent(
        new CustomEvent("mqtt_message", { detail: msg })
    );
});

socket.on("forecast_update", (forecast) => {
    window.dispatchEvent(
        new CustomEvent("forecast_update", { detail: forecast })
    );
});