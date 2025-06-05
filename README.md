# Telegram Bot con Node.js, MongoDB y OpenAI

Este repositorio implementa un bot de Telegram usando Node.js. Se conecta a una base de datos MongoDB para almacenar solicitudes de usuarios y ofrece funciones administrativas a través de Telegram. Opcionalmente, puede conectarse a la API de OpenAI para generar respuestas inteligentes.

## 📁 Estructura del Proyecto

```
.
├── bot/
│   ├── telegram.js          # Configura y lanza el bot
│   ├── handlers.js          # Lógica para usuarios normales
│   ├── adminHandlers.js     # Comandos y flujo para el administrador
│   └── adminActions.js      # Botones, paginación, estadísticas
├── db/
│   └── mongo.js             # Conexión a MongoDB
├── models/
│   └── Request.js           # Esquema Mongoose para las solicitudes
├── utils/
│   └── openai.js            # Wrapper para la API de OpenAI (opcional)
├── .gitignore
├── index.js                 # Punto de entrada de la app
└── package.json
```

## ⚙️ Inicialización

```js
require('dotenv').config();
const connectDB = require('./db/mongo');
const setupBot = require('./bot/telegram');

(async () => {
  await connectDB();
  setupBot();
})();
```

## 🌐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
MONGO_URI=tu_uri_de_mongodb
TELEGRAM_TOKEN=tu_token_de_telegram
ADMIN_ID=tu_id_numerico_de_telegram
OPENAI_API_KEY=tu_clave_openai (opcional)
```

## 🔄 Flujo de Funcionamiento

1. El usuario envía un mensaje que incluya la palabra clave `necesito...`.
2. El bot responde pidiendo nombre y presupuesto.
3. Se guarda la solicitud en MongoDB como un documento `Request`.
4. El administrador puede ver, aprobar o rechazar solicitudes mediante:
   - comandos de texto (`/admin`, “ver pendientes”, etc.)
   - botones de Telegram (callback queries).

## 📦 Instalación

```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
npm install
```

## ▶️ Ejecución

```bash
node index.js
```

El bot quedará activo escuchando mensajes entrantes.

## 🧠 Opcional: Integración con OpenAI

Si configuras `OPENAI_API_KEY`, el archivo `utils/openai.js` puede enviar prompts a OpenAI y registrar respuestas. Esto permite extender funcionalidades del bot con IA.

## 📚 Recomendaciones de Aprendizaje

- **Node.js**: módulos CommonJS, async/await, manejo de errores.
- **MongoDB/Mongoose**: esquemas, validaciones, queries.
- **Telegram Bot API**: [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api), uso de mensajes, botones y callbacks.
- **Seguridad**: manejo seguro de tokens y estados de usuario.
- **OpenAI (opcional)**: comprensión de la API para generación de texto.

## ✅ Ventajas de esta arquitectura

- Modular y extensible: fácil de añadir nuevos comandos o flujos.
- Código limpio y separado por responsabilidades.
- Escalable: puede adaptarse fácilmente a nuevos modelos, APIs o servicios.

---

### ✨ Contribuciones

Pull requests y sugerencias son bienvenidas. ¡No dudes en mejorar este bot!

---

### 📝 Licencia

MIT
