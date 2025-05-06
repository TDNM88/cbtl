import os
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler
import requests
from datetime import datetime
import random

# Load environment variables
load_dotenv()

# Initialize the bot
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
WEATHER_API_KEY = os.getenv('WEATHER_API_KEY')  # Add this to your .env file
if not TOKEN:
    raise ValueError("Please set TELEGRAM_BOT_TOKEN in your .env file")

# Create application
application = Application.builder().token(TOKEN).build()

# Command handlers
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    keyboard = [
        [
            InlineKeyboardButton("Weather", callback_data='weather'),
            InlineKeyboardButton("Time", callback_data='time'),
        ],
        [
            InlineKeyboardButton("Joke", callback_data='joke'),
            InlineKeyboardButton("Search", callback_data='search'),
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"Hi {user.first_name}! I'm your helpful assistant. Tap a button or use commands:\n"
        "\n/start - Start the conversation\n"
        "\n/help - Show available commands\n"
        "\n/weather <city> - Get weather information\n"
        "\n/time - Get current time\n"
        "\n/joke - Get a random joke\n"
        "\n/search <query> - Search the web\n"
    , reply_markup=reply_markup)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Here are the commands I can help you with:\n"
        "\n/start - Start the conversation\n"
        "\n/help - Show available commands\n"
        "\n/weather <city> - Get weather information\n"
        "\n/time - Get current time\n"
        "\n/joke - Get a random joke\n"
        "\n/search <query> - Search the web\n"
    )

async def time_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    current_time = datetime.now().strftime("%H:%M:%S")
    await update.message.reply_text(f"The current time is: {current_time}")

async def weather_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if len(context.args) < 1:
        await update.message.reply_text("Please provide a city name. Usage: /weather <city>")
        return
    
    city = " ".join(context.args)
    try:
        response = requests.get(
            f"http://api.openweathermap.org/data/2.5/weather",
            params={
                'q': city,
                'appid': WEATHER_API_KEY,
                'units': 'metric'
            }
        )
        data = response.json()
        
        if data['cod'] == 200:
            weather = data['weather'][0]['description']
            temp = data['main']['temp']
            humidity = data['main']['humidity']
            wind_speed = data['wind']['speed']
            
            message = f"Weather in {city}:\n"
            message += f"Description: {weather}\n"
            message += f"Temperature: {temp}°C\n"
            message += f"Humidity: {humidity}%\n"
            message += f"Wind Speed: {wind_speed} m/s"
            
            await update.message.reply_text(message)
        else:
            await update.message.reply_text(f"Could not find weather information for {city}")
    except Exception as e:
        await update.message.reply_text(f"Error fetching weather: {str(e)}")

async def joke_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        response = requests.get('https://official-joke-api.appspot.com/jokes/random')
        joke = response.json()
        await update.message.reply_text(joke['setup'])
        await update.message.reply_text(joke['punchline'])
    except:
        await update.message.reply_text("Sorry, couldn't fetch a joke right now.")

async def search_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if len(context.args) < 1:
        await update.message.reply_text("Please provide a search query. Usage: /search <query>")
        return
    
    query = " ".join(context.args)
    try:
        response = requests.get(
            'https://www.googleapis.com/customsearch/v1',
            params={
                'key': os.getenv('GOOGLE_API_KEY'),
                'cx': os.getenv('GOOGLE_CSE_ID'),
                'q': query
            }
        )
        data = response.json()
        
        if 'items' in data:
            results = []
            for item in data['items'][:3]:  # Show top 3 results
                results.append(f"{item['title']}\n{item['link']}\n{item['snippet']}\n\n")
            
            await update.message.reply_text("Here are some search results:")
            for result in results:
                await update.message.reply_text(result)
        else:
            await update.message.reply_text("No results found for your search.")
    except Exception as e:
        await update.message.reply_text(f"Error searching: {str(e)}")

async def button(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    if query.data == 'weather':
        await query.message.reply_text("Please enter a city name:")
    elif query.data == 'time':
        await time_command(query.message, context)
    elif query.data == 'joke':
        await joke_command(query.message, context)
    elif query.data == 'search':
        await query.message.reply_text("Please enter your search query:")

async def unknown_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Sorry, I didn't understand that command. Use /help to see available commands."
    )

async def echo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(update.message.text)

# Add handlers
application.add_handler(CommandHandler("start", start))
application.add_handler(CommandHandler("help", help_command))
application.add_handler(CommandHandler("time", time_command))
application.add_handler(CommandHandler("weather", weather_command))
application.add_handler(CommandHandler("joke", joke_command))
application.add_handler(CommandHandler("search", search_command))
application.add_handler(MessageHandler(filters.COMMAND, unknown_command))
application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, echo))
application.add_handler(CallbackQueryHandler(button))

# Run the bot
if __name__ == "__main__":
    print("Starting Telegram bot...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)
