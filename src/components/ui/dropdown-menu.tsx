import { Menu } from '@base-ui/react/menu'
import type { ComponentProps, ReactNode } from 'react'

const DropdownMenu = Menu.Root

const DropdownMenuTrigger = (props: ComponentProps<typeof Menu.Trigger>) => (
  <Menu.Trigger
    {...props}
    className={`rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 ${props.className ?? ''}`}
  />
)

const DropdownMenuContent = ({
  children,
  className,
  ...positionerProps
}: { children: ReactNode; className?: string } & Omit<
  ComponentProps<typeof Menu.Positioner>,
  'children'
>) => (
  <Menu.Portal>
    <Menu.Positioner className="z-50" sideOffset={4} {...positionerProps}>
      <Menu.Popup
        className={`min-w-44 rounded-xl bg-white p-1 shadow-lg ring-1 ring-gray-200 ${className ?? ''}`}
      >
        {children}
      </Menu.Popup>
    </Menu.Positioner>
  </Menu.Portal>
)

const DropdownMenuItem = (props: ComponentProps<typeof Menu.Item>) => (
  <Menu.Item
    {...props}
    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 data-highlighted:bg-gray-50 ${props.className ?? ''}`}
  />
)

const DropdownMenuSeparator = () => (
  <Menu.Separator className="my-1 border-t border-gray-100" />
)

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}
