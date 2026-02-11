import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@iconify/react'

import Image from 'next/image'
import Link from 'next/link'
import { Memo } from '@/lib/types'
import { getRelativeTimeString, processMemoForPreview } from '@/lib/utils'

const SocialLink = ({ href, title, icon, label, textClassName = '' }: {
  href: string
  title: string
  icon?: string
  label: string
  textClassName?: string
}) => (
  <a
    href={href}
    target='_blank'
    rel='noopener noreferrer'
    className={`text-muted-foreground hover:text-foreground transition-colors p-0.5 m-auto ${textClassName}`}
    title={title}
  >
    {icon ? <Icon icon={icon} width={16} height={16} /> : label}
    <span className='sr-only'>{label}</span>
  </a>
)

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

export const StatusCard = ({
  memo,
  name,
  avatar,
  links,
}: {
  memo: Memo | undefined
  name: string
  avatar: string
  links: Record<string, string>
}) => {
  return (
    <div className='max-w-3xl mx-auto px-4 pt-8 pb-4 w-full'>
      <Card className='w-full overflow-visible'>
        <CardContent className='p-8'>
          {/* Avatar and Social Links Section */}
          <div className='flex flex-col items-center space-y-3'>
            <Avatar src={avatar} alt='Blogger Avatar' href='/' />

            {/* Social Links Grid */}
            <div className='grid grid-cols-3 gap-3'>
              {links['github.com'] && (
                <SocialLink
                  href={links['github.com']}
                  title='GitHub'
                  icon='mdi:github'
                  label='GitHub'
                />
              )}
              {links['x.com'] && (
                <SocialLink
                  href={links['x.com']}
                  title='X'
                  icon='ri:twitter-x-fill'
                  label='X (Twitter)'
                />
              )}
              {links['linkedin.com'] && (
                <SocialLink
                  href={links['linkedin.com']}
                  title='LinkedIn'
                  icon='mdi:linkedin'
                  label='LinkedIn'
                />
              )}
              {links['xiaohongshu.com'] && (
                <SocialLink
                  href={links['xiaohongshu.com']}
                  title='小红书'
                  label='小红书'
                  textClassName='text-xs'
                />
              )}
              {links['podcasts.apple.com'] && (
                <SocialLink
                  href={links['podcasts.apple.com']}
                  title='Apple Podcasts'
                  icon='mdi:podcast'
                  label='Apple Podcasts'
                />
              )}
              {links['xiaoyuzhoufm.com'] && (
                <SocialLink
                  href={links['xiaoyuzhoufm.com']}
                  title='小宇宙'
                  label='小宇宙FM'
                  textClassName='text-xs'
                />
              )}
              {(links['t.me'] || links['Telegram']) && (
                <SocialLink
                  href={links['t.me'] || links['Telegram']}
                  title='Telegram'
                  icon='mdi:telegram'
                  label='Telegram'
                />
              )}
              {(links['discord.com'] || links['discord']) && (
                <SocialLink
                  href={links['discord.com'] || links['discord']}
                  title='Discord'
                  icon='mdi:discord'
                  label='Discord'
                />
              )}
              {(links['qm.qq.com'] || links['qq']) && (
                <SocialLink
                  href={links['qm.qq.com'] || links['qq']}
                  title='QQ群'
                  icon='mdi:qqchat'
                  label='QQ群'
                />
              )}
              {(links['mastodon.social'] || links['mastodon']) && (
                <SocialLink
                  href={links['mastodon.social'] || links['mastodon']}
                  title='Mastodon'
                  icon='mdi:mastodon'
                  label='Mastodon'
                />
              )}
              {(links['mailto'] || links['mail']) && (
                <SocialLink
                  href={links['mailto'] || links['mail']}
                  title='Email'
                  icon='mdi:email'
                  label='Email'
                />
              )}
            </div>
          </div>

          {/* Memo Content Section */}
          <div className='flex-1 min-w-0 pt-4'>
            <div className='flex justify-between items-center mb-3'>
              <time className='text-xs text-muted-foreground' dateTime='2023-05-26T09:12:00Z'>
                {`@${name}` + ' ' + (memo ? getRelativeTimeString(memo.timestamp) : '')}
              </time>
              <Link href='/memos' className='text-xs text-muted-foreground hover:text-foreground underline'>
                more
              </Link>
            </div>
            {memo && (() => {
              const { processedContent, hasImages } = processMemoForPreview(memo.content);
              return (
                <div className='text-base leading-relaxed break-words'>
                  <p>{processedContent}</p>
                  {hasImages && (
                    <p className='text-xs text-muted-foreground mt-2 italic'>
                      Contains images - view in &quot;more&quot; →
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
