import { useState } from "react";
import DropZone from "./DropZone";
import { AudioLines, LoaderCircle, X } from "lucide-react";

function App() {
  const [stage, setStage] = useState("initial");
  const [transcriptionText, setTranscriptionText] = useState("");
  const [copiedMessage, setCopiedMessage] = useState(false);

  function handleClick() {
    // open a file dialog here and select one file
    const input = document.createElement("input"); // create an input element
    input.type = "file"; // set the input type to file
    input.accept = "audio/*"; // specify accepted file types to audio
    input.onchange = (event: any) => {
      // attach an event listener
      const file = event.target.files?.[0]; // get the selected file
      if (file) {
        // check if a file was selected
        handleFile(file); // call handleFile with the selected file
      }
    };
    if (transcriptionText !== "") {
      return;
    } else {
      input.click(); // trigger the file dialog
    }
  }

  async function handleFile(file: any) {
    console.log(file);
    setStage("processing");
    setCopiedMessage(false);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fireworksModelValue", "whisper-v3");
    formData.append("currentModelProvider", "fireworks");

    const response = await fetch(
      "https://whisperapi.bartoszbak.org/api/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    if (response.status === 429) {
      console.log("rate limited");
      return;
    }

    const data = await response.json();
    console.log(data.transcription);
    navigator.clipboard.writeText(data.transcription);
    setTranscriptionText(data.transcription);
    setStage("done");
    setCopiedMessage(true);
  }

  return (
    <div className="grid place-content-center h-dvh w-screen motion-preset-focus-sm">
      <DropZone onClick={handleClick} onDropped={handleFile}>
        {(() => {
          // Start of IIFE
          if (stage === "initial") {
            return (
              // Return the JSX for this case
              <div className="ml-12 mr-12 mt-4 mb-4 flex flex-col items-center gap-1 animate-blur-in-custom">
                <div className="w-13 h-13 border border-gray-100 rounded-full grid place-content-center mb-5">
                  <AudioLines size={18} />
                </div>
                <p className="font-geist text-sm font-medium">
                  Drop an audio file here
                </p>
                <p className="opacity-60 text-sm">Max size 100MB</p>
              </div>
            );
          } else if (stage === "processing") {
            return (
              // Return the JSX for this case
              <div className="p-4 flex flex-col items-center text-blue-600 motion-preset-focus">
                <LoaderCircle
                  size={18}
                  className="mb-2 animate-spin opacity-75"
                />
                <p className="text-sm font-geist-mono">Processing</p>
              </div>
            );
          } else if (stage === "done") {
            return (
              // Return the JSX for this case
              <div className="flex flex-col items-center">
                <p className="font-geist text-[15px] max-w-md h-fit">
                  {transcriptionText}
                </p>
              </div>
            );
          } else {
            return null; // Default case
          }
        })()}
      </DropZone>

      {copiedMessage ? (
        <p className="font-jetbrains-mono text-sm font-medium w-full text-center mt-4 text-blue-600/75 animate-copied-message-up inline-flex gap-3 justify-center">
          COPIED{" "}
          <X
            size={18}
            className="mt-[1px] cursor-pointer"
            onClick={() => {
              setStage("initial");
              setCopiedMessage(false);
              setTranscriptionText("");
            }}
          />
        </p>
      ) : (
        <></>
      )}
    </div>
  );
}

export default App;
