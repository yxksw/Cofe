/**
 * 导航栏组件类型定义
 * @module types/navbar
 * @description 定义导航栏相关的数据结构和类型
 */

/**
 * 导航项基础接口
 * @interface NavItem
 * @description 定义单个导航项的结构，支持多级嵌套
 */
export interface NavItem {
  /** 导航项唯一标识 */
  id: string;
  /** 导航项显示标签 */
  label: string;
  /** 导航链接地址 */
  href?: string;
  /** 子导航项数组 */
  children?: NavItem[];
  /** 图标组件（可选） */
  icon?: React.ComponentType<{ className?: string }>;
  /** 是否在新窗口打开 */
  external?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 导航栏配置接口
 * @interface NavbarConfig
 * @description 定义导航栏的整体配置选项
 */
export interface NavbarConfig {
  /** 品牌/Logo 配置 */
  brand: {
    /** 品牌名称 */
    name: string;
    /** 品牌链接 */
    href: string;
    /** 品牌 Logo 图片地址 */
    logo?: string;
  };
  /** 导航项列表 */
  items: NavItem[];
  /** 右侧操作区配置 */
  actions?: {
    /** 搜索按钮 */
    search?: boolean;
    /** 主题切换 */
    themeToggle?: boolean;
    /** 用户菜单 */
    userMenu?: boolean;
  };
}

/**
 * 导航栏组件属性接口
 * @interface NavbarProps
 * @description 定义导航栏 React 组件的 props
 */
export interface NavbarProps {
  /** 导航栏配置对象 */
  config: NavbarConfig;
  /** 自定义类名 */
  className?: string;
  /** 是否固定定位 */
  fixed?: boolean;
  /** 是否透明背景（用于顶部时） */
  transparent?: boolean;
}

/**
 * 移动端菜单状态
 * @interface MobileMenuState
 */
export interface MobileMenuState {
  /** 主菜单是否展开 */
  isOpen: boolean;
  /** 当前展开的子菜单 ID 集合 */
  expandedItems: Set<string>;
}

/**
 * 桌面端菜单状态
 * @interface DesktopMenuState
 */
export interface DesktopMenuState {
  /** 当前悬停的菜单项 ID */
  hoveredItem: string | null;
  /** 延迟关闭计时器 */
  closeTimer: NodeJS.Timeout | null;
}
