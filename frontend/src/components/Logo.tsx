interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

const sizeMap = {
  sm:  { icon: 28,  text: 'text-lg',  gap: 'gap-1.5' },
  md:  { icon: 40,  text: 'text-2xl', gap: 'gap-2' },
  lg:  { icon: 56,  text: 'text-4xl', gap: 'gap-3' },
  xl:  { icon: 80,  text: 'text-5xl', gap: 'gap-4' },
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const { icon, text, gap } = sizeMap[size]

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {/* Brain + Lightning SVG — Duolingo green bg */}
      <svg width={icon} height={icon} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="24" fill="#58CC02"/>
        {/* Brain left hemisphere */}
        <path d="M30 56 C21 56 18 48 19 41 C20 35 26 32 30 33 C30 26 35 23 40 24 C41 20 47 18 50 22"
          stroke="white" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
        {/* Brain right hemisphere */}
        <path d="M70 56 C79 56 82 48 81 41 C80 35 74 32 70 33 C70 26 65 23 60 24 C59 20 53 18 50 22"
          stroke="white" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
        {/* Brain bottom */}
        <path d="M30 56 C30 63 35 68 40 68 C43 71 46 72 50 72 C54 72 57 71 60 68 C65 68 70 63 70 56"
          stroke="white" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
        {/* Center divide */}
        <path d="M50 22 C48 31 48 42 50 50 C52 58 52 63 50 72"
          stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5"/>
        {/* Lightning bolt — gold */}
        <polygon points="54,28 44,52 52,52 46,72 62,46 53,46 63,28" fill="#FFC800"/>
      </svg>

      {showText && (
        <span className={`${text} font-black tracking-tight`}>
          <span className="text-brand-600">Neuro</span>
          <span className="text-gray-800">Bright</span>
        </span>
      )}
    </div>
  )
}
