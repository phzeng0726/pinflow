import { createFileRoute } from '@tanstack/react-router'
import { PinWindow } from '@/pages/pin/PinWindow'

export const Route = createFileRoute('/pin')({
  component: PinWindow,
})
