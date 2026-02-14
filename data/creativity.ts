// 定义外层分类的类型接口
export interface CreativityData {
    class_name: string;
    subtitle: string;
    creativity_list: CreativityItem[];
}

// 定义最内层创意项的类型接口
export interface CreativityItem {
    name: string;
    color: string;
    icon: string;
}

// 具体数据
export const creativityData: CreativityData[] = [
    {
        class_name: "开启创造力",
        subtitle: '技能',
        creativity_list: [
            {
                name: "React",
                color: "#61dafb",
                icon: "mdi:react"
            },
            {
                name: "Next.js",
                color: "#000000",
                icon: "logos:nextjs-icon"
            },
            {
                name: "TypeScript",
                color: "#3178c6",
                icon: "logos:typescript-icon"
            },
            {
                name: "Tailwind",
                color: "#06b6d4",
                icon: "mdi:tailwind"
            },
            {
                name: "Node.js",
                color: "#339933",
                icon: "mdi:nodejs"
            },
            {
                name: "Git",
                color: "#ffffff",
                icon: "logos:git-icon"
            },
            {
                name: "VS Code",
                color: "#007acc",
                icon: "logos:visual-studio-code"
            },
            {
                name: "Markdown",
                color: "#61dafb",
                icon: "material-symbols:markdown"
            }
        ],
    },
];
