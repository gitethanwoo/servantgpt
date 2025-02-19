# YouTube Resource & Learn Page Implementation

## File Structure
```
├── app/
│   └── (chat)/
│       ├── api/
│       │   └── tools/
│       │       └── youtube/
│       │           └── route.ts ✅
│       └── learn/
│           ├── page.tsx
│           └── [id]/
│               └── page.tsx
├── components/
│   ├── youtube-transcript-tool.tsx ✅
│   ├── resource-card.tsx
│   └── resource-viewer.tsx
└── lib/
    └── db/
        ├── schema.ts ✅
        └── queries.ts ✅
```

## Implementation Strategy

### Core Function ("The Engine")
The absolute core of this feature is: "Can we save a YouTube video with its transcript and display it later?"

Critical Path:
1. ✅ Save a resource to database (with user authentication)
2. Retrieve a resource from database
3. Display a resource (video + transcript)

### User Journey
1. ✅ Find and input a YouTube video
2. ✅ Extract transcript and metadata
3. ✅ Save to resources (requires auth)
4. Browse saved resources
5. View detailed resource

## Implementation Order

### Phase 1: Core Engine ✅
1. Database Integration ✅
   - Add resource queries ✅
   - Ensure userId integration ✅
   - Test with authenticated console script ✅
   - Verify data persistence ✅

2. Basic Resource Display
   - Minimal viewer component
   - Test video embedding
   - Test transcript display


### Phase 2: Critical Path
1. YouTube Tool Enhancement ✅
   - Metadata extraction ✅
   - Basic save functionality ✅
   - Auth integration for saving ✅
   - Verify end-to-end flow with auth ✅

2. Resource Browsing
   - Basic list view with user context
   - Click-through to detail
   - Verify navigation flow
   - Add auth middleware if needed

### Phase 3: Enhancement
1. UI Polish
   - Resource cards
   - Grid layout
   - Loading states

2. User Experience
   - Error handling
   - Success messages
   - Auth integration

3. Additional Features
   - Filtering
   - Search
   - Pagination

## Detailed Implementation

## 1. Database Integration ✅
### Add Resource Queries (`lib/db/queries.ts`) ✅
```typescript
export async function saveResource({
  title,
  type,
  url,
  thumbnailUrl,
  transcript,
  summary,
  tags,
  tagline,
  userId,
}: Resource) {
  try {
    return await db.insert(resource).values({
      title,
      type,
      url,
      thumbnailUrl,
      transcript,
      summary,
      tags,
      tagline,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save resource in database');
    throw error;
  }
}

export async function getResources() {
  try {
    return await db
      .select()
      .from(resource)
      .orderBy(desc(resource.createdAt));
  } catch (error) {
    console.error('Failed to get resources from database');
    throw error;
  }
}

export async function getResourceById(id: string) {
  try {
    const [selectedResource] = await db
      .select()
      .from(resource)
      .where(eq(resource.id, id));
    return selectedResource;
  } catch (error) {
    console.error('Failed to get resource by id from database');
    throw error;
  }
}
```

## 2. YouTube Tool Enhancement ✅
### Modify YouTube API (`app/(chat)/api/tools/youtube/route.ts`) ✅
- Add metadata extraction (title, thumbnail) ✅
- Return complete video data with transcript ✅

### Update YouTube Component (`components/youtube-transcript-tool.tsx`) ✅
- Add save button ✅
- Add metadata fields (summary, tags, tagline) ✅
- Implement save functionality with auth check ✅
- Show success/error toasts ✅

## 3. Learn Pages Implementation
### Learn Page (`app/(chat)/learn/page.tsx`)
```typescript
'use client';

import { useEffect, useState } from 'react';
import { getResources } from '@/lib/db/queries';
import { ResourceCard } from '@/components/resource-card';

export default function LearnPage() {
  const [resources, setResources] = useState([]);
  
  useEffect(() => {
    const fetchResources = async () => {
      const data = await getResources();
      setResources(data);
    };
    fetchResources();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1>Learning Resources</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map(resource => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  );
}
```

### Resource Page (`app/(chat)/learn/[id]/page.tsx`)
```typescript
'use client';

import { useEffect, useState } from 'react';
import { getResourceById } from '@/lib/db/queries';
import { ResourceViewer } from '@/components/resource-viewer';

export default function ResourcePage({ params }: { params: { id: string } }) {
  const [resource, setResource] = useState(null);
  
  useEffect(() => {
    const fetchResource = async () => {
      const data = await getResourceById(params.id);
      setResource(data);
    };
    fetchResource();
  }, [params.id]);

  if (!resource) return <div>Loading...</div>;

  return <ResourceViewer resource={resource} />;
}
```

## 4. New Components
### Resource Card (`components/resource-card.tsx`)
- Display resource preview with:
  - Thumbnail
  - Title
  - Tagline
  - Type badge
  - Tags

### Resource Viewer (`components/resource-viewer.tsx`)
- Full resource display with:
  - Video embed (for YouTube)
  - Transcript
  - Summary
  - Tags
  - Navigation back to Learn page

## Notes
- Follow existing auth patterns for protected routes
- Use shadcn/ui components for consistency
- Implement proper error handling
- Add loading states
- Consider pagination for resources list
- Add filtering/search capabilities
