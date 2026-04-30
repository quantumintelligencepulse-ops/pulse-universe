import discord
import requests
import asyncio

# -----------------------------
# CONFIG
# -----------------------------
DISCORD_TOKEN = "PASTE_YOUR_TEST_BOT_TOKEN_HERE"  # <-- your token

API_URL = "http://127.0.0.1:1234/v1/chat/completions"
MODEL_NAME = "qwen2.5-3b-instruct"

AI_CHANNEL_ID = 1433383711587434518  # #pulsechat

# Speed tuning
MAX_TOKENS = 220          # lower = faster replies
TEMPERATURE = 0.7         # balanced creativity
TIMEOUT_SECONDS = 25      # avoid hanging forever

intents = discord.Intents.default()
intents.message_content = True

client = discord.Client(intents=intents)


# -----------------------------
# STARTUP MESSAGE
# -----------------------------
async def send_startup_message():
    await client.wait_until_ready()
    channel = client.get_channel(AI_CHANNEL_ID)

    tries = 0
    while channel is None and tries < 5:
        await asyncio.sleep(2)
        channel = client.get_channel(AI_CHANNEL_ID)
        tries += 1

    if channel:
        try:
            await channel.send("✅ **Pulse AI is online.**")
            await channel.send("⚡ Optimized for speed. Keep messages focused for fastest replies.")
        except Exception as e:
            print(f"[Startup] Could not send startup message: {e}")
    else:
        print("[Startup] Could not find AI channel after retries.")


@client.event
async def on_ready():
    print(f"[READY] Logged in as {client.user} (ID: {client.user.id})")
    client.loop.create_task(send_startup_message())


# -----------------------------
# HELPER: CALL LOCAL MODEL
# -----------------------------
def call_local_model(user_message: str) -> str:
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are Pulse, a fast, focused AI assistant in the Equity Network Discord. "
                    "Reply concisely, avoid rambling, and answer directly."
                ),
            },
            {"role": "user", "content": user_message},
        ],
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
    }

    try:
        response = requests.post(API_URL, json=payload, timeout=TIMEOUT_SECONDS)
        data = response.json()

        if "choices" not in data or not data["choices"]:
            return "I couldn't generate a response. Try asking in a simpler way."

        reply = data["choices"][0]["message"]["content"]
        if not reply or not reply.strip():
            return "I generated an empty response. Try again with a clearer question."

        return reply.strip()

    except requests.exceptions.Timeout:
        return "The local model took too long to respond. Try a shorter or simpler message."
    except Exception as e:
        return f"Error talking to the local AI: `{e}`"


# -----------------------------
# AUTO-REPLY LOGIC
# -----------------------------
@client.event
async def on_message(message: discord.Message):
    # Ignore self
    if message.author == client.user:
        return

    # Only respond in the AI channel
    if message.channel.id != AI_CHANNEL_ID:
        return

    content = message.content.strip()
    if not content:
        return

    # Optional: ignore extremely long messages for speed
    if len(content) > 2000:
        await message.channel.send(
            "Your message is very long. For speed, try sending a shorter question or chunking it."
        )
        return

    async with message.channel.typing():
        reply = call_local_model(content)

    # Send reply
    try:
        await message.channel.send(reply)
    except Exception as e:
        print(f"[Send] Failed to send message: {e}")


# -----------------------------
# START BOT
# -----------------------------
if __name__ == "__main__":
    print("[BOOT] Starting Pulse AI...")
    client.run(DISCORD_TOKEN)
