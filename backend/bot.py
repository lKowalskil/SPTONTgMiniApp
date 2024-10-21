from flask import Flask, request, jsonify
from telegram import Bot
from telegram.error import TelegramError
import logging
import asyncio
from config import Config
from tenacity import retry, wait_fixed, stop_after_attempt

app = Flask(__name__)

BOT_TOKEN = Config.TELEGRAM_BOT_TOKEN
bot = Bot(token=BOT_TOKEN)

logging.basicConfig(level=logging.INFO)

@retry(wait=wait_fixed(2), stop=stop_after_attempt(3))  # Retry up to 3 times, waiting 2 seconds between attempts
async def get_chat_member(channel_id, user_id):
    return await bot.get_chat_member(channel_id, user_id)

@app.route('/check_subscription', methods=['GET'])
def check_subscription():
    user_id = request.args.get('user_id')
    channel_id = request.args.get('channel_id')

    if not user_id or not channel_id:
        return jsonify({"error": "user_id and channel_id are required"}), 400

    try:
        user_id = int(user_id)

        # Run the asynchronous method in the event loop with retry
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        chat_member = loop.run_until_complete(get_chat_member(channel_id, user_id))
        status = chat_member.status

        if status in ['member', 'administrator', 'creator']:
            return jsonify({"is_subscriber": True}), 200
        else:
            return jsonify({"is_subscriber": False}), 200
    except TelegramError as e:
        logging.error(f"Telegram error occurred: {e}")
        if e.message == "User not found":
            return jsonify({"is_subscriber": False}), 200
        return jsonify({"error": str(e)}), 500
    except ValueError:
        return jsonify({"error": "Invalid user_id format"}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5001)
