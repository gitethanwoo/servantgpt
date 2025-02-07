import { NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'

type SlackBlock = {
  type: 'section';
  text: {
    type: 'mrkdwn' | 'plain_text';
    text: string;
    emoji?: boolean;
  };
  fields?: {
    type: string;
    text: string;
  }[];
} | {
  type: 'image';
  title: {
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

    console.log('Feedback payload sizes:', {
      descriptionLength: description?.length || 0,
      screenshotLength: screenshot?.length || 0,
      consoleLogsLength: consoleLogs?.length || 0
    })

    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
    if (!slackWebhookUrl) {
      throw new Error('SLACK_WEBHOOK_URL is not configured')
    }

    // Format the message for Slack
    const message: { blocks: SlackBlock[] } = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Bug Report*\n\n*From:* ${session.user?.email}\n*Page:* ${pathname}\n\n*Description:*\n${description}`
          }
        }
      ]
    }

    // Add screenshot as an attachment if available
    if (screenshot) {
      console.log('Screenshot URL preview:', screenshot.substring(0, 100) + '...')
      
      // Verify the screenshot URL is valid
      try {
        new URL(screenshot)
        message.blocks.push({
          type: 'image',
          title: {
            type: 'plain_text',
            text: 'Screenshot'
          },
          image_url: screenshot,
          alt_text: 'Screenshot of the issue'
        })
      } catch (e) {
        console.error('Invalid screenshot URL:', e)
      }
    }

    // Add console logs if available
    if (consoleLogs && consoleLogs.length > 0) {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Console Logs:*\n\`\`\`${consoleLogs.slice(0, 10).join('\n')}\`\`\``
        }
      })
    }

    // Validate message size (Slack has a 16KB limit)
    const messageString = JSON.stringify(message)
    console.log('Total message size:', messageString.length, 'bytes')
    
    if (messageString.length > 16000) {
      console.warn('Message too large, truncating...')
      // Simplified message if too large
      message.blocks = [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Bug Report*\n\n*From:* ${session.user?.email}\n*Description:*\n${description.slice(0, 1000)}...`
        }
      }]
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
      const errorText = await slackResponse.text()
      console.error('Slack webhook error:', {
        status: slackResponse.status,
        statusText: slackResponse.statusText,
        response: errorText
      })
      throw new Error(`Slack webhook failed: ${slackResponse.status} ${slackResponse.statusText}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing feedback:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 