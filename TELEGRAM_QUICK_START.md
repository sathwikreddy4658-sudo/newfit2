# Telegram Notifications - Quick Start

## ⚡ What's Done
- ✅ Firestore trigger uncommented in Cloud Functions
- ✅ Frontend notification functions updated  
- ✅ Ready for deployment

## 🚀 Deploy Now (2 minutes)

### Step 1: Set Environment Variables
Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Functions → Settings

Add these 3 variables:
```
TELEGRAM_BOT_TOKEN = your_bot_token_here
TELEGRAM_CHAT_ID = your_chat_id_here  
SITE_URL = https://freelit.in
```

### Step 2: Build & Deploy

```bash
# Move to functions folder
cd functions

# Build TypeScript
npm run build

# Deploy
firebase deploy --only functions
```

## 🧪 Test It
1. Place a COD order
2. Check Telegram - you'll receive a message instantly ✅

## ❓ Don't Have Telegram Bot Credentials?

1. Chat with [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Follow prompts to get API token
4. Get chat ID from: `https://api.telegram.org/botYOUR_TOKEN/getUpdates`

---

**Full Setup Guide:** See [TELEGRAM_NOTIFICATIONS_SETUP.md](TELEGRAM_NOTIFICATIONS_SETUP.md)
