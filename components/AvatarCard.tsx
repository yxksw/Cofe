import { CardContent } from '@/components/ui/card'
import { Icon } from '@iconify/react'
import Image from 'next/image'
import Link from 'next/link'

const Avatar = ({ src, alt, href }: { src: string; alt: string; href: string }) => (
  <Link href={href}>
    <Image
      src={src}
      alt={alt}
      width={48}
      height={48}
      className='rounded-full hover:opacity-90 transition-opacity'
    />
  </Link>
)

export const AvatarCard = ({ name, links }: { name: string; links: Record<string, string> }) => {
  return (
    <div className='max-w-2xl mx-auto p-4'>
      <CardContent className='p-6'>
        <div className='flex flex-col items-center space-y-2'>
          <Avatar src={`https://github.com/${name}.png`} alt='Blogger Avatar' href={'/'} />
          <div className='grid grid-cols-3 gap-2'>
            {links['github.com'] && (
              <a
                href={links['github.com']}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground transition-colors p-1.5 m-auto'
                title='GitHub'
              >
                <Icon icon='mdi:github' width={16} height={16} />
                <span className='sr-only'>GitHub</span>
              </a>
            )}

            {links['x.com'] && (
              <a
                href={links['x.com']}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground transition-colors p-1.5 m-auto'
                title='X'
              >
                <Icon icon='ri:twitter-x-fill' width={16} height={16} />
                <span className='sr-only'>X (Twitter)</span>
              </a>
            )}

            {links['linkedin.com'] && (
              <a
                href={links['linkedin.com']}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground transition-colors p-1.5 m-auto'
                title='LinkedIn'
              >
                <Icon icon='mdi:linkedin' width={16} height={16} />
                <span className='sr-only'>LinkedIn</span>
              </a>
            )}

            {links['xiaohongshu.com'] && (
              <a
                href={links['xiaohongshu.com']}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground transition-colors p-1.5 m-auto text-xs'
                title='小红书'
              >
                小红书
                <span className='sr-only'>小红书</span>
              </a>
            )}

            {links['podcasts.apple.com'] && (
              <a
                href={links['podcasts.apple.com']}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground transition-colors p-1.5 m-auto'
                title='Apple Podcasts'
              >
                <Icon icon='mdi:podcast' width={16} height={16} />
                <span className='sr-only'>Apple Podcasts</span>
              </a>
            )}

            {links['xiaoyuzhoufm.com'] && (
              <a
                href={links['xiaoyuzhoufm.com']}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground transition-colors p-1.5 m-auto text-xs'
                title='小宇宙'
              >
                小宇宙
                <span className='sr-only'>小宇宙FM</span>
              </a>
            )}

            {(links['t.me'] || links['tELEGRAM']) && (
              <a
                href={links['t.me'] || links['tELEGRAM']}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground transition-colors p-1.5 m-auto'
                title='Telegram'
              >
                <Icon icon='mdi:telegram' width={16} height={16} />
                <span className='sr-only'>Telegram</span>
              </a>
            )}

            {(links['discord.com'] || links['discord']) && (
              <a
                href={links['discord.com'] || links['discord']}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground transition-colors p-1.5 m-auto'
                title='Discord'
              >
                <Icon icon='mdi:discord' width={16} height={16} />
                <span className='sr-only'>Discord</span>
              </a>
            )}

            {(links['qm.qq.com'] || links['qq']) && (
              <a
                href={links['qm.qq.com'] || links['qq']}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground transition-colors p-1.5 m-auto'
                title='QQ群'
              >
                <Icon icon='mdi:qqchat' width={16} height={16} />
                <span className='sr-only'>QQ群</span>
              </a>
            )}

            {(links['mastodon.social'] || links['mastodon']) && (
              <a
                href={links['mastodon.social'] || links['mastodon']}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground transition-colors p-1.5 m-auto'
                title='Mastodon'
              >
                <Icon icon='mdi:mastodon' width={16} height={16} />
                <span className='sr-only'>Mastodon</span>
              </a>
            )}

            {(links['mailto'] || links['mail']) && (
              <a
                href={links['mailto'] || links['mail']}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground transition-colors p-1.5 m-auto'
                title='Email'
              >
                <Icon icon='mdi:email' width={16} height={16} />
                <span className='sr-only'>Email</span>
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </div>
  )
}
