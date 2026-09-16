import asyncio
import logging
from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import Message, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command, CommandStart
from dotenv import load_dotenv
import os

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "")

router = Router()


def get_or_create_user_sync(telegram_data: dict) -> dict | None:
    """Sync wrapper for user creation."""
    from app.telegram_auth import get_or_create_user
    return get_or_create_user(telegram_data)


def join_club_by_token_sync(token: str, telegram_data: dict) -> dict | None:
    """Sync wrapper for joining club."""
    from app.telegram_auth import join_club_by_token
    return join_club_by_token(token, telegram_data)


def get_user_club_sync(user_id: int) -> dict | None:
    """Sync wrapper for getting user's club."""
    from app.telegram_auth import get_user_club
    return get_user_club(user_id)


@router.message(CommandStart(deep_link=True))
async def cmd_start_with_invite(message: Message, command: CommandStart):
    """Handle /start with invite token."""
    deep_link = command.args
    if not deep_link or not deep_link.startswith("invite_"):
        return await cmd_start(message)

    token = deep_link.replace("invite_", "")

    telegram_data = {
        "id": message.from_user.id,
        "first_name": message.from_user.first_name or "",
        "last_name": message.from_user.last_name or "",
        "username": message.from_user.username or "",
    }

    user = join_club_by_token_sync(token, telegram_data)
    if not user:
        await message.answer(
            "❌ <b>Ссылка недействительна</b>\n\n"
            "Возможно, приглашение было отменено. Попросите владельца клуба создать новое приглашение.",
            parse_mode="HTML"
        )
        return

    keyboard = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="🎣 Открыть клуб",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )
    ]])
    await message.answer(
        "🎣 <b>Добро пожаловать в рыбацкий клуб!</b>\n\n"
        "Теперь ты можешь добавлять свои рыбалки и видеть рыбалки друзей.\n\n"
        "Открой приложение, чтобы начать.",
        reply_markup=keyboard,
        parse_mode="HTML"
    )


@router.message(Command("start"))
async def cmd_start(message: Message):
    """Handle /start without invite."""
    telegram_data = {
        "id": message.from_user.id,
        "first_name": message.from_user.first_name or "",
        "last_name": message.from_user.last_name or "",
        "username": message.from_user.username or "",
    }

    # Ensure user exists
    user = get_or_create_user_sync(telegram_data)

    # Check if user is in a club
    club = None
    if user:
        club = get_user_club_sync(user["id"])

    if club:
        keyboard = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text="🎣 Открыть клуб",
                web_app=WebAppInfo(url=WEBAPP_URL)
            )
        ]])
        await message.answer(
            f"🎣 <b>{club.get('name', 'Рыбацкий клуб')}</b>\n\n"
            "Твой личный рыбацкий дневник.\n"
            "Сохраняй места, отслеживай улов и храни воспоминания.",
            reply_markup=keyboard,
            parse_mode="HTML"
        )
    else:
        await message.answer(
            "🎣 <b>Моя рыбалка</b>\n\n"
            "Ты пока не состоишь в клубе.\n"
            "Попроси владельца клуба прислать тебе приглашение.",
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