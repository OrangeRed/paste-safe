import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const snippetRouter = createTRPCRouter({
  // Store an encrypted snippet
  createSnippet: publicProcedure
    .input(
      z.object({
        url: z.string(),
        content: z.string(),
        burnAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.snippet.create({
        data: {
          url: input.url,
          content: input.content,
          burnAt: input.burnAt,
        },
      });
    }),

  // Get a snippet's contents if it hasn't been burned yet
  getSnippet: publicProcedure.input(String).query(async ({ ctx, input }) => {
    return ctx.prisma.snippet.findFirstOrThrow({
      where: {
        url: input,
        // burnAt: {
        //   lt: new Date(),
        // },
      },
    });
  }),
});
