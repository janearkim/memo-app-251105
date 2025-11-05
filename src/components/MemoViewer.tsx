'use client'

import { useEffect, type MouseEvent } from 'react'
import '@uiw/react-md-editor/markdown-editor.css'
import MarkdownPreview from '@uiw/react-markdown-preview'
import '@uiw/react-markdown-preview/markdown.css'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'

interface MemoViewerProps {
  isOpen: boolean
  memo: Memo | null
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
}

export default function MemoViewer({
  isOpen,
  memo,
  onClose,
  onEdit,
  onDelete,
}: MemoViewerProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !memo) {
    return null
  }

  const handleBackdropClick = () => {
    onClose()
  }

  const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }

  const handleEdit = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onEdit(memo)
  }

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      onDelete(memo.id)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={handleContentClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="memo-viewer-title"
      >
        <div className="flex items-start justify-between border-b border-gray-200 p-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                {MEMO_CATEGORIES[memo.category as keyof typeof MEMO_CATEGORIES] || memo.category}
              </span>
              <span className="text-xs text-gray-500">
                수정: {formatDateTime(memo.updatedAt)}
              </span>
            </div>
            <h2 id="memo-viewer-title" className="text-2xl font-semibold text-gray-900">
              {memo.title}
            </h2>
            <p className="mt-1 text-xs text-gray-400">작성: {formatDateTime(memo.createdAt)}</p>
          </div>
          <button
            onClick={event => {
              event.stopPropagation()
              onClose()
            }}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="닫기"
            type="button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 p-6">
          <section>
            <h3 className="mb-2 text-sm font-medium text-gray-500">내용</h3>
            <div data-color-mode="light" className="markdown-body">
              <MarkdownPreview source={memo.content} />
            </div>
          </section>

          {memo.tags.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-medium text-gray-500">태그</h3>
              <div className="flex flex-wrap gap-2">
                {memo.tags.map(tag => (
                  <span
                    key={tag}
                    className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              className="flex-1 rounded-lg border border-blue-600 px-4 py-2 text-blue-600 transition-colors hover:bg-blue-50"
              type="button"
            >
              편집
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 rounded-lg border border-red-600 px-4 py-2 text-red-600 transition-colors hover:bg-red-50"
              type="button"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

