# Telegram Assistant Bot

A useful Telegram chatbot that can assist you with various tasks.

## Features
- Basic conversation handling
- Time information
- Weather information (coming soon)
- Help commands

## Setup
1. Create a `.env` file in the root directory with your Telegram bot token:
```
TELEGRAM_BOT_TOKEN=your_token_here
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the bot:
```bash
python bot.py
```

## Usage
- Start a conversation: `/start`
- Get help: `/help`
- Get current time: `/time`
- Get weather information: `/weather <city>`

## Note
- The weather feature is currently a placeholder and will be implemented with a weather API integration.
- Make sure to keep your bot token secure and never share it publicly.
