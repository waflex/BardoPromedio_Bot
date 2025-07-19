# Security Policy

This document outlines the security practices and guidelines for the **BardoPromedio Discord Bot** project. It includes instructions for reporting vulnerabilities, securing sensitive data, and ensuring the bot operates safely in production environments.

---

## Supported Versions

The following versions of the bot are actively supported with security updates:

| Version | Supported          |
|---------|--------------------|
| 1.0.0   | ✅ Yes             |

---

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please follow these steps:

1. **Do not disclose publicly**: Avoid sharing the vulnerability in public forums or repositories.
2. **Contact the Maintainer**: Send an email to `jonathan.rojas.asc@gmail.com` with the following details:
   - A detailed description of the vulnerability.
   - Steps to reproduce the issue.
   - Any potential impact or exploit scenarios.
3. **Response Time**: I aim to respond to security reports within 48 hours and provide a resolution within 7 days.

---

## Security Best Practices for Deployment

### 1. **Environment Variables**
The bot uses sensitive credentials stored in the `.env` file. Ensure the following:
- **Never commit the `.env` file to version control**. It is already included in the `.gitignore` file.
- Example `.env` file:
  ```properties
  DISCORD_TOKEN=your_discord_bot_token
  MONGODB_URI=your_mongodb_connection_string
  TWITCH_CLIENT_ID=your_twitch_client_id
  TWITCH_CLIENT_SECRET=your_twitch_client_secret
  ```
- Rotate credentials periodically and revoke unused tokens.

### 2. **Database Security**
The bot uses MongoDB for storing data. Ensure the following:
- Use a strong password for the MongoDB user.
- Restrict access to the database by IP or VPC.
- Enable SSL/TLS for secure communication with the database.

### 3. **Discord Bot Permissions**
Use the least privileged permissions when inviting the bot to a server.
- Example invite URL with limited permissions:
- Avoid granting Administrator permissions unless absolutely necessary.

### 4. **Rate Limiting**
Discord has strict rate limits. Ensure the bot does not spam API requests, especially in commands like `/rrss check` or Twitch notifications.

### 5. **Error Handling**
All commands and services include error handling to prevent crashes. For example:
- `TwitchService.js` handles API errors gracefully.
- `RssService.js` logs errors when fetching RSS feeds.

### 6. **Logging and Monitoring**
Monitor the bot's logs for suspicious activity or errors.
- Use tools like `pm2` or Docker to manage and monitor the bot in production.

---

## Security Features in the Codebase

### 1. **Command Permissions**
Commands like `/ban`, `/kick`, and `/timeout` are restricted to users with appropriate permissions.

### 2. **Input Validation**
User inputs are validated to prevent abuse. For example:
- In `streamers.js`, Twitch usernames are validated before adding them to the database.
- In `rrss.js`, RSS feed URLs are validated using the `rss-parser` library.

### 3. **Database Indexing**
Models like `Streamer.js` and `KissCounter.js` use indexes to prevent duplicate entries and improve query performance.

### 4. **Error Logging**
Errors are logged to the console for debugging.

---

## How to Securely Test the Bot

### 1. **Use a Test Server**
Always test the bot in a private Discord server before deploying it to production.

### 2. **Enable Debugging**
Use `nodemon` for live testing during development:
- Add breakpoints in VS Code or use `console.log` for debugging.

### 3. **Test Commands**
Test all commands, especially those with external integrations like Twitch (`/streamers`) or RSS feeds (`/rrss`).

### 4. **Monitor API Usage**
Monitor Twitch and Discord API usage to ensure the bot stays within rate limits.

---

## Known Issues

- **Rate Limits**: High-frequency commands like `/rrss check` or Twitch notifications may hit API rate limits if not managed properly.
- **Error Handling**: Some edge cases in Twitch API responses may not be fully handled.

---

## Future Improvements

- Implement centralized logging with tools like Winston or Loggly.
- Add support for encrypted storage of sensitive data.
- Introduce automated security testing in the CI/CD pipeline.

---

## Acknowledgments

Special thanks to the contributors and the Discord.js, Twurple, and Mongoose communities for their support and libraries.
