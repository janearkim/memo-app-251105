'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Memo, MemoFormData } from '@/types/memo'
import { supabase } from '@/lib/supabaseClient'
import { ensureSampleData } from '@/utils/seedData'

type SupabaseMemoRow = {
  id: string
  title: string
  content: string
  category: string
  tags: string[] | null
  summary: string | null
  created_at: string
  updated_at: string
}

const mapRowToMemo = (row: SupabaseMemoRow): Memo => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  tags: row.tags ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 메모 로드
  useEffect(() => {
    const loadMemos = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('memos')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Failed to load memos:', error)
          return
        }

        const loadedMemos = data ? data.map(mapRowToMemo) : []
        setMemos(loadedMemos)

        // 데이터가 없으면 샘플 데이터 시딩
        if (loadedMemos.length === 0) {
          await ensureSampleData()
          // 다시 로드
          const { data: seededData, error: reloadError } = await supabase
            .from('memos')
            .select('*')
            .order('created_at', { ascending: false })

          if (!reloadError && seededData) {
            setMemos(seededData.map(mapRowToMemo))
          }
        }
      } catch (error) {
        console.error('Failed to load memos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMemos()
  }, [])

  // 메모 생성
  const createMemo = useCallback(
    async (formData: MemoFormData): Promise<Memo | null> => {
      try {
        const { data, error } = await supabase
          .from('memos')
          .insert({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            tags: formData.tags,
          })
          .select()
          .single()

        if (error) {
          console.error('Failed to create memo:', error)
          return null
        }

        const newMemo = mapRowToMemo(data)
        setMemos(prev => [newMemo, ...prev])
        return newMemo
      } catch (error) {
        console.error('Failed to create memo:', error)
        return null
      }
    },
    []
  )

  // 메모 업데이트
  const updateMemo = useCallback(
    async (id: string, formData: MemoFormData): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('memos')
          .update({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            tags: formData.tags,
          })
          .eq('id', id)
          .select()
          .single()

        if (error) {
          console.error('Failed to update memo:', error)
          return
        }

        if (data) {
          const updatedMemo = mapRowToMemo(data)
          setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
        }
      } catch (error) {
        console.error('Failed to update memo:', error)
      }
    },
    []
  )

  // 메모 삭제
  const deleteMemo = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('memos').delete().eq('id', id)

      if (error) {
        console.error('Failed to delete memo:', error)
        return
      }

      setMemos(prev => prev.filter(memo => memo.id !== id))
    } catch (error) {
      console.error('Failed to delete memo:', error)
    }
  }, [])

  // 메모 검색
  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  // 카테고리 필터링
  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  // 특정 메모 가져오기
  const getMemoById = useCallback(
    (id: string): Memo | undefined => {
      return memos.find(memo => memo.id === id)
    },
    [memos]
  )

  // 필터링된 메모 목록
  const filteredMemos = useMemo(() => {
    let filtered = memos

    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [memos, selectedCategory, searchQuery])

  // 모든 메모 삭제
  const clearAllMemos = useCallback(async (): Promise<void> => {
    try {
      const { error } = await supabase.from('memos').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      if (error) {
        console.error('Failed to clear memos:', error)
        return
      }

      setMemos([])
      setSearchQuery('')
      setSelectedCategory('all')
    } catch (error) {
      console.error('Failed to clear memos:', error)
    }
  }, [])

  // 통계 정보
  const stats = useMemo(() => {
    const totalMemos = memos.length
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: totalMemos,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    // 상태
    memos: filteredMemos,
    allMemos: memos,
    loading,
    searchQuery,
    selectedCategory,
    stats,

    // 메모 CRUD
    createMemo,
    updateMemo,
    deleteMemo,
    getMemoById,

    // 필터링 & 검색
    searchMemos,
    filterByCategory,

    // 유틸리티
    clearAllMemos,
  }
}
