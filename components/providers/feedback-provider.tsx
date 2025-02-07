'use client'

import { createContext, useContext, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

interface FeedbackContextType {
  isOpen: boolean
  openFeedback: () => void
  closeFeedback: () => void
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()

  const openFeedback = () => setIsOpen(true)
  const closeFeedback = () => setIsOpen(false)

  const captureScreenshot = async () => {
    try {
      // Use native screenshot API
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: {
          displaySurface: "browser"
        }
      })
      
      // Create video element to capture frame
      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()
      
      // Create canvas to capture frame
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Draw frame to canvas
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0)
      
      // Stop screen capture
      stream.getTracks().forEach(track => track.stop())
      
      // Convert to blob directly
      return new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/jpeg',
          0.95
        )
      })
    } catch (error) {
      console.error('Failed to capture screenshot:', error)
      return null
    }
  }

  const getRecentConsoleLogs = () => {
    // In a real implementation, you'd need to set up console log capturing
    // This is a placeholder
    return []
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const screenshot = await captureScreenshot()
      const consoleLogs = getRecentConsoleLogs()
      
      let screenshotUrl = null
      if (screenshot) {
        // Upload to Vercel Blob using existing endpoint
        const formData = new FormData()
        formData.append('file', screenshot, `feedback-${Date.now()}.jpg`)
        
        const uploadResponse = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json()
          console.error('Screenshot upload failed:', error)
          throw new Error(error.error || 'Failed to upload screenshot')
        }
        
        const { url } = await uploadResponse.json()
        screenshotUrl = url
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          screenshot: screenshotUrl,
          consoleLogs,
          pathname,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      setDescription('')
      setIsOpen(false)
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FeedbackContext.Provider value={{ isOpen, openFeedback, closeFeedback }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">What&apos;s going wrong?</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue you're experiencing..."
                className="min-h-[100px]"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider')
  }
  return context
} 