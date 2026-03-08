require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const port = process.env.PORT || 5001;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

const CITIES = [
  { name: 'New York',    timezone: 'America/New_York',    region: 'Americas' },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles', region: 'Americas' },
  { name: 'London',      timezone: 'Europe/London',       region: 'Europe'   },
  { name: 'Chennai',     timezone: 'Asia/Kolkata',        region: 'Asia'     },
  { name: 'Singapore',   timezone: 'Asia/Singapore',      region: 'Asia'     },
];

app.post('/api/claude', async (req, res) => {
  const { feature, query, weatherData } = req.body;

  try {
    if (feature === 'search') {
      const tools = [{
        name: 'filter_cities',
        description: 'Filter the city list based on user criteria such as region, continent, or weather preference.',
        input_schema: {
          type: 'object',
          properties: {
            matching_cities: {
              type: 'array',
              items: { type: 'string' },
              description: 'Names of cities that match the user criteria'
            },
            explanation: {
              type: 'string',
              description: 'Brief explanation of why these cities match'
            }
          },
          required: ['matching_cities', 'explanation']
        }
      }];

      const result = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 500,
        tools,
        tool_choice: { type: 'tool', name: 'filter_cities' },
        messages: [{
          role: 'user',
          content: `Available cities: ${CITIES.map(c => `${c.name} (${c.region})`).join(', ')}.\n\nUser request: "${query}"\n\nFilter the cities list based on the user's request.`
        }]
      });

      const toolUse = result.content.find(b => b.type === 'tool_use');
      return res.json({
        type: 'search',
        matching_cities: toolUse.input.matching_cities,
        explanation: toolUse.input.explanation
      });
    }

    if (feature === 'ask') {
      const weatherSummary = Object.entries(weatherData)
        .map(([city, d]) => d.error
          ? `${city}: weather unavailable`
          : `${city}: ${d.temp}°F, ${d.condition}`)
        .join('\n');

      const result = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 400,
        system: `You are a helpful weather assistant. Current weather data:\n${weatherSummary}\n\nAnswer questions concisely and conversationally in 2-3 sentences max.`,
        messages: [{ role: 'user', content: query }]
      });

      return res.json({ type: 'ask', text: result.content[0].text });
    }

    if (feature === 'summarize') {
      const weatherSummary = Object.entries(weatherData)
        .map(([city, d]) => d.error
          ? `${city}: weather unavailable`
          : `${city}: ${d.temp}°F, ${d.condition}`)
        .join('\n');

      const result = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Current weather across 5 cities:\n${weatherSummary}\n\nWrite a friendly 2-3 sentence summary comparing the weather. Highlight interesting contrasts.`
        }]
      });

      return res.json({ type: 'summarize', text: result.content[0].text });
    }

    res.status(400).json({ error: 'Unknown feature' });

  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: 'Claude API request failed', detail: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
