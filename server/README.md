# Tamohar Backend

This is the backend server for the Tamohar application, which delivers daily Bhagavad Gita shloks and notifications.

## Features

- Firebase authentication integration
- Daily notification scheduling for users
- API endpoints for retrieving random and specific shloks
- Ready for deployment on various hosting platforms

## Prerequisites

- Node.js 14 or higher
- Firebase project with Firestore and Cloud Messaging enabled
- Firebase Admin SDK credentials

## Installation

1. Clone the repository
2. Navigate to the server directory:

```bash
cd server
```

3. Install dependencies:

```bash
npm install
```

4. Set up environment variables:
   - Copy the `.env.example` file from the root directory to `.env`
   - Fill in your Firebase configuration details

## Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Firestore and Cloud Messaging services
3. Generate a new private key for the Firebase Admin SDK:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `credsTamohar.json` in the root directory

## Running Locally

```bash
npm run dev
```

The server will start on the port specified in your `.env` file (default: 3001).

## API Endpoints

### Health Check

- `GET /`: Returns the status of the server

### Shloks

- `GET /api/shloks/random`: Get a random shlok
- `GET /api/shloks/:chapter/:verse`: Get a specific shlok by chapter and verse

### Notifications

- `GET /api/notifications/check`: Manually trigger notification checks
- `POST /api/notifications/user/:userId`: Send a notification to a specific user

## Deployment

### Heroku

1. Install the Heroku CLI and log in
2. Create a new Heroku app:

```bash
heroku create tamohar-backend
```

3. Set your environment variables:

```bash
heroku config:set FIREBASE_PROJECT_ID=your-project-id
heroku config:set FIREBASE_CLIENT_EMAIL=your-client-email
heroku config:set FIREBASE_PRIVATE_KEY="your-private-key"
heroku config:set NODE_ENV=production
```

4. Deploy the application:

```bash
git push heroku main
```

### Render

1. Create a new Web Service in the Render dashboard
2. Connect your GitHub repository
3. Configure the service:
   - Build Command: `npm install`
   - Start Command: `node index.js`
4. Add your environment variables in the Environment section
5. Deploy the service

### Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add your environment variables
4. Deploy the service

## Scheduled Tasks

The server uses `node-cron` to schedule notification checks. By default, it checks every hour to send notifications to users who have enabled them for that specific time.

## License

MIT
