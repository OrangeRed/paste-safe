import {
  type GetStaticPaths,
  type GetStaticPropsContext,
  type InferGetStaticPropsType,
} from "next";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { appRouter } from "~/server/api/root";
import superjson from "superjson";
import { createInnerTRPCContext } from "~/server/api/trpc";
import { prisma } from "~/server/db";

import { api } from "~/utils/api";

// Generate all the valid urls for this slug
export const getStaticPaths: GetStaticPaths = async () => {
  // Get all snippets currently in the db
  const snippets = await prisma.snippet.findMany({
    select: {
      url: true,
      burnAt: true,
      createdAt: true,
    },
  });

  return {
    // Only keep urls that don't have a burn date or have not been burned yet
    paths: snippets.reduce((urls, { url, burnAt, createdAt }) => {
      if (!burnAt || burnAt > createdAt) {
        urls.push({ params: { slug: url } });
      }

      return urls;
    }, [] as { params: Record<string, string> }[]),
    fallback: false,
  };
};

// Create the props for this page
export async function getStaticProps(
  context: GetStaticPropsContext<{ slug: string }>
) {
  // Get slug value
  const snippetUrl = context.params?.slug as string;

  // Set up SSG helper to prefetch
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: createInnerTRPCContext({}),
    transformer: superjson, // optional - adds superjson serialization
  });

  // Prefetch the snippet so there is no loading state on render
  await ssg.snippet.getSnippet.prefetch(snippetUrl);

  // Pass prefetched values into props
  return {
    props: {
      trpcState: ssg.dehydrate(),
      snippetUrl,
    },
    revalidate: 1,
  };
}

export default function PostViewPage(
  props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { snippetUrl } = props;
  const { data: snippet } = api.snippet.getSnippet.useQuery(snippetUrl, {
    enabled: false, // 'disable' refetching since the value is prefetched on the server
  });

  return (
    <main
      data-theme="halloween"
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]"
    >
      <h1>{snippet?.content}</h1>
      <em>Created {snippet?.createdAt.toLocaleDateString("en-us")}</em>

      <h2>Raw data:</h2>
      <pre>{JSON.stringify(snippet, null, 4)}</pre>
    </main>
  );
}
