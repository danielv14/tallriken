import { getDb } from "#/db/client";
import { importFromPhotos, importFromUrl } from "#/import/pipeline";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { authMiddleware } from "#/auth/middleware";

export const extractRecipeFromUrl = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ url: z.string().url() }))
  .handler(({ data }) =>
    importFromUrl(data.url, {
      db: getDb(),
      openaiApiKey: env.OPENAI_API_KEY,
    }),
  );

export const extractRecipeFromPhotos = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      images: z
        .array(
          z.object({
            base64: z.string().min(1),
            mimeType: z.string().min(1),
          }),
        )
        .min(1),
    }),
  )
  .handler(({ data }) =>
    importFromPhotos(data.images, {
      db: getDb(),
      openaiApiKey: env.OPENAI_API_KEY,
    }),
  );
