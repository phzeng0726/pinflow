import { usePinStore } from '../../stores/pinStore'
import { PinWindow } from './PinWindow'

/**
 * Web-mode overlay: shows pin window as a floating panel in the bottom-right corner.
 * In Electron mode this is not used (separate BrowserWindow handles /pin route).
 */
export function PinOverlay() {
  const { isOpen } = usePinStore()
  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 w-72 max-h-[70vh] shadow-2xl rounded-xl overflow-hidden border z-50">
      <PinWindow />
    </div>
  )
}
