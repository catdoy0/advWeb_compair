interface ProcessStepProps {
  number: string
  title: string
  description: string
}

export default function ProcessStep({
  number,
  title,
  description,
}: ProcessStepProps) {
  return (
    <div>
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#194ba3] text-3xs font-bold text-white">
        {number}
      </div>

      <h3 className="mt-4 text-2xs font-bold text-[#19458e] dark:text-blue-200">
        {title}
      </h3>

      <p className="mt-2 text-3xs leading-4 text-[#7b899c] dark:text-slate-400">
        {description}
      </p>
    </div>
  )
}
