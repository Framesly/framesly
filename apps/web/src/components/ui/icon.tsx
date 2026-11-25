import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  GripVertical,
  Heart,
  Images,
  Image as ImageIcon,
  Info,
  Moon,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Share,
  Star,
  Sun,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  X,
  ZoomIn,
  ZoomOut,
  type LucideProps,
} from "lucide-react"

import { cn } from "@/lib/utils"

/*
 * The one icon set. Add a name here instead of drawing a new inline <svg>.
 * Icons are decorative by default (hidden from screen readers) because the
 * button or text next to them carries the meaning; pass `label` for a
 * standalone icon that must be announced.
 */
const icons = {
  "arrow-down": ArrowDown,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up": ArrowUp,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  close: X,
  copy: Copy,
  download: Download,
  eye: Eye,
  "eye-off": EyeOff,
  grip: GripVertical,
  heart: Heart,
  image: ImageIcon,
  images: Images,
  info: Info,
  moon: Moon,
  pause: Pause,
  pencil: Pencil,
  play: Play,
  plus: Plus,
  retry: RotateCcw,
  search: Search,
  settings: Settings,
  share: Share,
  star: Star,
  sun: Sun,
  trash: Trash2,
  upload: Upload,
  user: User,
  warning: TriangleAlert,
  "zoom-in": ZoomIn,
  "zoom-out": ZoomOut,
} as const

export type IconName = keyof typeof icons

export function Icon({ name, label, className, strokeWidth = 1.75, ...props }: { name: IconName; label?: string } & Omit<LucideProps, "ref">) {
  const Glyph = icons[name]
  return (
    <Glyph
      className={cn("size-5 shrink-0", className)}
      strokeWidth={strokeWidth}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      {...props}
    />
  )
}
