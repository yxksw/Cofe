export interface Sponsor {
  name: string
  avatar: string
  date: string
  amount: string
}

const SPONSORS_DATA_URL = 'https://home.381359.xyz/data/sponsors.json'

export async function GET() {
  try {
    const response = await fetch(SPONSORS_DATA_URL, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch sponsors: ${response.status}`)
    }

    const data = await response.json()

    // Handle both single sponsor object and array of sponsors
    const sponsors: Sponsor[] = Array.isArray(data) ? data : [data]

    return Response.json(sponsors)
  } catch (error) {
    console.error('Error fetching sponsors:', error)
    return Response.json([], { status: 200 }) // Return empty array on error
  }
}
