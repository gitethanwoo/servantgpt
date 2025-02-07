import { NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'

type SlackBlock = {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  fields?: {
    type: string;
    text: string;
  }[];
} | {
  type: 'image';
  title?: {
    type: 'plain_text';
    text: string;
  };
  image_url: string;
  alt_text: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { description, screenshot, consoleLogs, pathname } = await req.json()

    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
    if (!slackWebhookUrl) {
      throw new Error('SLACK_WEBHOOK_URL is not configured')
    }

    // Format the message for Slack
    const message: { blocks: SlackBlock[] } = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🐛 Bug Report',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*From:*\n${session.user?.email}`,
            },
            {
              type: 'mrkdwn',
              text: `*Page:*\n${pathname}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Description:*\n${description}`,
          },
        },
      ],
    }

    // Add screenshot as an attachment if available
    if (screenshot) {
      message.blocks.push({
        type: 'image',
        title: {
          type: 'plain_text',
          text: 'Screenshot',
        },
        image_url: screenshot,
        alt_text: 'Screenshot of the issue',
      })
    }

    // Add console logs if available
    if (consoleLogs && consoleLogs.length > 0) {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Console Logs:*\n\`\`\`${consoleLogs.join('\n')}\`\`\``,
        },
      })
    }

    // Send to Slack
    const slackResponse = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!slackResponse.ok) {
      throw new Error('Failed to send to Slack')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing feedback:', error)
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    )
  }
} 