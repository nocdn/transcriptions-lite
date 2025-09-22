import { useState } from "react"
import DropZone from "./DropZone"
import { Copy, X } from "lucide-react"
import AudioIcon from "./components/icons/audio"
import Spinner from "./components/Spinner"

// take the api url from the .env.local
const API_URL = import.meta.env.VITE_BACKEND_URL

function App() {
  const [stage, setStage] = useState("initial")
  const [transcriptionText, setTranscriptionText] = useState("")
  const [copiedMessage, setCopiedMessage] = useState(false)

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
      <DropZone onClick={handleClick} onDropped={handleFile}>
        {(() => {
          if (stage === "initial") {
            return (
              <div className="ml-12 mr-12 mt-4 mb-4 flex flex-col items-center gap-1 motion-opacity-in-0">
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
              <div className="p-4 flex flex-col items-center text-blue-600 motion-preset-focus-sm">
                <Spinner size={18} className="mb-3" />
                <p className="text-sm font-geist-mono">transcribing</p>
              </div>
            )
          } else if (stage === "done") {
            return (
              <div className="flex flex-col items-center">
                <p className="font-geist text-[15px] max-w-md h-fit">
                  {transcriptionText}
                </p>
              </div>
            )
          } else {
            return null
          }
        })()}
      </DropZone>

      {copiedMessage ? (
        <div className="animate-copied-message-up flex gap-3 justify-center items-center mt-4">
          <div className="cursor-pointer bg-gray-100 rounded-full p-2.5 grid place-content-center text-gray-600">
            <Copy
              size={14.45}
              strokeWidth={2.5}
              onClick={() => {
                navigator.clipboard.writeText(transcriptionText)
                setTranscriptionText(transcriptionText)
              }}
            />
          </div>
          <div className="cursor-pointer bg-gray-100 rounded-full p-2 grid place-content-center text-gray-600">
            <X
              size={17}
              strokeWidth={2.5}
              onClick={() => {
                setStage("initial")
                setCopiedMessage(false)
                setTranscriptionText("")
              }}
            />
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  )
}

export default App
