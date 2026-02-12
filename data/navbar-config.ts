/**
 * 导航栏配置文件
 * @module data/navbar-config
 * @description 定义博客网站的导航结构和配置
 */

import { NavbarConfig } from '@/types/navbar'

/**
 * 导航栏默认配置
 * 包含品牌信息、导航项结构和操作按钮配置
 */
export const navbarConfig: NavbarConfig = {
  brand: {
    name: 'YXK\'s BLOG',
    href: '/',
    logo: '/icon.jpg',
  },
  items: [
    {
      id: 'home',
      label: '首页',
      href: '/',
    },
    {
      id: 'blog',
      label: '博客',
      href: '#',
      children: [
        {
          id: 'all-posts',
          label: '全部文章',
          href: '/blog',
        },
        {
          id: 'categories',
          label: '文章分类',
          href: '/blog/categories',
          children: [
            {
              id: 'tech',
              label: '技术',
              href: '/blog/category/tech',
            },
            {
              id: 'life',
              label: '生活',
              href: '/blog/category/life',
            },
            {
              id: 'travel',
              label: '旅行',
              href: '/blog/category/travel',
            },
          ],
        },
        {
          id: 'tags',
          label: '标签云',
          href: '/blog/tags',
        },
      ],
    },
    {
      id: 'memos',
      label: '动态',
      href: '/memos',
    },
    {
      id: 'editor',
      label: '编辑器',
      href: '/editor',
    },
    {
      id: 'about',
      label: '关于',
      href: '/about',
      children: [
        {
          id: 'about-me',
          label: '关于我',
          href: '/about',
        },
        {
          id: 'contact',
          label: '联系方式',
          href: '/contact',
        },
        {
          id: 'friends',
          label: '友链',
          href: '/friends',
        },
      ],
    },
  ],
  actions: {
    search: true,
    themeToggle: true,
    userMenu: true,
  },
}

/**
 * 获取导航栏配置
 * @returns {NavbarConfig} 导航栏配置对象
 */
export function getNavbarConfig(): NavbarConfig {
  return navbarConfig
}

/**
 * 根据 ID 查找导航项
 * @param {string} id - 导航项 ID
 * @param {NavItem[]} items - 导航项数组
 * @returns {NavItem | undefined} 找到的导航项或 undefined
 */
export function findNavItemById(
  id: string,
  items = navbarConfig.items
): NavItem | undefined {
  for (const item of items) {
    if (item.id === id) {
      return item
    }
    if (item.children) {
      const found = findNavItemById(id, item.children)
      if (found) {
        return found
      }
    }
  }
  return undefined
}

import { NavItem } from '@/types/navbar'
