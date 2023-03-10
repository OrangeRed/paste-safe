import { type NextPage } from "next"
import Head from "next/head"
import { useState } from "react"
import { AES } from "crypto-ts"
import { createId } from "@paralleldrive/cuid2"

import { api } from "~/utils/api"

const Home: NextPage = () => {
  const createSnippet = api.snippet.createSnippet.useMutation()

  const [snippetPassword, setSnippetPassword] = useState("")
  const [snippetContents, setSnippetContents] = useState("")

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        data-theme="halloween"
        className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]"
      >
        <div className="w-[64rem]">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-base">Password</span>
            </label>
            <div className="flex flex-row gap-2">
              <input
                className="input-bordered input input-lg w-full"
                placeholder="Password"
                onChange={(e) => setSnippetPassword(e.target.value)}
              />
              <button
                className={`
                  btn-primary btn-lg btn
                  ${!snippetContents ? "btn-disabled" : ""}  
                `}
                onClick={() => {
                  const url = createId()
                  const encryptedSnippet = AES.encrypt(
                    snippetContents,
                    snippetPassword
                  ).toString()

                  createSnippet.mutate({ url, content: encryptedSnippet })
                }}
              >
                Submit
              </button>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-base">Snippet</span>
            </label>
            <textarea
              className="textarea-bordered textarea textarea-lg"
              value={snippetContents}
              placeholder="Snippet goes here"
              onChange={(e) => setSnippetContents(e.target.value)}
            />
          </div>
        </div>
      </main>
    </>
  )
}

export default Home
