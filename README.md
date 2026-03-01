# BardoPromedio Discord Bot

A versatile Discord bot built with Discord.js that includes RSS feed tracking, moderation tools, and fun interaction commands.

## Features

### RSS Feed System
- Track multiple RSS feeds across different channels
- Automatic posting of new content
- Customizable embed messages for feed updates
- Feed management commands

### Moderation Commands
- `/ban` - Ban users with reason
- `/kick` - Kick users from the server
- `/timeout` - Temporarily mute users
- Ticket system for user support

### Fun Commands
- `/kiss` - Send anime kiss interactions
- `/confesiones` - Anonymous confession system
- Interactive button menus

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/BardoPromedio_Bot.git
cd BardoPromedio_Bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your credentials:
```env
DISCORD_TOKEN=your_discord_token
MONGODB_URI=your_mongodb_uri
```

4. Start the bot:
```bash
node index.js
```

## Dependencies

- discord.js: ^14.11.0
- mongoose: ^8.14.0
- rss-parser: ^3.13.0
- dotenv: ^16.5.0
- anime-actions: ^1.0.6

## Commands

### Moderation
- `/ban` - Ban a user
- `/kick` - Kick a user
- `/timeout` - Timeout a user
- `/ticket` - Create support tickets

### RSS Feeds
- `/rrss add` - Add new RSS feed
- `/rrss list` - List configured feeds
- `/rrss remove` - Remove a feed
- `/rrss check` - Check latest feed items

### Fun
- `/kiss` - Kiss another user
- `/confesiones` - Make anonymous confessions
- `/ping` - Check bot latency

## Project Structure
```
BardoPromedio_Bot/
├── Commands/
│   ├── Moderacion/
│   └── Public/
├── Events/
│   ├── Client/
│   └── Interactions/
├── Functions/
├── Handlers/
├── Models/
├── Services/
├── .env
└── index.js
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
ISC

*Note: Remember to replace sensitive information like tokens and credentials before sharing your code.*