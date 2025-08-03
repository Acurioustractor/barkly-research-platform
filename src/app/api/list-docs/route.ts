import { NextResponse } from 'next/server'

// Mock data for development
const mockDocuments = [
  {
    id: 1,
    title: "Community Health Services Review",
    content: "Analysis of health service delivery in remote communities",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    category: "health",
    status: "published"
  },
  {
    id: 2,
    title: "Employment Pathways Study",
    content: "Research on employment opportunities and barriers",
    created_at: "2024-01-10T14:20:00Z",
    updated_at: "2024-01-10T14:20:00Z",
    category: "employment",
    status: "published"
  },
  {
    id: 3,
    title: "Cultural Protocol Guidelines",
    content: "Guidelines for culturally appropriate service delivery",
    created_at: "2024-01-05T09:15:00Z",
    updated_at: "2024-01-05T09:15:00Z",
    category: "cultural",
    status: "draft"
  }
]

export async function GET() {
  try {
    // Return mock data for development
    return NextResponse.json({ 
      success: true, 
      documents: mockDocuments,
      count: mockDocuments.length
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}