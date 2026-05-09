// Netlify Function: Generate an image using AI
// This implementation uses Pollinations.ai for high-speed, free image generation
// but you can swap it with Imagen 3 or DALL-E if you have those API keys.

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { prompt } = JSON.parse(event.body || "{}");
    
    if (!prompt) {
      return { statusCode:400, body: "Missing prompt" };
    }

    // Using Flux via Pollinations for ultra-high quality "buttery smooth" images
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=1024&height=1024&nologo=true&model=flux`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: imageUrl }),
    };
  } catch (e) {
    return { statusCode: 500, body: String(e?.message || e) };
  }
};
