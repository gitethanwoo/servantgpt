# Feedback Widget PRD

## Overview
A lightweight, reusable feedback widget that can be triggered from anywhere in the app to capture user feedback, screenshots, and debug information.

## Components

### 1. Core Components
- `FeedbackModal`: Main modal component for user input
- `FeedbackProvider`: Context provider for global access
- `useFeedback`: Hook to trigger feedback modal
- `captureUtils`: Utilities for screenshots and console logs

### 2. API
- `POST /api/feedback`: Endpoint to send feedback to Slack
- Uses existing `SLACK_WEBHOOK_URL` from `.env`

### 3. Data Captured
- User info (from NextAuth session)
- Screenshot of current page
- Recent console logs
- Current URL/route
- User's description of issue

## Implementation Plan

1. Create basic modal and context
2. Add screenshot capture using html2canvas
3. Implement console log capture
4. Create API endpoint for Slack integration
5. Add NextAuth session integration

## Usage Example

```tsx
const { openFeedback } = useFeedback()
<Button onClick={openFeedback}>
Report Issue
</Button>

```

## Slack Output Format
🐛 Bug Report
From: {user.email}
Page: {currentUrl}
Description:
{userDescription}
[Screenshot attached]
[Console logs attached]


## Technical Notes
- Uses existing NextAuth for user context
- Minimal dependencies (html2canvas only)
- Modular design for easy maintenance