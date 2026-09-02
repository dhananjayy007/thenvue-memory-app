import {
  Archive, BookOpen, Clock3, MapPin, Users, Film,
} from 'lucide-react'
import { CustomBrainIcon } from '@/components/icons/custom-brain-icon'
import type { NavItem } from '@/types/memory'

export const nav: NavItem[] = [
  { id: 'home', label: 'Home', icon: BookOpen },
  { id: 'timeline', label: 'Timeline', icon: Clock3 },
  { id: 'rediscover', label: 'Rediscover', icon: Film },
  { id: 'memories', label: 'Memories', icon: Archive },
  { id: 'ask', label: 'Ask', icon: CustomBrainIcon as any },
  { id: 'people', label: 'People', icon: Users },
  { id: 'places', label: 'Places', icon: MapPin },
]
