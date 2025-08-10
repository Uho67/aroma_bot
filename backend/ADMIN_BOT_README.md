# Admin Bot Setup and Usage

## Overview
The Admin Bot is a Telegram bot that allows administrators to query coupon codes and track their usage.

## Setup

### 1. Create a New Telegram Bot
1. Message @BotFather on Telegram
2. Use `/newbot` command
3. Follow the instructions to create your admin bot
4. Copy the bot token

### 2. Configure Environment
Add your admin bot token to the `.env` file:
```bash
ADMIN_BOT_TOKEN="your_actual_admin_bot_token_here"
```

### 3. Start the Bot
The admin bot will automatically start when you run the backend server.

## Usage

### Querying Coupon Codes
1. Send any coupon code to the admin bot
2. The bot will return detailed information:
   - Coupon code
   - Maximum uses allowed
   - Current usage count
   - Associated user information
   - Sales rule details
   - "Use Coupon" button

### Using Coupons
1. Click the "🎫 Использовать купон" button
2. The bot will:
   - Increment the usage count
   - Update the timestamp
   - Show success message
   - Change button to "✅ Купон использован"

### Features
- **Real-time Updates**: Button state changes after use
- **Usage Tracking**: Automatically increments `uses_count`
- **User Information**: Shows which user the coupon belongs to
- **Sales Rule Details**: Displays associated promotion information
- **Error Handling**: Graceful handling of invalid codes and already-used coupons

## Security
- Only administrators should have access to this bot
- The bot can modify coupon usage data
- Consider restricting access to trusted admin users only

## Troubleshooting
- Ensure `ADMIN_BOT_TOKEN` is set in `.env`
- Check that the backend server is running
- Verify the bot has been started by @BotFather
- Monitor server logs for any initialization errors 