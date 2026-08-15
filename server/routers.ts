import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { cancelPrediction, createPrediction, getPrediction, prepareUpload, renderInput, uploadInput } from "./lipsync";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  lipsync: router({
    prepareUpload: publicProcedure.input(uploadInput).mutation(({ ctx, input }) => prepareUpload(ctx.req, input)),
    create: publicProcedure.input(renderInput).mutation(({ input }) => createPrediction(input)),
    status: publicProcedure.input(z.object({ jobId: z.string().trim().min(1).max(120) })).query(({ input }) => getPrediction(input.jobId)),
    cancel: publicProcedure.input(z.object({ jobId: z.string().trim().min(1).max(120) })).mutation(({ input }) => cancelPrediction(input.jobId)),
  }),
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
