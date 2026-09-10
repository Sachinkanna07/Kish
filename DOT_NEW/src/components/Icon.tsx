import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'arrow'
  | 'bell'
  | 'book'
  | 'calendar'
  | 'check'
  | 'chevron'
  | 'clock'
  | 'close'
  | 'dashboard'
  | 'field'
  | 'home'
  | 'leaf'
  | 'location'
  | 'logout'
  | 'money'
  | 'phone'
  | 'profile'
  | 'queue'
  | 'refresh'
  | 'shield'
  | 'speaker'
  | 'ticket'
  | 'warning'
  | 'weight'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
  title?: string
}

/** Purposeful, line-based icons keep DOT readable without looking like a generic emoji dashboard. */
export function Icon({ name, size = 20, title, ...props }: IconProps) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  const paths: Record<IconName, ReactNode> = {
    arrow: <><path {...common} d="M5 12h14" /><path {...common} d="m13 6 6 6-6 6" /></>,
    bell: <><path {...common} d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path {...common} d="M10 22h4" /></>,
    book: <><path {...common} d="M5 4.5h10a4 4 0 0 1 4 4V20H8a3 3 0 0 0-3 3z" /><path {...common} d="M5 4.5V20a3 3 0 0 1 3-3h11" /></>,
    calendar: <><rect {...common} x="3" y="5" width="18" height="16" rx="2" /><path {...common} d="M16 3v4M8 3v4M3 11h18" /><path {...common} d="M8 15h.01M12 15h.01M16 15h.01" /></>,
    check: <path {...common} d="m5 12 4 4L19 6" />,
    chevron: <path {...common} d="m9 18 6-6-6-6" />,
    clock: <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="M12 7v5l3.5 2" /></>,
    close: <><path {...common} d="m6 6 12 12M18 6 6 18" /></>,
    dashboard: <><rect {...common} x="3" y="3" width="7" height="7" rx="1" /><rect {...common} x="14" y="3" width="7" height="7" rx="1" /><rect {...common} x="3" y="14" width="7" height="7" rx="1" /><rect {...common} x="14" y="14" width="7" height="7" rx="1" /></>,
    field: <><path {...common} d="M3 20c4-5 6-5 9 0 3-5 5-5 9 0" /><path {...common} d="M3 14c4-5 6-5 9 0 3-5 5-5 9 0" /><path {...common} d="M12 4v9M8 7c2 0 4 1 4 4-3 0-4-2-4-4M16 7c-2 0-4 1-4 4 3 0 4-2 4-4" /></>,
    home: <><path {...common} d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path {...common} d="M9 21v-7h6v7" /></>,
    leaf: <path {...common} d="M20.5 3.5C12.5 3 5.5 5.5 4 13c-.7 3.5 1.4 6.5 4.9 6.5C16.2 19.5 20 10.5 20.5 3.5ZM4.8 18.2c2.8-3.4 6.4-5.9 11.2-7.7" />,
    location: <><path {...common} d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle {...common} cx="12" cy="10" r="2.5" /></>,
    logout: <><path {...common} d="M10 17l5-5-5-5M15 12H3" /><path {...common} d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
    money: <><rect {...common} x="3" y="5" width="18" height="14" rx="2" /><circle {...common} cx="12" cy="12" r="2.5" /><path {...common} d="M7 9h.01M17 15h.01" /></>,
    phone: <path {...common} d="M5 4.5 8.2 3l2.3 4.5-2 1.6a15 15 0 0 0 6.4 6.4l1.6-2 4.5 2.3-1.5 3.2c-.4.9-1.4 1.4-2.4 1.1C9.6 18.3 5.7 14.4 3.9 6.9 3.6 5.9 4.1 4.9 5 4.5Z" />,
    profile: <><circle {...common} cx="12" cy="8" r="4" /><path {...common} d="M4 21a8 8 0 0 1 16 0" /></>,
    queue: <><path {...common} d="M6 5h15M6 12h15M6 19h15" /><path {...common} d="M3 5h.01M3 12h.01M3 19h.01" /></>,
    refresh: <><path {...common} d="M20 11a8 8 0 0 0-14.8-3L3 10" /><path {...common} d="M3 4v6h6" /><path {...common} d="M4 13a8 8 0 0 0 14.8 3L21 14" /><path {...common} d="M21 20v-6h-6" /></>,
    shield: <><path {...common} d="M12 3 4 6v5c0 5.1 3.4 8.7 8 10 4.6-1.3 8-4.9 8-10V6z" /><path {...common} d="m8.5 12 2.2 2.2 4.8-4.8" /></>,
    speaker: <><path {...common} d="M4 10v4h4l5 4V6l-5 4z" /><path {...common} d="M17 9a4 4 0 0 1 0 6M19.5 6.5a7.5 7.5 0 0 1 0 11" /></>,
    ticket: <><path {...common} d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4z" /><path {...common} d="M12 5v14" /></>,
    warning: <><path {...common} d="M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" /><path {...common} d="M12 9v4M12 17h.01" /></>,
    weight: <><path {...common} d="M7 6h10l3 14H4z" /><circle {...common} cx="12" cy="9" r="2" /><path {...common} d="M9 3h6" /></>,
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} {...props}>
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  )
}
