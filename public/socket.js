const socket = io();

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