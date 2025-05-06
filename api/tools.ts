import axios from 'axios';

// Helper to call OpenRouter
async function callOpenRouter(prompt: string) {
  const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'qwen/qwen3-32b:free',
      messages: [{ role: 'user', content: prompt }],
    },
    { headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}` } }
  );
  return response.data.choices[0].message.content;
}

export async function generateContent(topic: string) {
  const prompt = `
  Bạn là một chuyên gia content marketing. Hãy viết một bài ngắn về chủ đề: "${topic}".
  Yêu cầu:
  - Giọng văn tự nhiên, hấp dẫn
  - Có tiêu đề, mở bài, thân bài, kết luận
  - Dùng markdown để định dạng
  `;
  // Gọi OpenRouter để tạo nội dung
  const response = await callOpenRouter(prompt);
  return response;
}

export async function fetchNews(keyword: string) {
  const newsAPI = process.env.NEWS_API_KEY;
  const url = `https://newsapi.org/v2/everything?q=${keyword}&apiKey=${newsAPI}`;
  
  const response = await axios.get(url);
  const articles = response.data.articles.slice(0, 3); // Lấy 3 tin
  
  let result = `📰 **Tin tức mới nhất về \"${keyword}\"**\n\n`;
  articles.forEach(article => {
    result += `🔹 [${article.title}](${article.url})\n`;
  });
  
  return result;
}

export async function handleCalculator(expression: string) {
  try {
    // Very basic and unsafe eval for demo only!
    // In production, use a math library like mathjs.
    // eslint-disable-next-line no-eval
    const result = eval(expression);
    return `Kết quả: ${result}`;
  } catch {
    return 'Biểu thức không hợp lệ!';
  }
}
