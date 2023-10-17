import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(req) {
    console.log("Receive request POST /messages")

    // Fetch chat history
    let queryResult = []
    try {
        console.log("Try to fetch history data")
        queryResult = await sql`SELECT user_name AS user, sentiment, timestamp, message
                    FROM chat_history
                    ORDER BY timestamp DESC
                    LIMIT 20;`;
    } catch (exception) {
        console.log("Failed to fetch history data", exception)
        return new NextResponse({
            status: exception.status || 500,
            body: exception.message
        })
    }

    const chatHistory = queryResult.rows.map(row => ({
        user: row.user,
        sentiment: row.sentiment,
        timestamp: row.timestamp,
        message: row.message
    }));

    return NextResponse.json({
        messages: chatHistory.reverse()
      }, {
        status: 200,
      })
}
