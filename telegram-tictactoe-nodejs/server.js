const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();

// TOKEN BOT TELEGRAM
const token = '8955698799:AAGSKdFu3z9TQ84_0nhYqKLvW8JqybJkBdI';

// LINK GAME HTML5
const GAME_URL = 'https://tic-tac-five-ochre.vercel.app/';

// Membuat bot Telegram
const bot = new TelegramBot(token, { polling: true });

// Saat user mengetik /start
bot.onText(/\/start/, (msg) => {

    // ID chat user
    const chatId = msg.chat.id;

    // Mengambil data user Telegram
    const firstName = msg.from.first_name || '';
    const lastName = msg.from.last_name || '';
    const username = msg.from.username || 'Tidak ada username';

    // Nama lengkap user
    const fullName = `${firstName} ${lastName}`;

    // Link game + data user Telegram
    const gameUrlWithUser = `${GAME_URL}?name=${encodeURIComponent(fullName)}&username=${encodeURIComponent(username)}`;

    // Mengirim pesan
    bot.sendMessage(chatId,

        `Halo ${fullName} 👋
Selamat datang di Tic Tac Toe!

Username Telegram: @${username}`,

        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🎮 Play Game',
                            web_app: {
                                url: gameUrlWithUser
                            }
                        }
                    ]
                ]
            }
        }

    );

});

// Menjalankan server Express
app.listen(3000, () => {
    console.log('Server berjalan di port 3000');
});