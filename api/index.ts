import { createApiHandler } from '@vercel/node';
import axios from 'axios';
import { generateContent, fetchNews, handleCalculator } from './tools';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

export default createApiHandler(async (req, res) => {
  const { message, callback_query } = req.body;

  // Handle callback_query (inline keyboard)
  if (callback_query) {
    const chatId = callback_query.message.chat.id;
    const data = callback_query.data;
    if (data === '/write') {
      await sendMessage(chatId, 'Hãy nhập chủ đề bạn muốn viết. Ví dụ: /write marketing số');
    } else if (data === '/news') {
      await sendMessage(chatId, 'Hãy nhập từ khóa tin tức. Ví dụ: /news AI');
    } else if (data === '/calc') {
      await sendMessage(chatId, 'Hãy nhập biểu thức cần tính. Ví dụ: /calc 2+2*5');
    } else if (data === '/help') {
      await sendMenu(chatId);
    }
    return res.status(200).end();
  }

  if (!message) return res.status(200).end();
  const chatId = message.chat.id;

  // Hỗ trợ gửi ảnh, sticker, tài liệu, audio, video
  if (message.photo) {
    const fileId = message.photo[message.photo.length - 1].file_id;
    await sendMessage(chatId, 'Bạn vừa gửi một ảnh!');
    await sendPhoto(chatId, fileId, 'Ảnh bạn vừa gửi đây.');
    return res.status(200).end();
  }
  if (message.sticker) {
    await sendMessage(chatId, `Bạn vừa gửi một sticker! Emoji: ${message.sticker.emoji}`);
    return res.status(200).end();
  }
  if (message.document) {
    await sendMessage(chatId, `Bạn vừa gửi một file: ${message.document.file_name}`);
    await sendDocument(chatId, message.document.file_id);
    return res.status(200).end();
  }
  if (message.audio) {
    await sendMessage(chatId, `Bạn vừa gửi một audio!`);
    await sendAudio(chatId, message.audio.file_id);
    return res.status(200).end();
  }
  if (message.video) {
    await sendMessage(chatId, `Bạn vừa gửi một video!`);
    await sendVideo(chatId, message.video.file_id);
    return res.status(200).end();
  }

  const text = message.text || '';

  // Xử lý lệnh
  if (text.startsWith('/')) {
    const [command, ...args] = text.split(' ');
    switch (command) {
      case '/start':
      case '/help':
        await sendMenuWithKeyboard(chatId);
        break;
      case '/news':
        if (!args.length) {
          await sendMessage(chatId, 'Vui lòng nhập từ khóa. Ví dụ: /news AI');
        } else {
          const news = await fetchNews(args.join(' '));
          await sendMessage(chatId, news, { parse_mode: 'Markdown', disable_web_page_preview: false });
        }
        break;
      case '/write':
        if (!args.length) {
          await sendMessage(chatId, 'Vui lòng nhập chủ đề. Ví dụ: /write marketing số');
        } else {
          await sendMessage(chatId, 'Đang tạo nội dung, vui lòng đợi...');
          const content = await generateContent(args.join(' '));
          await sendMessage(chatId, content, { parse_mode: 'Markdown' });
        }
        break;
      case '/calc':
        if (!args.length) {
          await sendMessage(chatId, 'Vui lòng nhập biểu thức. Ví dụ: /calc 2+2*5');
        } else {
          const result = await handleCalculator(args.join(' '));
          await sendMessage(chatId, result);
        }
        break;
      default:
        await sendMessage(chatId, '⚠️ Lệnh không hợp lệ! Gõ /help để xem hướng dẫn.');
    }
    return res.status(200).end();
  }

  // Xử lý tin nhắn thường
  await sendMessage(chatId, 'Đang suy nghĩ...');
  const aiResponse = await callOpenRouter(text);
  await sendMessage(chatId, aiResponse, { parse_mode: 'Markdown' });
  return res.status(200).end();
});

// Gọi OpenRouter AI
async function callOpenRouter(prompt: string) {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    },
    { headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}` } }
  );
  return response.data.choices[0].message.content;
}

// Gửi tin nhắn về Telegram
async function sendMessage(chatId: number, text: string, options: any = {}) {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: chatId,
    text: text,
    parse_mode: options.parse_mode || 'Markdown',
    disable_web_page_preview: options.disable_web_page_preview || false,
    reply_markup: options.reply_markup
  });
}

// Gửi ảnh
async function sendPhoto(chatId: number, fileId: string, caption = '') {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
    chat_id: chatId,
    photo: fileId,
    caption
  });
}

// Gửi file tài liệu
async function sendDocument(chatId: number, fileId: string, caption = '') {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
    chat_id: chatId,
    document: fileId,
    caption
  });
}

// Gửi audio
async function sendAudio(chatId: number, fileId: string, caption = '') {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendAudio`, {
    chat_id: chatId,
    audio: fileId,
    caption
  });
}

// Gửi video
async function sendVideo(chatId: number, fileId: string, caption = '') {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVideo`, {
    chat_id: chatId,
    video: fileId,
    caption
  });
}

// Hiển thị menu chức năng với inline keyboard
async function sendMenuWithKeyboard(chatId: number) {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: chatId,
    text: '🤖 *AI Assistant Pro*\nChọn chức năng:',
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Viết nội dung', callback_data: '/write' }],
        [{ text: 'Tin tức', callback_data: '/news' }],
        [{ text: 'Tính toán', callback_data: '/calc' }],
        [{ text: 'Hướng dẫn', callback_data: '/help' }]
      ]
    }
  });
}

// Hiển thị menu chức năng (text)
async function sendMenu(chatId: number) {
  const menu = `
🤖 *AI Assistant Pro*  
Chọn chức năng:  
- \`/write [chủ đề]\` → Viết nội dung  
- \`/news [từ khóa]\` → Tổng hợp tin tức  
- \`/calc [biểu thức]\` → Tính toán  
- \`/help\` → Hướng dẫn  
  `;
  await sendMessage(chatId, menu, { parse_mode: 'Markdown' });
}
