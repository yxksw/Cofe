import { Metadata } from 'next'
import SponsorsPage from './SponsorsPage'

export const metadata: Metadata = {
  title: '赞助支持 - YXK BLOG',
  description: '如果您觉得我的内容对您有帮助，欢迎通过以下方式支持我的创作。您的每一份支持都是我持续创作的动力！',
}

export const revalidate = 3600 // Revalidate every hour

async function getSponsors() {
  try {
    const response = await fetch('https://home.381359.xyz/data/sponsors.json', {
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : [data]
  } catch (error) {
    console.error('Error fetching sponsors:', error)
    return []
  }
}

export default async function SponsorsPageWrapper() {
  const sponsors = await getSponsors()
  return <SponsorsPage sponsors={sponsors} />
}
