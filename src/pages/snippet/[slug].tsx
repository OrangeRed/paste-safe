import { useEffect, useState } from "react"
import { AES, enc as encoding } from "crypto-ts"
import {
  type GetStaticPaths,
  type GetStaticPropsContext,
  type InferGetStaticPropsType,
} from "next"

import { createProxySSGHelpers } from "@trpc/react-query/ssg"
import superjson from "superjson"
import { appRouter } from "~/server/api/root"
import { createInnerTRPCContext } from "~/server/api/trpc"
import { prisma } from "~/server/db"
import { api } from "~/utils/api"

// Generate all the valid urls for this slug
export const getStaticPaths: GetStaticPaths = async () => {
  // Get all snippets currently in the db
  const snippets = await prisma.snippet.findMany({
    select: {
      url: true,
      burnAt: true,
      createdAt: true,
    },
  })

  return {
    // Only keep urls that don't have a burn date or have not been burned yet
    paths: snippets.reduce((urls, { url, burnAt, createdAt }) => {
      if (!burnAt || burnAt > createdAt) {
        urls.push({ params: { slug: url } })
      }

      return urls
    }, [] as { params: Record<string, string> }[]),
    fallback: false,
  }
}

// Create the props for this page
export async function getStaticProps(
  context: GetStaticPropsContext<{ slug: string }>
) {
  // Get slug value
  const slug = context.params?.slug as string

  // Set up SSG helper to prefetch
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: createInnerTRPCContext({}),
    transformer: superjson, // optional - adds superjson serialization
  })

  // Prefetch the snippet so there is no loading state on render
  await ssg.snippet.getSnippet.prefetch(slug)

  // Pass prefetched values into props
  return {
    props: {
      trpcState: ssg.dehydrate(),
      snippetUrl: slug,
    },
    revalidate: 1,
  }
}

export default function PostViewPage({
  snippetUrl,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { data: snippet } = api.snippet.getSnippet.useQuery(snippetUrl, {
    enabled: false, // 'disable' refetching since the value is prefetched on the server
  })

  const [error, setError] = useState(false)
  const [message, setMessage] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    try {
      const descryptedMessage = AES.decrypt(
        snippet?.content ?? "",
        "" //! Decide whether to use <empty string> or snippetUrl as the default password
      ).toString(encoding.Utf8)

      setMessage(descryptedMessage)
    } catch (e) {
      setMessage("")
    }
  }, [snippet?.content])

  return (
    <main
      data-theme="halloween"
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]"
    >
      <div className="w-[64rem]">
        <div className="form-control">
          <label className="label">
            <span className="label-text text-base">Password</span>
          </label>
          <form
            className="flex flex-row gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              try {
                // returns <empty string> if unable to decrypt
                // toString will throw an error when it fails to encode
                const descryptedMessage = AES.decrypt(
                  snippet?.content ?? "",
                  password ?? "" //! Decide whether to use <empty string> or snippetUrl as the default password
                ).toString(encoding.Utf8)

                setError(!descryptedMessage)
                setMessage(descryptedMessage)
                setPassword("")
              } catch (e) {
                setError(true)
                setMessage("")
                setPassword("")
              }
            }}
          >
            <input
              className={`
                input-bordered input input-lg w-full
                ${error ? "input-error" : ""}
              `}
              value={password}
              placeholder="Password"
              onChange={(e) => {
                setError(false)
                setPassword(e.target.value)
              }}
            />
            <button className="btn-primary btn-lg btn">Submit</button>
          </form>
          {error && (
            <label className="label">
              <span className="label-text-alt text-base text-error">
                Incorrect password
              </span>
            </label>
          )}
        </div>

        <div className="form-control h-full">
          <label className="label">
            <span className="label-text text-base">Snippet</span>
          </label>
          <div className="relative flex h-full">
            <textarea
              className="textarea textarea-lg z-10 h-full w-full"
              value={message}
              readOnly
            />
            <div
              className={`
                alert absolute flex h-full w-full justify-center text-lg
                ${message ? "z-0 opacity-0" : "z-20 bg-zinc-800 opacity-100"}
              `}
            >
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 flex-shrink-0 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>This snippet is password protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
