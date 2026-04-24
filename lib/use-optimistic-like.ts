'use client'

import { startTransition, useEffect, useOptimistic, useState } from 'react'

export type LikeState = {
  isLiked: boolean
  count: number
}

type LikeAction = { type: 'toggle' } | { type: 'reset'; payload: LikeState }

function getNextLikeState(state: LikeState): LikeState {
  return {
    isLiked: !state.isLiked,
    count: Math.max(0, state.count + (state.isLiked ? -1 : 1)),
  }
}

export function useOptimisticLike(initialState: LikeState) {
  const [serverLike, setServerLike] = useState<LikeState>(initialState)
  const [optimisticLike, setOptimisticLike] = useOptimistic(
    serverLike,
    (state: LikeState, action: LikeAction) => {
      if (action.type === 'reset') return action.payload
      return getNextLikeState(state)
    },
  )

  useEffect(() => {
    setServerLike(initialState)
  }, [initialState])

  const optimisticToggle = () => {
    const previous = serverLike
    const next = getNextLikeState(previous)
    startTransition(() => {
      setOptimisticLike({ type: 'toggle' })
    })
    return { previous, next }
  }

  const commit = (nextState: LikeState) => {
    setServerLike(nextState)
  }

  const rollback = (previousState: LikeState) => {
    setServerLike(previousState)
    startTransition(() => {
      setOptimisticLike({ type: 'reset', payload: previousState })
    })
  }

  return {
    optimisticLike,
    optimisticToggle,
    commit,
    rollback,
  }
}
