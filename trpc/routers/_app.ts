import { router } from "../init"
import { assetRouter } from "./asset"
import { collectionRouter } from "./collection"
import { postRouter } from "./post"
import { uploadRouter } from "./upload"
import { userRouter } from "./user"

export const appRouter = router({
  user: userRouter,
  asset: assetRouter,
  post: postRouter,
  collection: collectionRouter,
  upload: uploadRouter,
})

export type AppRouter = typeof appRouter
