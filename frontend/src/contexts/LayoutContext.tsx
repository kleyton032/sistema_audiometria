import { createContext, useContext } from 'react'

interface LayoutControlsValue {
  collapsed: boolean
  toggleSidebar: () => void
  openProfile: () => void
}

const defaultValue: LayoutControlsValue = {
  collapsed: false,
  toggleSidebar: () => {},
  openProfile: () => {},
}

export const LayoutControlsContext = createContext<LayoutControlsValue>(defaultValue)

export function useLayoutControls() {
  return useContext(LayoutControlsContext)
}
