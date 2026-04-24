import { router } from '../init'
import { assetRouter } from './asset'
import { collectionRouter } from './collection'
import { uploadRouter } from './upload'
import { userRouter } from './user'

export const appRouter = router({
  user: userRouter,
  asset: assetRouter,
  collection: collectionRouter,
  upload: uploadRouter,
})

export type AppRouter = typeof appRouter
