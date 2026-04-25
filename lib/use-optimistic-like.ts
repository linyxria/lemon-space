'use client'

import { useState } from 'react'

export type LikeState = {
  isLiked: boolean
  count: number
}

function getNextLikeState(state: LikeState): LikeState {
  return {
    isLiked: !state.isLiked,
    count: Math.max(0, state.count + (state.isLiked ? -1 : 1)),
  }
}

export function useOptimisticLike(initialState: LikeState) {
  const [state, setState] = useState<{
    key: string
    like: LikeState
  }>({
    key: `${initialState.isLiked ? 1 : 0}:${initialState.count}`,
    like: initialState,
  })

  const initialKey = `${initialState.isLiked ? 1 : 0}:${initialState.count}`
  const optimisticLike = state.key === initialKey ? initialState : state.like

  const optimisticToggle = () => {
    const previous = optimisticLike
    const next = getNextLikeState(previous)
    setState({
      key: `${next.isLiked ? 1 : 0}:${next.count}`,
      like: next,
    })
    return { previous, next }
  }

  const commit = (nextState: LikeState) => {
    setState({
      key: `${nextState.isLiked ? 1 : 0}:${nextState.count}`,
      like: nextState,
    })
  }

  const rollback = (previousState: LikeState) => {
    setState({
      key: `${previousState.isLiked ? 1 : 0}:${previousState.count}`,
      like: previousState,
    })
  }

  return {
    optimisticLike,
    optimisticToggle,
    commit,
    rollback,
  }
}
