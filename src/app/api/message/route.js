const Sentiment = require('sentiment');
const Pusher = require('pusher');
import { NextResponse } from 'next/server';

const sentiment = new Sentiment();

// Configure the pusher
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER,
    useTLS: true
});

export async function POST(req) {
    console.log("Receive request POST /message")
    const { user = null, message = '', timestamp = +new Date } = await req.json();
    const sentimentScore = sentiment.analyze(message).score;

    const chat = { user, message, timestamp, sentiment: sentimentScore };

    console.log(chat)

    // chatHistory.messages.push(chat);
    await pusher.trigger('chat-room', 'new-message', { chat })
    .catch((exception) => {
        return new NextResponse({
            status: exception.status || 500,
            body: exception.message
        })
    });

    return new NextResponse({
        status: 200,
    })
}