import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface CreateSnapshotDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => void
  isPending: boolean
}

export function CreateSnapshotDialog({ open, onClose, onCreate, isPending }: CreateSnapshotDialogProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')

  const handleSubmit = () => {
    onCreate(name.trim())
    setName('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-w-sm flex-col overflow-hidden p-0">
        <DialogTitle className="sr-only">{t('snapshot.createTitle')}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-3 dark:border-gray-700">
          <span className="text-xl font-semibold">{t('snapshot.createTitle')}</span>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-2 px-6 py-4">
          <Label htmlFor="snapshot-name">{t('snapshot.nameLabel')}</Label>
          <Input
            id="snapshot-name"
            placeholder={t('snapshot.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-6 py-3 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isPending}>{t('common.create')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
