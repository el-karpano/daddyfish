import asyncio
import logging
from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import Message, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command
from dotenv import load_dotenv
import os

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "")

router = Router()


@router.message(Command("start"))
async def cmd_start(message: Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="🎣 Открыть мою рыбалку",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )
    ]])
    await message.answer(
        "🎣 <b>Добро пожаловать в «Мою рыбалку»</b>\n\n"
        "Твой личный рыбацкий дневник.\n"
        "Сохраняй места, отслеживай улов и храни воспоминания.",
        reply_markup=keyboard,
        parse_mode="HTML"
    )


async def main():
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()
    dp.include_router(router)
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
