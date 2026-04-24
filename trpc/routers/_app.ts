import { router } from '../init'
import { assetRouter } from './asset'
import { uploadRouter } from './upload'
// import { uploadRouter } from './upload'
import { userRouter } from './user'

export const appRouter = router({
  user: userRouter,
  asset: assetRouter,
  upload: uploadRouter,
})

export type AppRouter = typeof appRouter
