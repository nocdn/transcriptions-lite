import { motion } from "motion/react";
import { useState } from "react";

interface DropZoneProps {
  children: React.ReactNode;
  onClick: () => void;
  onDropped: (file: File) => void;
}

export default function DropZone({
  children,
  onClick,
  onDropped,
  ...props
}: DropZoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  return (
    <motion.div
      className="font-jetbrains-mono cursor-pointer px-3 py-1 bg-white"
      // --- Core animation properties ---
      layout // THIS IS THE KEY! Enables automatic size/position animation
      transition={{
        // Optional: customize the animation (spring is nice for this)
        type: "spring",
        stiffness: 500,
        damping: 30,
        // Or a simple ease: duration: 0.2, ease: "easeInOut"
      }}
      // --- Basic button styling ---
      style={{
        display: "inline-flex", // Crucial: makes the div wrap its content tightly
        justifyContent: "center",
        padding: "1rem", // Adjust padding as needed
        backgroundColor: "white",
        color: "black",
        border: "none",
        borderRadius: "14px",
        cursor: "pointer",
        overflow: "scroll", // Helps contain content during animation
        outline: isDraggingOver ? `1px dashed blue` : `1px dashed lightgray`,
        maxHeight: "40rem",
      }}
      // --- Optional: Add interaction feedback ---
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      // --- Event handling ---
      onClick={() => {
        onClick();
      }}
      onDragOver={(event) => {
        // Add this handler
        event.preventDefault(); // Prevent default behavior to allow dropping
        setIsDraggingOver(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDraggingOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault(); // Prevent default file opening behavior
        const droppedFile = event.dataTransfer.files[0];
        setIsDraggingOver(false);
        onDropped(droppedFile);
      }}
      {...props}
    >
      <div>{children}</div>
    </motion.div>
  );
}
