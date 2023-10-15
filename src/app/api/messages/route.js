import { NextResponse } from 'next/server';

export async function POST(req) {
    return new NextResponse({
        status: 200,
        body: {
            messages: []
        }
    })
}