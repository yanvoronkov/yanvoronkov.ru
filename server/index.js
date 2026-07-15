import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import path from 'path';
import { fileURLToPath } from 'url';

// Загрузка переменных окружения из .env файла
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Инициализация Resend SDK
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

// Настройка Middleware
app.use(cors());
app.use(express.json());

// Проверочный маршрут
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API-сервер работает корректно' });
});

// Маршрут для обработки заявок с формы обратной связи
app.post('/api/contact', async (req, res) => {
  const { name, contact, desc } = req.body;

  // Валидация полей
  if (!name || !contact || !desc) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Все поля (Имя, Контакт, Описание) обязательны для заполнения.'
    });
  }

  const results = {
    telegram: false,
    emailSeller: false,
    emailClient: false
  };

  const errors = [];

  // 1. Отправка уведомления в Telegram
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    try {
      const textMessage = `🔔 *Новая заявка с лендинга* 🔔\n\n` +
                          `👤 *Имя:* ${name}\n` +
                          `📞 *Контакт:* \`${contact}\`\n\n` +
                          `💬 *Задача / Описание:* \n${desc}`;

      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: textMessage,
          parse_mode: 'Markdown'
        })
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        results.telegram = true;
      } else {
        throw new Error(data.description || 'Неизвестная ошибка Telegram API');
      }
    } catch (err) {
      console.error('Ошибка отправки в Telegram:', err.message);
      errors.push(`Telegram: ${err.message}`);
    }
  } else {
    console.warn('Telegram не настроен (пропущены токен или ID чата)');
  }

  // 2. Отправка писем через Resend
  if (resend) {
    const fromEmail = process.env.FROM_EMAIL || 'design@yanvoronkov.ru';
    const sellerEmail = process.env.NOTIFICATION_EMAIL || 'design@yanvoronkov.ru';

    // А. Отправка уведомления продавцу (Яну)
    try {
      const sellerHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #fafafa;">
          <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">Новая заявка с сайта yanvoronkov.ru</h2>
          <p><strong>Имя клиента:</strong> ${name}</p>
          <p><strong>Telegram / Почта:</strong> ${contact}</p>
          <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #8b5cf6; border-radius: 4px; margin-top: 20px;">
            <p style="margin-top: 0; font-weight: bold;">Поставленная задача:</p>
            <p style="white-space: pre-wrap; color: #3f3f46;">${desc}</p>
          </div>
          <p style="font-size: 12px; color: #71717a; margin-top: 30px; border-top: 1px solid #e4e4e7; padding-top: 15px;">
            Сообщение отправлено автоматически сервером лендинга.
          </p>
        </div>
      `;

      const { error } = await resend.emails.send({
        from: fromEmail,
        to: sellerEmail,
        subject: `🔔 Новая заявка от ${name}`,
        html: sellerHtml,
      });

      if (error) {
        throw new Error(error.message);
      }
      results.emailSeller = true;
    } catch (err) {
      console.error('Ошибка отправки письма продавцу:', err.message);
      errors.push(`Email Seller: ${err.message}`);
    }

    // Б. Отправка письма-подтверждения клиенту (если в поле "контакт" передан валидный email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(contact.trim());

    if (isEmail) {
      try {
        const clientHtml = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif, Arial; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff; color: #09090b;">
            <!-- Логотип -->
            <div style="display: flex; align-items: center; margin-bottom: 25px;">
              <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); display: flex; align-items: center; justify-content: center; font-family: monospace; font-weight: bold; color: white; font-size: 18px; text-align: center; line-height: 40px;">
                ЯВ
              </div>
              <div style="margin-left: 12px;">
                <div style="font-weight: bold; font-size: 16px; line-height: 1;">Ян Воронков</div>
                <div style="font-size: 11px; color: #71717a; margin-top: 3px; font-family: monospace;">DESIGN & DEVELOPMENT</div>
              </div>
            </div>
            
            <h2 style="font-size: 22px; font-weight: 700; margin-top: 0; color: #09090b; letter-spacing: -0.02em;">Здравствуйте, ${name}!</h2>
            <p style="font-size: 15px; color: #3f3f46; line-height: 1.6; margin-bottom: 20px;">
              Ваше обращение по разработке цифрового продукта успешно принято. Я уже изучаю детали вашей задачи и свяжусь с вами в ближайшее время (обычно в течение 30 минут в рабочее время).
            </p>
            
            <div style="background-color: #fafafa; padding: 20px; border-radius: 12px; border: 1px solid #f4f4f5; margin-bottom: 25px;">
              <h3 style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 0; color: #71717a; letter-spacing: 0.05em; font-family: monospace;">Детали вашей заявки</h3>
              <p style="font-size: 14px; color: #18181b; margin-bottom: 8px;"><strong>Имя:</strong> ${name}</p>
              <p style="font-size: 14px; color: #18181b; margin-bottom: 12px;"><strong>Ваш контакт:</strong> ${contact}</p>
              <div style="border-top: 1px solid #e4e4e7; padding-top: 12px; margin-top: 12px;">
                <p style="font-size: 13px; color: #71717a; margin-bottom: 6px;">Описание задачи:</p>
                <p style="font-size: 14px; color: #3f3f46; margin-top: 0; white-space: pre-wrap; line-height: 1.5;">${desc}</p>
              </div>
            </div>
            
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
              Если у вас появились дополнительные файлы, макеты или требования, вы можете отправить их в ответ на это письмо или написать мне напрямую в Telegram: <a href="https://t.me/yanvoronkov" style="color: #6366f1; text-decoration: none; font-weight: 600;">@yanvoronkov</a>.
            </p>
            
            <p style="font-size: 15px; font-weight: 600; color: #09090b; margin-top: 30px; margin-bottom: 5px;">С уважением,</p>
            <p style="font-size: 14px; color: #71717a; margin-top: 0;">Ян Воронков</p>
            
            <div style="font-size: 11px; color: #a1a1aa; margin-top: 40px; border-top: 1px solid #f4f4f5; padding-top: 15px; text-align: center; font-family: monospace;">
              © ${new Date().getFullYear()} YAN VORONKOV. ALL RIGHTS RESERVED.
            </div>
          </div>
        `;

        const { error } = await resend.emails.send({
          from: fromEmail,
          to: contact.trim(),
          subject: 'Ваша заявка успешно принята | Ян Воронков',
          html: clientHtml,
        });

        if (error) {
          throw new Error(error.message);
        }
        results.emailClient = true;
      } catch (err) {
        console.error('Ошибка отправки письма клиенту:', err.message);
        errors.push(`Email Client: ${err.message}`);
      }
    } else {
      console.log('Контакт не является email-адресом, письмо клиенту не отправлялось.');
    }
  } else {
    console.warn('Resend не настроен (пропущен API-ключ)');
  }

  // Если хотя бы одна из интеграций успешно отработала, считаем запрос успешным
  if (results.telegram || results.emailSeller) {
    return res.status(200).json({
      success: true,
      message: 'Заявка успешно обработана и отправлена.',
      results,
      errors: errors.length > 0 ? errors : null
    });
  } else {
    return res.status(500).json({
      error: true,
      code: 'SENDING_FAILED',
      message: 'Не удалось отправить заявку ни по одному из каналов связи.',
      errors
    });
  }
});

// Определение путей для ES-модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Раздача статических файлов фронтенда из папки ../dist
app.use(express.static(path.join(__dirname, '../dist')));

// Все запросы, кроме API, направляем на index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`[Server] Сервер запущен на порту ${PORT}`);
});
