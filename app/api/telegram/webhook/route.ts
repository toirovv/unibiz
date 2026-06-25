import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const update = await req.json();

    if (update.message?.text === "/start") {
      const chatId = update.message.chat.id.toString();
      const text = "🇺🇿 UNIBIZ botiga xush kelibsiz!\n\nKunlik eslatmalarni olish uchun botni sozlamalar bo'limida sozlang.";

      if (process.env.TELEGRAM_BOT_TOKEN) {
        await sendMessage(process.env.TELEGRAM_BOT_TOKEN, chatId, text);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
