const Sentiment = require('sentiment');
const Pusher = require('pusher');
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

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
    const { user = '', message = '', timestamp = +new Date } = await req.json();
    const sentimentScore = sentiment.analyze(message).score || 0.0;

    const chat = { user, message, timestamp, sentiment: sentimentScore };

    // Push message to database
    try {
        console.log("Try to send data to database")
        await sql`INSERT INTO chat_history (chat_room, message, user_name, sentiment, timestamp) 
            VALUES ('chat-room', ${chat.message}, ${chat.user}, ${chat.sentiment}, ${chat.timestamp});`;
    } catch (exception) {
        console.log("Failed to send data", exception)
        return new NextResponse({
            status: exception.status || 500,
            body: exception.message
        })
    }

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