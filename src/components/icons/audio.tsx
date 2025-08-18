export default function AudioIcon({
  size = 24,
  strokeWidth = 2,
  className,
}: {
  size?: number
  strokeWidth?: number
  className?: string
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="M12 8v8" />
      <path d="M8 17v2" />
      <path d="M4 11v2" />
      <path d="M20 11v2" />
      <path d="M8 5v8" />
      <path d="M16 7v-2" />
      <path d="M16 19v-8" />
    </svg>
  )
}
