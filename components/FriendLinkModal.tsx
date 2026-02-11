'use client';

import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { uploadImage } from '@/lib/githubApi';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface FriendLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FormData {
    name: string;
    url: string;
    avatar: string;
    description: string;
}

const FriendLinkModal: React.FC<FriendLinkModalProps> = ({ isOpen, onClose }) => {
    const { data: session } = useSession();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        url: '',
        avatar: '',
        description: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setFormData(prev => ({ ...prev, avatar: url }));
        setPreviewUrl(url);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!session?.accessToken) {
            toast({
                title: '请先登录',
                description: '需要 GitHub 登录才能上传图片',
                variant: 'destructive',
            });
            return;
        }

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            toast({
                title: '文件类型错误',
                description: '请上传图片文件',
                variant: 'destructive',
            });
            return;
        }

        // 验证文件大小 (最大 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: '文件过大',
                description: '图片大小不能超过 5MB',
                variant: 'destructive',
            });
            return;
        }

        setIsUploading(true);
        try {
            const imageUrl = await uploadImage(file, session.accessToken);
            setFormData(prev => ({ ...prev, avatar: imageUrl }));
            setPreviewUrl(imageUrl);
            toast({
                title: '上传成功',
                description: '头像已上传',
            });
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: '上传失败',
                description: '图片上传失败，请重试',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.accessToken) {
            toast({
                title: '请先登录',
                description: '需要 GitHub 登录才能提交申请',
                variant: 'destructive',
            });
            return;
        }

        // 验证表单
        if (!formData.name.trim()) {
            toast({
                title: '请填写网站名称',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.url.trim()) {
            toast({
                title: '请填写网站地址',
                variant: 'destructive',
            });
            return;
        }

        // 验证URL格式
        try {
            new URL(formData.url);
        } catch {
            toast({
                title: '网站地址格式错误',
                description: '请输入完整的URL，包含 http:// 或 https://',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.description.trim()) {
            toast({
                title: '请填写网站描述',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            // 这里可以将友链申请数据提交到GitHub Issues或其他存储方式
            // 暂时使用模拟提交
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast({
                title: '申请已提交',
                description: '友链申请已提交，等待审核',
            });

            // 重置表单
            setFormData({
                name: '',
                url: '',
                avatar: '',
                description: '',
            });
            setPreviewUrl('');
            onClose();
        } catch (error) {
            console.error('Submit error:', error);
            toast({
                title: '提交失败',
                description: '请稍后重试',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon icon="lucide:mail" className="w-5 h-5 text-primary" />
                        申请友链
                    </DialogTitle>
                    <DialogDescription>
                        填写您的网站信息，提交友链申请
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    {/* 网站名称 */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            网站名称 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="请输入您的网站名称"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className="w-full"
                        />
                    </div>

                    {/* 网站地址 */}
                    <div className="space-y-2">
                        <Label htmlFor="url">
                            网站地址 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="url"
                            name="url"
                            type="url"
                            placeholder="https://example.com"
                            value={formData.url}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className="w-full"
                        />
                    </div>

                    {/* 网站头像 */}
                    <div className="space-y-2">
                        <Label htmlFor="avatar">
                            网站头像
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="avatar"
                                name="avatar"
                                placeholder="头像URL或上传图片"
                                value={formData.avatar}
                                onChange={handleAvatarUrlChange}
                                disabled={isLoading || isUploading}
                                className="flex-1"
                            />
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*"
                                className="hidden"
                                disabled={isUploading}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading || isUploading}
                                className="shrink-0"
                            >
                                {isUploading ? (
                                    <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Icon icon="lucide:upload" className="w-4 h-4" />
                                )}
                                <span className="ml-2 hidden sm:inline">
                                    {isUploading ? '上传中' : '上传'}
                                </span>
                            </Button>
                        </div>
                        
                        {/* 头像预览 */}
                        {previewUrl && (
                            <div className="mt-3 flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <div className="relative w-12 h-12">
                                    <Image
                                        src={previewUrl}
                                        alt="头像预览"
                                        fill
                                        className="rounded-full object-cover"
                                        onError={() => setPreviewUrl('')}
                                        unoptimized
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">头像预览</span>
                            </div>
                        )}
                    </div>

                    {/* 网站描述 */}
                    <div className="space-y-2">
                        <Label htmlFor="description">
                            网站描述 <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="请输入您的网站描述"
                            value={formData.description}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            rows={3}
                            className="w-full resize-none"
                        />
                    </div>

                    {/* 提示信息 */}
                    <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10 p-4 text-center">
                        <p className="text-sm text-primary font-medium mb-1">
                            申请须知
                        </p>
                        <p className="text-xs text-muted-foreground">
                            请确保您的网站内容健康，且已添加本站友链。审核通过后将显示在友链列表中。
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            取消
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || isUploading}
                            className="gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                                    提交中...
                                </>
                            ) : (
                                <>
                                    <Icon icon="lucide:send" className="w-4 h-4" />
                                    提交申请
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FriendLinkModal;
