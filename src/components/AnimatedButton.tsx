import { useState } from "react"
import type React from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

export function AnimatedCircularButton({
  children,
  secondaryChildren,
  className,
  onClick,
  isActive,
  ariaLabel,
}: {
  children: React.ReactNode
  secondaryChildren?: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  isActive?: boolean
  ariaLabel: string
}) {
  const [isShowingSecondary, setIsShowingSecondary] = useState(false)

  return (
    <motion.button
      type="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className={cn(
        "group flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full",
        className
      )}
      onClick={(event) => {
        if (typeof isActive === "boolean") {
          onClick?.(event)
          return
        }
        setIsShowingSecondary(!isShowingSecondary)
        onClick?.(event)
        setTimeout(() => {
          setIsShowingSecondary(false)
        }, 1000)
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {(typeof isActive === "boolean" ? isActive : isShowingSecondary) ? (
          <motion.div
            key="secondary"
            initial={{ opacity: 0, scale: 0.2, filter: "blur(2px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.2, filter: "blur(2px)" }}
          >
            {secondaryChildren}
          </motion.div>
        ) : (
          <motion.div
            key="primary"
            initial={{ opacity: 0, scale: 0.2, filter: "blur(2px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.2, filter: "blur(2px)" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
