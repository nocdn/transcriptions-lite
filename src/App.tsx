import { useState } from "react"
import DropZone from "./DropZone"
import { Check, Copy, Gauge, X } from "lucide-react"
import AudioIcon from "./components/icons/audio"
import Spinner from "./components/Spinner"
import { AnimatedCircularButton } from "./components/AnimatedButton"

const API_URL = import.meta.env.VITE_BACKEND_URL

function App() {
  const [stage, setStage] = useState("initial")
  const [transcriptionText, setTranscriptionText] = useState("")
  const [copiedMessage, setCopiedMessage] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)

  function handleClick() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "audio/*"
    input.onchange = (event: any) => {
      const file = event.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    }
    if (transcriptionText !== "") {
      return
    } else {
      input.click()
    }
  }

  async function handleFile(file: any) {
    console.log(file)
    setStage("processing")
    setCopiedMessage(false)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("fireworksModelValue", "whisper-v3")
    formData.append("currentModelProvider", "fireworks")

    const response = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      body: formData,
    })

    if (response.status === 429) {
      console.log("rate limited")
      setIsRateLimited(true)
      return
    }

    const data = await response.json()
    console.log(data.transcription)
    navigator.clipboard.writeText(data.transcription)
    setTranscriptionText(data.transcription)
    setStage("done")
    setCopiedMessage(true)
  }

  return (
    <div className="grid place-content-center h-dvh w-screen motion-opacity-in-0">
      <DropZone onClick={handleClick} onDropped={handleFile} stage={stage}>
        {(() => {
          if (isRateLimited) {
            return (
              <div className="p-8 flex flex-col items-center text-red-600 motion-preset-focus-sm">
                <Gauge size={18} className="mb-3" />
                <p className="text-sm font-jetbrains-mono">rate limited</p>
                <p className="text-[13px] opacity-60 font-jetbrains-mono mt-1">
                  try again tomorrow
                </p>
              </div>
            )
          } else {
            if (stage === "initial") {
              return (
                <div className="ml-12 mr-12 mt-4 mb-4 flex flex-col items-center gap-1 motion-opacity-in-0 py-4">
                  <div className="w-13 h-13 border border-gray-100 rounded-full grid place-content-center mb-5">
                    <AudioIcon size={18} />
                  </div>
                  <p className="font-geist text-sm font-medium">
                    Drop an audio file here
                  </p>
                  <p className="opacity-60 font-jetbrains-mono text-sm">
                    Max size 100MB
                  </p>
                </div>
              )
            } else if (stage === "processing") {
              return (
                <div className="p-8 flex flex-col items-center text-blue-600 motion-preset-focus-sm">
                  <Spinner size={18} className="mb-3" />
                  <p className="text-sm font-geist-mono">transcribing</p>
                </div>
              )
            } else if (stage === "done") {
              return (
                <div className="flex flex-col items-center">
                  <p className="font-geist text-[15px] max-w-md h-fit py-3 px-1">
                    {transcriptionText}
                  </p>
                </div>
              )
            } else {
              return null
            }
          }
        })()}
      </DropZone>

      {copiedMessage ? (
        <div className="animate-copied-message-up flex gap-3 justify-center items-center mt-4">
          <div className="cursor-pointer bg-gray-100 rounded-full grid place-content-center text-gray-600">
            <AnimatedCircularButton
              ariaLabel="Copy to clipboard"
              onClick={() => {
                navigator.clipboard.writeText(transcriptionText)
                setTranscriptionText(transcriptionText)
              }}
              secondaryChildren={<Check size={14.45} strokeWidth={2.5} />}
            >
              <Copy
                size={14.45}
                strokeWidth={2.5}
                onClick={() => {
                  navigator.clipboard.writeText(transcriptionText)
                  setTranscriptionText(transcriptionText)
                }}
              />
            </AnimatedCircularButton>
          </div>
          <div className="cursor-pointer bg-gray-100 rounded-full grid place-content-center text-gray-600">
            <AnimatedCircularButton
              ariaLabel="Clear"
              onClick={() => {
                setStage("initial")
                setCopiedMessage(false)
                setTranscriptionText("")
              }}
              secondaryChildren={<X size={17} strokeWidth={2.5} />}
            >
              <X
                size={17}
                strokeWidth={2.5}
                onClick={() => {
                  setStage("initial")
                  setCopiedMessage(false)
                  setTranscriptionText("")
                }}
              />
            </AnimatedCircularButton>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  )
}

export default App
