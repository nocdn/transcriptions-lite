import { useEffect, useRef, useState } from "react"
import DropZone from "./DropZone"
import { Check, Copy, Gauge, X } from "lucide-react"
import AudioIcon from "./components/icons/audio"
import Spinner from "./components/Spinner"
import { AnimatedCircularButton } from "./components/AnimatedButton"
import { Squircle } from "@squircle-js/react"

const API_URL = import.meta.env.VITE_BACKEND_URL

function App() {
  const [stage, setStage] = useState("initial")
  const [transcriptionText, setTranscriptionText] = useState("")
  const [copiedMessage, setCopiedMessage] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [sizeExceeded, setSizeExceeded] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordedChunksRef = useRef<BlobPart[]>([])

  function getSupportedMime(): { mimeType: string; ext: string } {
    const candidates = [
      { mimeType: "audio/mp4", ext: "m4a" },
      { mimeType: "audio/mpeg", ext: "mp3" },
      { mimeType: "audio/ogg;codecs=opus", ext: "ogg" },
      { mimeType: "audio/ogg", ext: "ogg" },
      { mimeType: "audio/webm;codecs=opus", ext: "webm" },
      { mimeType: "audio/webm", ext: "webm" },
    ]
    for (const c of candidates) {
      const mr =
        typeof window !== "undefined"
          ? (window as any).MediaRecorder
          : undefined
      if (typeof mr !== "undefined" && mr?.isTypeSupported?.(c.mimeType)) {
        return c
      }
    }
    return { mimeType: "audio/webm", ext: "webm" }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      recordedChunksRef.current = []
      const { mimeType } = getSupportedMime()
      const mr = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mr

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data)
      }

      mr.onstop = async () => {
        const recordedType = mr.mimeType || getSupportedMime().mimeType
        const blob = new Blob(recordedChunksRef.current, { type: recordedType })

        let file: File
        if (/webm|ogg/i.test(recordedType)) {
          try {
            file = await convertRecordedBlobToWav(blob)
          } catch (e) {
            console.error("convert to wav failed", e)
            const extFallback = recordedType.includes("ogg") ? "ogg" : "webm"
            file = new File([blob], `recording-${Date.now()}.${extFallback}`, {
              type: recordedType,
            })
          }
        } else {
          const ext = recordedType.includes("mpeg")
            ? "mp3"
            : recordedType.includes("mp4")
            ? "m4a"
            : "wav"
          file = new File([blob], `recording-${Date.now()}.${ext}`, {
            type: recordedType,
          })
        }

        cleanupStream()
        handleFile(file)
      }

      mr.start()
      setIsRecording(true)
    } catch (err) {
      console.error("mic permission or recorder error", err)
      setIsRecording(false)
    }
  }

  function stopRecording() {
    try {
      const mr = mediaRecorderRef.current
      if (mr && mr.state !== "inactive") {
        mr.stop()
      }
    } finally {
      setIsRecording(false)
    }
  }

  function cleanupStream() {
    try {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {}
    mediaStreamRef.current = null
    mediaRecorderRef.current = null
    recordedChunksRef.current = []
  }

  async function convertRecordedBlobToWav(inputBlob: Blob): Promise<File> {
    const arrayBuffer = await inputBlob.arrayBuffer()
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))

    const numChannels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const length = audioBuffer.length * numChannels * 2 + 44
    const buffer = new ArrayBuffer(length)
    const view = new DataView(buffer)

    function writeString(view: DataView, offset: number, str: string) {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i))
      }
    }

    let offset = 0
    writeString(view, offset, "RIFF")
    offset += 4
    view.setUint32(offset, 36 + audioBuffer.length * numChannels * 2, true)
    offset += 4
    writeString(view, offset, "WAVE")
    offset += 4
    writeString(view, offset, "fmt ")
    offset += 4
    view.setUint32(offset, 16, true)
    offset += 4
    view.setUint16(offset, 1, true)
    offset += 2
    view.setUint16(offset, numChannels, true)
    offset += 2
    view.setUint32(offset, sampleRate, true)
    offset += 4
    view.setUint32(offset, sampleRate * numChannels * 2, true)
    offset += 4
    view.setUint16(offset, numChannels * 2, true)
    offset += 2
    view.setUint16(offset, 16, true)
    offset += 2
    writeString(view, offset, "data")
    offset += 4
    view.setUint32(offset, audioBuffer.length * numChannels * 2, true)
    offset += 4

    const channels = [] as Float32Array[]
    for (let i = 0; i < numChannels; i++) {
      channels.push(audioBuffer.getChannelData(i))
    }

    let sampleIndex = 0
    while (sampleIndex < audioBuffer.length) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][sampleIndex]))
        view.setInt16(
          offset,
          sample < 0 ? sample * 0x8000 : sample * 0x7fff,
          true
        )
        offset += 2
      }
      sampleIndex++
    }

    const wavBlob = new Blob([view], { type: "audio/wav" })
    const wavFile = new File([wavBlob], `recording-${Date.now()}.wav`, {
      type: "audio/wav",
    })
    try {
      audioContext.close()
    } catch {}
    return wavFile
  }

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
    if (file.size > 100 * 1024 * 1024) {
      setSizeExceeded(true)
      return
    }
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

    if (!response.ok) {
      let text = ""
      try {
        text = await response.text()
      } catch {}
      console.error("upload failed", text)
      setStage("initial")
      return
    }

    const data = await response.json()
    if (!data?.transcription) {
      console.error("no transcription in response", data)
      setStage("initial")
      return
    }
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
          if (isRateLimited || sizeExceeded) {
            return (
              <div
                className="p-8 flex flex-col items-center text-red-600 motion-preset-focus-sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSizeExceeded(false)
                }}
              >
                <Gauge size={18} className="mb-3" />
                <p className="text-sm font-jetbrains-mono">
                  {sizeExceeded ? "File too large" : "rate limited"}
                </p>
                <p className="text-[13px] opacity-60 font-jetbrains-mono mt-1">
                  {sizeExceeded ? "Max 100MB" : "try again tomorrow"}
                </p>
              </div>
            )
          } else {
            if (stage === "initial") {
              return (
                <div className="ml-12 mr-12 mt-4 mb-4 flex flex-col items-center gap-1 motion-opacity-in-0 py-4">
                  <AnimatedCircularButton
                    className="w-13 h-13 border border-gray-100 rounded-full grid place-content-center mb-5"
                    isActive={isRecording}
                    onClick={(e) => {
                      ;(e as any)?.preventDefault?.()
                      ;(e as any)?.stopPropagation?.()
                      if (!isRecording) {
                        startRecording()
                      } else {
                        stopRecording()
                      }
                    }}
                    secondaryChildren={
                      <Squircle
                        cornerRadius={2.5}
                        cornerSmoothing={1}
                        className="size-3 bg-red-500/80"
                      />
                    }
                    ariaLabel="Record audio"
                  >
                    <AudioIcon size={18} />
                  </AnimatedCircularButton>
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
          <div className="cursor-pointer bg-gray-100/70 rounded-full grid place-content-center text-gray-600">
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
          <div className="cursor-pointer bg-gray-100/70 rounded-full grid place-content-center text-gray-600">
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
