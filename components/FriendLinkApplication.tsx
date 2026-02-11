'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { uploadImage } from '@/lib/githubApi'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'

export function FriendLinkApplication() {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    avatar: '',
    description: '',
    category: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isImageUploading, setIsImageUploading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!session?.accessToken) {
      toast({
        title: '错误',
        description: '请先登录GitHub账号',
        variant: 'destructive',
        duration: 3000
      })
      return
    }

    const file = e.target.files?.[0]
    if (!file) return

    setIsImageUploading(true)
    try {
      const imageUrl = await uploadImage(file, session.accessToken)
      setFormData(prev => ({
        ...prev,
        avatar: imageUrl
      }))

      toast({
        title: '成功',
        description: '头像上传成功',
        duration: 3000
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: '错误',
        description: '头像上传失败',
        variant: 'destructive',
        duration: 3000
      })
    } finally {
      setIsImageUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.accessToken) {
      toast({
        title: '错误',
        description: '请先登录GitHub账号',
        variant: 'destructive',
        duration: 3000
      })
      return
    }

    setIsLoading(true)
    try {
      // 这里应该实现友链申请的API调用
      // 暂时使用模拟成功的响应
      console.log('友链申请数据:', formData)
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: '成功',
        description: '友链申请已提交，等待审核',
        duration: 3000
      })

      // 重置表单
      setFormData({
        name: '',
        url: '',
        avatar: '',
        description: '',
        category: ''
      })
    } catch (error) {
      console.error('Error submitting friend link application:', error)
      toast({
        title: '错误',
        description: '友链申请提交失败',
        variant: 'destructive',
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className='w-full border-border'>
      <CardContent className='p-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='name'>网站名称 *</Label>
              <Input
                id='name'
                name='name'
                value={formData.name}
                onChange={handleInputChange}
                placeholder='请输入您的网站名称'
                required
                disabled={isLoading || isImageUploading}
              />
            </div>
            
            <div className='space-y-2'>
              <Label htmlFor='url'>网站链接 *</Label>
              <Input
                id='url'
                name='url'
                type='url'
                value={formData.url}
                onChange={handleInputChange}
                placeholder='请输入您的网站链接，以 http:// 或 https:// 开头'
                required
                disabled={isLoading || isImageUploading}
              />
            </div>
            
            <div className='space-y-2'>
              <Label htmlFor='avatar'>网站头像</Label>
              <div className='space-y-2'>
                <Input
                  id='avatar'
                  name='avatar'
                  value={formData.avatar}
                  onChange={handleInputChange}
                  placeholder='请输入您的网站头像链接，或点击下方按钮上传'
                  disabled={isLoading || isImageUploading}
                />
                <div className='flex items-center gap-2'>
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    id='avatar-upload'
                    onChange={handleImageUpload}
                    disabled={isLoading || isImageUploading}
                  />
                  <Label
                    htmlFor='avatar-upload'
                    className='cursor-pointer'
                  >
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      disabled={isLoading || isImageUploading}
                      className='flex items-center gap-2'
                    >
                      {isImageUploading ? (
                        <>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          上传中...
                        </>
                      ) : (
                        '上传头像'
                      )}
                    </Button>
                  </Label>
                  <span className='text-xs text-muted-foreground'>
                    支持 JPG、PNG、WebP 格式，建议尺寸 256x256
                  </span>
                </div>
              </div>
            </div>
            
            <div className='space-y-2'>
              <Label htmlFor='category'>网站分类</Label>
              <Input
                id='category'
                name='category'
                value={formData.category}
                onChange={handleInputChange}
                placeholder='请输入您的网站分类，如：技术、生活、设计等'
                disabled={isLoading || isImageUploading}
              />
            </div>
          </div>
          
          <div className='space-y-2'>
            <Label htmlFor='description'>网站描述 *</Label>
            <Textarea
              id='description'
              name='description'
              value={formData.description}
              onChange={handleInputChange}
              placeholder='请输入您的网站描述，介绍一下您的网站内容'
              required
              rows={4}
              disabled={isLoading || isImageUploading}
            />
          </div>
          
          <div className='text-sm text-muted-foreground'>
            <p>* 为必填项</p>
            <p className='mt-2'>
              提交友链申请后，我们会在1-3个工作日内审核并添加您的友链。
              请确保您的网站内容健康，且已添加我们的友链。
            </p>
          </div>
        </form>
      </CardContent>
      <CardFooter className='p-6 pt-0 flex justify-end'>
        <Button
          type='submit'
          onClick={(e) => {
            e.preventDefault()
            const form = document.querySelector('form')
            if (form) {
              form.dispatchEvent(new Event('submit', { cancelable: true }))
            }
          }}
          disabled={isLoading || isImageUploading || !formData.name || !formData.url || !formData.description}
          className='px-8'
        >
          {isLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              提交中...
            </>
          ) : (
            '提交申请'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
