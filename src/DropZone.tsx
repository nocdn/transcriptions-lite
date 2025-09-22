import { motion } from "motion/react"
import { useState } from "react"

interface DropZoneProps {
  children: React.ReactNode
  onClick: () => void
  onDropped: (file: File) => void
}

export default function DropZone({
  children,
  onClick,
  onDropped,
  ...props
}: DropZoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  return (
    <motion.div
      className="font-jetbrains-mono cursor-pointer px-3 py-1 bg-white"
      layout
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
      style={{
        display: "inline-flex",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "white",
        color: "black",
        border: "none",
        borderRadius: "14px",
        cursor: "pointer",
        overflow: "scroll",
        outline: isDraggingOver ? `1px dashed blue` : `1px dashed lightgray`,
        maxHeight: "40rem",
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        onClick()
      }}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDraggingOver(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        setIsDraggingOver(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        const droppedFile = event.dataTransfer.files[0]
        setIsDraggingOver(false)
        onDropped(droppedFile)
      }}
      {...props}
    >
      <div>{children}</div>
    </motion.div>
  )
}
