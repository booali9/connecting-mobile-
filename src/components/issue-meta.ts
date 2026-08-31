import type { Ionicons } from '@expo/vector-icons'

import type { IssueType, Priority, Status } from '../store/issues'
import type { Palette } from '../theme/tokens'

type IconName = keyof typeof Ionicons.glyphMap
type Meta = { name: IconName; tone: keyof Palette }

/**
 * Issue type and priority are scanned, not read. Both keep a fixed icon and
 * colour everywhere they appear, matching the web app's mapping.
 */
export const TYPE_ICON: Record<IssueType, Meta & { label: string }> = {
  epic: { name: 'flash', tone: 'info', label: 'Epic' },
  story: { name: 'bookmark', tone: 'success', label: 'Story' },
  task: { name: 'checkbox', tone: 'info', label: 'Task' },
  bug: { name: 'bug', tone: 'danger', label: 'Bug' },
}

export const PRIORITY_ICON: Record<Priority, Meta & { label: string }> = {
  highest: { name: 'chevron-up-circle', tone: 'danger', label: 'Highest' },
  high: { name: 'chevron-up', tone: 'danger', label: 'High' },
  medium: { name: 'remove', tone: 'warning', label: 'Medium' },
  low: { name: 'chevron-down', tone: 'info', label: 'Low' },
  lowest: { name: 'chevron-down-circle', tone: 'mutedText', label: 'Lowest' },
}

export const STATUS_TONE: Record<Status, 'default' | 'info' | 'brand' | 'warning' | 'success'> = {
  backlog: 'default',
  todo: 'info',
  in_progress: 'brand',
  review: 'warning',
  done: 'success',
}
