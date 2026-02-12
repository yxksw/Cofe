'use client'

import { useEffect, useState } from 'react'

interface BackgroundImageProps {
  src?: string
  opacity?: number
  position?: string
  size?: string
  repeat?: string
  attachment?: string
}

export function BackgroundImage({
  src = 'https://img.314926.xyz/h',
  opacity = 0.15,
  position = 'center',
  size = 'cover',
  repeat = 'no-repeat',
  attachment = 'fixed'
}: BackgroundImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [bgUrl, setBgUrl] = useState(src)

  useEffect(() => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      setLoaded(true)
    }
    img.onerror = () => {
      console.warn('Failed to load background image, using fallback')
      setBgUrl('')
    }
  }, [src])

  if (!bgUrl) return null

  return (
    <div
      id="bg-box"
      className={loaded ? 'loaded' : ''}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${bgUrl})`,
        backgroundPosition: position,
        backgroundSize: size,
        backgroundRepeat: repeat,
        backgroundAttachment: attachment,
        opacity: loaded ? opacity : 0,
        pointerEvents: 'none',
        zIndex: -1,
        transition: 'opacity 0.5s ease-in-out',
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}
    />
  )
}

export default BackgroundImage
