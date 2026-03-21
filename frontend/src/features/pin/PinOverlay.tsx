import { usePinStore } from '../../stores/pinStore'
import { PinWindow } from './PinWindow'

/**
 * Web-mode overlay: shows pin window as a floating panel in the bottom-right corner.
 * In Electron mode this is not used (separate BrowserWindow handles /pin route).
 */
export function PinOverlay() {
  const isOpen = usePinStore((s) => s.isOpen)
  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-h-[70vh] w-72 overflow-hidden rounded-xl border shadow-2xl">
      <PinWindow />
    </div>
  )
}
