'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';

interface SiteInfoProps {
    name: string;
    url: string;
    description: string;
    avatar: string;
}

const SiteInfo: React.FC<SiteInfoProps> = ({ name, url, description, avatar }) => {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = (text: string, fieldId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleCopyJSON = () => {
        const data = {
            name,
            url,
            description,
            avatar
        };
        handleCopy(JSON.stringify(data, null, 2), 'json');
    };

    const InfoRow = ({ label, value, fieldId }: { label: string; value: string; fieldId: string }) => (
        <div className="group flex items-center hover:bg-slate-100 dark:hover:bg-white/5 rounded px-2 py-1 -mx-2 transition-colors">
            <span className="text-slate-500 dark:text-slate-400 w-16 text-sm">{label}</span>
            <span className="text-slate-900 dark:text-white font-medium text-sm flex-1 truncate">{value}</span>
            <button
                onClick={() => handleCopy(value, fieldId)}
                className={`ml-2 p-1 rounded transition-all ${copiedField === fieldId
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 opacity-100'
                        : 'text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100'
                    }`}
                title="复制"
            >
                <Icon icon={copiedField === fieldId ? 'lucide:check' : 'lucide:copy'} className="w-3.5 h-3.5" />
            </button>
        </div>
    );

    return (
        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Icon icon="lucide:info" className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">本站信息</h3>
                <button
                    onClick={handleCopyJSON}
                    className={`ml-auto text-xs px-2 py-1 rounded transition-colors ${copiedField === 'json'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-white/20'
                        }`}
                >
                    {copiedField === 'json' ? '已复制' : 'JSON'}
                </button>
            </div>
            <div className="space-y-1">
                <InfoRow label="名称" value={name} fieldId="name" />
                <InfoRow label="地址" value={url} fieldId="url" />
                <InfoRow label="描述" value={description} fieldId="description" />
                <InfoRow label="头像" value={avatar} fieldId="avatar" />
            </div>
        </div>
    );
};

export default SiteInfo;
