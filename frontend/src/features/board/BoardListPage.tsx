import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Trash2, LayoutDashboard, Sun, Moon } from 'lucide-react'
import { useBoards, useCreateBoard, useDeleteBoard } from '../../hooks/useBoards'
import { useThemeStore } from '../../stores/themeStore'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

export function BoardListPage() {
  const { data: boards = [], isLoading } = useBoards()
  const createBoard = useCreateBoard()
  const deleteBoard = useDeleteBoard()
  const navigate = useNavigate()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!newName.trim()) return
    await createBoard.mutateAsync(newName.trim())
    setNewName('')
    setCreating(false)
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
      Loading...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            我的看板
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'dark' ? '切換亮色模式' : '切換暗色模式'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Button onClick={() => setCreating(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              新增看板
            </Button>
          </div>
        </div>

        {creating && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 mb-4 flex gap-2">
            <Input
              placeholder="看板名稱"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
              className="flex-1"
            />
            <Button onClick={handleCreate} disabled={!newName.trim()}>建立</Button>
            <Button variant="ghost" onClick={() => setCreating(false)}>取消</Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map(board => (
            <div
              key={board.id}
              className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => navigate({ to: '/boards/$boardId', params: { boardId: String(board.id) } })}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">{board.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {board.columns?.length ?? 0} 個欄位
                  </p>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                  onClick={e => {
                    e.stopPropagation()
                    deleteBoard.mutate(board.id)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {boards.length === 0 && !creating && (
            <div className="col-span-3 text-center py-12 text-gray-400 dark:text-gray-600">
              <LayoutDashboard className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>尚未建立任何看板</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
