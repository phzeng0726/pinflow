import { createFileRoute } from '@tanstack/react-router'
import { PinWindow } from '../features/pin/PinWindow'

export const Route = createFileRoute('/pin')({
  component: PinWindow,
})
