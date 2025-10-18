import type { Meta, StoryObj } from "@storybook/react";
import { CategoryIcon } from "./CategoryIcon";

const meta: Meta<typeof CategoryIcon> = {
  title: "Atoms/CategoryIcon",
  component: CategoryIcon,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "カテゴリアイコンを表示するコンポーネント。lucide-reactのアイコンを動的に表示し、存在しないアイコン名の場合はMapPinIconをフォールバックとして表示します。",
      },
    },
  },
  argTypes: {
    iconName: {
      control: "select",
      options: [
        "MapPin",
        "Users",
        "Briefcase",
        "Wheat",
        "Factory",
        "Store",
        "TrendingUp",
        "Home",
        "Zap",
        "Plane",
        "GraduationCap",
        "Building2",
        "Shield",
        "Heart",
        "Globe",
        "Construction",
        "Sprout",
        "PieChart",
        "Droplets",
        "ShieldCheck",
        "Hospital",
      ],
      description: "表示するアイコンの名前",
    },
    className: {
      control: "text",
      description: "アイコンに適用するCSSクラス",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    iconName: "MapPin",
    className: "w-5 h-5",
  },
};

export const Users: Story = {
  args: {
    iconName: "Users",
    className: "w-6 h-6 text-blue-500",
  },
};

export const Briefcase: Story = {
  args: {
    iconName: "Briefcase",
    className: "w-8 h-8 text-green-500",
  },
};

export const Wheat: Story = {
  args: {
    iconName: "Wheat",
    className: "w-7 h-7 text-yellow-500",
  },
};

export const Factory: Story = {
  args: {
    iconName: "Factory",
    className: "w-6 h-6 text-gray-600",
  },
};

export const Store: Story = {
  args: {
    iconName: "Store",
    className: "w-5 h-5 text-purple-500",
  },
};

export const TrendingUp: Story = {
  args: {
    iconName: "TrendingUp",
    className: "w-6 h-6 text-green-600",
  },
};

export const Home: Story = {
  args: {
    iconName: "Home",
    className: "w-5 h-5 text-indigo-500",
  },
};

export const Zap: Story = {
  args: {
    iconName: "Zap",
    className: "w-6 h-6 text-yellow-400",
  },
};

export const Plane: Story = {
  args: {
    iconName: "Plane",
    className: "w-5 h-5 text-sky-500",
  },
};

export const GraduationCap: Story = {
  args: {
    iconName: "GraduationCap",
    className: "w-6 h-6 text-blue-600",
  },
};

export const Building2: Story = {
  args: {
    iconName: "Building2",
    className: "w-5 h-5 text-gray-700",
  },
};

export const Shield: Story = {
  args: {
    iconName: "Shield",
    className: "w-6 h-6 text-red-500",
  },
};

export const Heart: Story = {
  args: {
    iconName: "Heart",
    className: "w-5 h-5 text-pink-500",
  },
};

export const Globe: Story = {
  args: {
    iconName: "Globe",
    className: "w-6 h-6 text-cyan-500",
  },
};

export const Construction: Story = {
  args: {
    iconName: "Construction",
    className: "w-5 h-5 text-orange-500",
  },
};

export const Sprout: Story = {
  args: {
    iconName: "Sprout",
    className: "w-6 h-6 text-green-400",
  },
};

export const PieChart: Story = {
  args: {
    iconName: "PieChart",
    className: "w-5 h-5 text-indigo-600",
  },
};

export const Droplets: Story = {
  args: {
    iconName: "Droplets",
    className: "w-6 h-6 text-blue-400",
  },
};

export const ShieldCheck: Story = {
  args: {
    iconName: "ShieldCheck",
    className: "w-5 h-5 text-green-600",
  },
};

export const Hospital: Story = {
  args: {
    iconName: "Hospital",
    className: "w-6 h-6 text-red-600",
  },
};

export const FallbackIcon: Story = {
  args: {
    iconName: "NonExistentIcon",
    className: "w-5 h-5 text-gray-500",
  },
  parameters: {
    docs: {
      description: {
        story:
          "存在しないアイコン名を指定した場合、MapPinIconがフォールバックとして表示されます。",
      },
    },
  },
};

export const CustomSize: Story = {
  args: {
    iconName: "MapPin",
    className: "w-12 h-12 text-blue-500",
  },
  parameters: {
    docs: {
      description: {
        story: "カスタムサイズと色を指定した例です。",
      },
    },
  },
};

export const AllIcons: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4 p-4">
      {[
        "MapPin",
        "Users",
        "Briefcase",
        "Wheat",
        "Factory",
        "Store",
        "TrendingUp",
        "Home",
        "Zap",
        "Plane",
        "GraduationCap",
        "Building2",
        "Shield",
        "Heart",
        "Globe",
        "Construction",
        "Sprout",
        "PieChart",
        "Droplets",
        "ShieldCheck",
        "Hospital",
      ].map((iconName) => (
        <div
          key={iconName}
          className="flex flex-col items-center gap-2 p-2 border rounded"
        >
          <CategoryIcon iconName={iconName} className="w-6 h-6" />
          <span className="text-xs text-gray-600">{iconName}</span>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "利用可能な全てのアイコンの一覧表示です。",
      },
    },
  },
};
