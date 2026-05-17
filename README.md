# The Mind Reader Interface

A dystopian web-based prototype for monitoring conversational dominance across phones.

## What this prototype does

- One phone opens the **Host Console** and creates a room.
- Each participant opens the shared join link on their own phone.
- Each participant phone asks for microphone permission.
- Each participant phone sends only a simple speaking/not-speaking signal every second.
- The server calculates speaking-time dominance percentages.
- Only the dominant participant's phone receives escalating reactions.

## Important prototype note

A single host phone cannot reliably identify which person in a group is speaking. For a reliable school demo, each participant phone detects its own voice activity locally. The host still acts as the dashboard and room controller.

## Requirements

Install Node.js 18 or newer.

Recommended demo devices:

- Chrome on Android phones
- One phone per participant
- Phones placed close to their owners

## How to run locally

### 1. Open the folder

Open this project folder in VS Code, Terminal, or Command Prompt.

### 2. Install dependencies

Run:

```bash
npm install
```

### 3. Start the server

Run:

```bash
npm start
```

You should see:

```txt
The Mind Reader Interface is running on port 3000
```

### 4. Open the app

On your computer, open:

```txt
http://localhost:3000
```

Click **Create Host Room**.

## How to test with phones on the same Wi-Fi

Localhost only works on the computer running the server. For phones on the same Wi-Fi, use your computer's local network IP address.

### On macOS

Run:

```bash
ipconfig getifaddr en0
```

### On Windows

Run:

```bash
ipconfig
```

Look for your IPv4 address. It may look like:

```txt
192.168.1.34
```

Then open this on your phone:

```txt
http://YOUR-IP-ADDRESS:3000
```

Example:

```txt
http://192.168.1.34:3000
```

Important: your phone and computer must be on the same Wi-Fi network.

## Recommended live demo flow

1. Start the server.
2. Open the host page on one phone or laptop.
3. Copy the join link from the host page.
4. Send or type the join link into participant phones.
5. Each participant enters their name and allows microphone access.
6. Start talking.
7. Watch the host dashboard update.
8. When one person crosses 60%, 70%, 80%, or 90%, their own phone reacts.

## Reaction levels

- 60%: subtle vibration
- 70%: red screen edge warning
- 80%: stronger vibration and audio tone
- 90%+: full-screen takeover message

## Tuning voice detection

In `public/participant.js`, find this line:

```js
return average > 18;
```

Increase the number if the room is noisy.
Lower the number if quiet voices are not detected.

Suggested values:

- Quiet room: 14-18
- Normal classroom: 18-25
- Noisy room: 25-35

## Deploying to Render

1. Create a GitHub repository.
2. Upload this folder to GitHub.
3. Go to Render.
4. Create a new Web Service.
5. Connect your GitHub repository.
6. Use these settings:
   - Build command: `npm install`
   - Start command: `npm start`
7. Deploy.
8. Open the public Render URL on all phones.

## Deploying to Railway

1. Create a GitHub repository.
2. Upload this folder to GitHub.
3. Go to Railway.
4. Create a new project from GitHub.
5. Select this repository.
6. Railway should detect Node.js automatically.
7. Use start command:

```bash
npm start
```

8. Open the public Railway URL on all phones.

## iOS Safari limitations

- Vibration often does not work on iOS Safari.
- Audio tones may require a user tap before playback.
- Microphone behavior is stricter than Chrome Android.
- For the most reliable demo, use Android + Chrome.

## Privacy note for your project presentation

This prototype does not send audio recordings to the server. It only sends a speaking/not-speaking signal once per second. However, the concept is intentionally dystopian and should be framed as critical design rather than a recommended real product.
