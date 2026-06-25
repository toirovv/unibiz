const TELEGRAM_API = "https://api.telegram.org/bot";

export async function sendMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function setWebhook(
  botToken: string,
  webhookUrl: string
): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function formatDebtReminder(
  debts: Array<{
    customerName: string;
    amount: number;
    remainingAmount: number;
    dueDate: Date;
    status: string | null;
  }>
): string {
  const lines = ["<b>🇺🇿 Eslatma: Bugungi qarzlar</b>\n"];

  if (debts.length === 0) {
    lines.push("✅ Bugun muddati o'tgan yoki to'lanishi kerak bo'lgan qarzlar yo'q.");
    return lines.join("\n");
  }

  const overdue = debts.filter((d) => d.status === "OVERDUE");
  const dueToday = debts.filter((d) => d.status === "ACTIVE");

  if (overdue.length > 0) {
    lines.push(`<b>⚠️ Muddati o'tgan qarzlar (${overdue.length}):</b>`);
    overdue.forEach((d) => {
      lines.push(
        `👤 ${d.customerName}\n💰 Qarz: ${d.amount.toLocaleString()} so'm\n💳 Qolgan: ${d.remainingAmount.toLocaleString()} so'm\n📅 Muddati: ${new Date(d.dueDate).toLocaleDateString("uz-UZ")}\n`
      );
    });
  }

  if (dueToday.length > 0) {
    lines.push(`<b>📅 Bugun to'lanishi kerak (${dueToday.length}):</b>`);
    dueToday.forEach((d) => {
      lines.push(
        `👤 ${d.customerName}\n💰 Qarz: ${d.amount.toLocaleString()} so'm\n💳 Qolgan: ${d.remainingAmount.toLocaleString()} so'm\n`
      );
    });
  }

  return lines.join("\n");
}
