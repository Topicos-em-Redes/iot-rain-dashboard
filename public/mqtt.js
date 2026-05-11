const socket = io();

//recebe a mensagem
socket.on("mqtt_message", (msg) => {

    // manda para o resto do sistema
    window.dispatchEvent(new CustomEvent("mqtt_data", {
        detail: msg
    }));
});