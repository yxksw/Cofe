import { NextRequest, NextResponse } from 'next/server'

interface GeocodeRequest {
  latitude: number
  longitude: number
}

interface GeocodeResult {
  city?: string
  street?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GeocodeRequest = await request.json()
    const { latitude, longitude } = body

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    // 代理到 Nominatim API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'YXK\'s BLOG App',
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Nominatim API error')
    }

    const data = await response.json()
    
    // 提取城市和街道
    const address = data.address || {}
    const city = address.city || address.town || address.village || address.municipality || address.county || ''
    const street = address.road || address.street || address.highway || ''

    const result: GeocodeResult = {
      city,
      street
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Geocode error:', error)
    return NextResponse.json(
      { error: 'Failed to geocode' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
