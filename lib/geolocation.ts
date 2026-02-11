export interface LocationData {
  latitude: number
  longitude: number
  city?: string
  street?: string
}

export async function getCurrentLocation(): Promise<LocationData | null> {
  if (!navigator.geolocation) {
    console.log('Geolocation is not supported by this browser')
    return null
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
    })

    const { latitude, longitude } = position.coords
    
    // 调用服务器端 API 进行反向地理编码
    const locationDetails = await reverseGeocode(latitude, longitude)
    
    return {
      latitude,
      longitude,
      city: locationDetails?.city,
      street: locationDetails?.street
    }
  } catch (error) {
    console.error('Error getting location:', error)
    return null
  }
}

interface GeocodeResult {
  city?: string
  street?: string
}

async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult | null> {
  try {
    // 调用本地 API 端点，避免 CORS 错误
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ latitude: lat, longitude: lon })
    })

    if (!response.ok) {
      throw new Error('Failed to reverse geocode')
    }

    const data = await response.json()
    
    return {
      city: data.city,
      street: data.street
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    return null
  }
}
