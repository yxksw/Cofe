'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import announcementConfig from '@/data/announcement.json'
import announcementContent from '@/data/announcement.md'
import { commitFilesToGitHub } from '@/lib/githubApi'

type AnnouncementLevel = 'info' | 'note' | 'tip' | 'important' | 'warning' | 'caution' | 'happy'

const levelOptions: { value: AnnouncementLevel; label: string; icon: string }[] = [
  { value: 'info', label: '信息', icon: 'lucide:info' },
  { value: 'note', label: '笔记', icon: 'lucide:file-text' },
  { value: 'tip', label: '提示', icon: 'lucide:lightbulb' },
  { value: 'important', label: '重要', icon: 'lucide:message-square-warning' },
  { value: 'warning', label: '警告', icon: 'lucide:alert-triangle' },
  { value: 'caution', label: '注意', icon: 'lucide:alert-circle' },
  { value: 'happy', label: '庆祝', icon: 'lucide:party-popper' },
]

export default function AnnouncementEditorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    enable: true,
    level: 'info' as AnnouncementLevel,
    title: '',
    content: '',
  })

  useEffect(() => {
    // 加载现有公告数据
    setFormData({
      enable: (announcementConfig as { enable: boolean }).enable ?? true,
      level: (announcementConfig as { level: AnnouncementLevel }).level ?? 'info',
      title: (announcementConfig as { title: string }).title ?? '',
      content: announcementContent ?? '',
    })
  }, [])

  useEffect(() => {
    // 检查用户是否已登录
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      setMessage('请先登录')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      // 准备提交的文件
      const files = [
        {
          path: 'data/announcement.json',
          content: JSON.stringify(
            {
              enable: formData.enable,
              level: formData.level,
              title: formData.title,
            },
            null,
            2
          ),
        },
        {
          path: 'data/announcement.md',
          content: formData.content,
        },
      ]

      // 提交到 GitHub
      const result = await commitFilesToGitHub(
        files,
        session,
        '更新网站公告'
      )

      if (result.success) {
        setMessage('公告更新成功！')
        // 延迟跳转
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 1500)
      } else {
        setMessage(`更新失败: ${result.error}`)
      }
    } catch (error) {
      setMessage(`发生错误: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon icon="lucide:loader-2" className="animate-spin" width={20} height={20} />
          加载中...
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Icon icon="lucide:lock" width={48} height={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">请先登录以编辑公告</p>
            <Button onClick={() => router.push('/')} className="mt-4">
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon icon="lucide:megaphone" width={24} height={24} className="text-primary" />
              <CardTitle>编辑网站公告</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 启用开关 */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="enable">启用公告</Label>
                  <p className="text-sm text-muted-foreground">
                    关闭后公告将不会显示在首页
                  </p>
                </div>
                <Switch
                  id="enable"
                  checked={formData.enable}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enable: checked })
                  }
                />
              </div>

              {/* 公告级别 */}
              <div className="space-y-2">
                <Label>公告级别</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value: AnnouncementLevel) =>
                    setFormData({ ...formData, level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择公告级别" />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon icon={option.icon} width={16} height={16} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 公告标题 */}
              <div className="space-y-2">
                <Label htmlFor="title">公告标题</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="输入公告标题"
                />
              </div>

              {/* 公告内容 */}
              <div className="space-y-2">
                <Label htmlFor="content">
                  公告内容
                  <span className="text-xs text-muted-foreground ml-2">
                    支持 Markdown 格式
                  </span>
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="输入公告内容，支持 Markdown 格式..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              {/* 消息提示 */}
              {message && (
                <div
                  className={`rounded-lg p-4 flex items-center gap-2 ${
                    message.includes('成功')
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-red-500/10 text-red-600'
                  }`}
                >
                  <Icon
                    icon={message.includes('成功') ? 'lucide:check-circle' : 'lucide:alert-circle'}
                    width={20}
                    height={20}
                  />
                  {message}
                </div>
              )}

              {/* 按钮组 */}
              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Icon
                        icon="lucide:loader-2"
                        className="animate-spin mr-2"
                        width={16}
                        height={16}
                      />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:save" className="mr-2" width={16} height={16} />
                      保存公告
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 预览卡片 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">预览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="text-sm text-muted-foreground mb-2">
                级别: {levelOptions.find((l) => l.value === formData.level)?.label}
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                标题: {formData.title || '（无标题）'}
              </div>
              <div className="text-xs text-muted-foreground">
                状态: {formData.enable ? '启用' : '禁用'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
