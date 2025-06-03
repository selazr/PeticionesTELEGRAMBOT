const { Configuration, OpenAIApi } = require('openai');

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(config);

async function generateResponse(prompt) {
  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }]
  });

  const reply = res.data.choices[0].message.content;

  // 🧾 LOG DE ENTRADA Y RESPUESTA
  console.log('--- IA ---');
  console.log('🟡 Prompt:', prompt);
  console.log('🟢 Respuesta:', reply);
  console.log('------------');

  return reply;
}

module.exports = generateResponse;
