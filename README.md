# IoT Rain Dashboard

Dashboard web em tempo real para monitoramento de chuva utilizando MQTT seguro com TLS/mTLS e Node.js.

# Tecnologias Utilizadas

## Backend

- Node.js
- Express
- Socket.IO
- MQTT.js

## Frontend

- HTML
- CSS
- JavaScript


# Instalação

## 1. Clonar o repositório

## 2. Entrar na pasta do projeto e instalar dependências

```bash
npm install
```

# Configuração dos Certificados

Os certificados MQTT devem ser colocados dentro da pasta:

```text
certs/
```

Arquivos necessários:

```text
ca.crt
monitor.crt
monitor.key
```

# Executando o Projeto

```bash
node server.js
```

O servidor ficará disponível em:

```text
http://localhost:3000
```

# Fluxo de Dados

1. O Node.js recebe as mensagens MQTT
2. O Socket.IO envia os dados para o frontend
3. A interface é atualizada em tempo real

# Interface

O dashboard altera dinamicamente:

- plano de fundo
- animações
- indicadores visuais
- gráficos

de acordo com os dados recebidos pelo sensor.
