import {
  Check,
  Clock3,
  MessageSquare,
  PackageCheck,
  Wrench,
} from "lucide-react"

import CommonButton from "../../../components/common/widgets/CommonButton"
import CommonCard from "../../../components/common/CommonCard"

interface StatusRowProps {
  icon: typeof Check
  title: string
  description: string
  completed?: boolean
  active?: boolean
}

function StatusRow({
  icon: Icon,
  title,
  description,
  completed = false,
  active = false,
}: StatusRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`
          mt-0.5
          flex
          h-4
          w-4
          shrink-0
          items-center
          justify-center
          rounded-full
          ${
            completed
              ? "bg-[#2254b2] text-white"
              : active
                ? "bg-[#3472dd] text-white"
                : "bg-[#edf1f6] text-[#8b98aa] dark:bg-slate-700 dark:text-slate-400"
          }
        `}
      >
        <Icon size={9} strokeWidth={3} />
      </div>

      <div>
        <p className="text-2xs font-semibold text-[#214c96] dark:text-blue-200">
          {title}
        </p>

        <p className="mt-0.5 text-3xs text-[#7d8999] dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  )
}

export default function RepairStatusCard() {
  return (
    <div className="relative w-full">
      <div
        className="
          absolute
          right-0
          -top-4
          z-10
          rounded-full
          border
          border-[#dce7f7]
          bg-white
          px-3
          py-1
          text-2xs
          font-medium
          text-[#2452a0] dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300
          shadow-sm
          sm:-right-3
        "
      >
        ◉ Diagnostic logged
      </div>

      <CommonCard
        className="
          p-5
          shadow-[0_18px_45px_rgba(28,65,120,0.12)]
        "
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xs font-medium text-[#6e7d94] dark:text-slate-400">
              Third-Party T480
            </p>

            <p className="mt-1 text-xs font-semibold text-[#173e82] dark:text-blue-200">
              Request #SC-210
            </p>
          </div>

          <span className="text-2xs font-medium text-[#6c788a] dark:text-slate-400">
            Repairing
          </span>
        </div>

        <div className="mt-5 space-y-4">
          <StatusRow
            icon={Check}
            title="Received"
            description="Dispatched at the front desk"
            completed
          />

          <StatusRow
            icon={Check}
            title="Diagnosing"
            description="Issue and stage reviewed"
            completed
          />

          <StatusRow
            icon={Wrench}
            title="Repairing"
            description="Technician working on it"
            active
          />

          <StatusRow
            icon={Clock3}
            title="Completed"
            description="Awaiting final check"
          />

          <StatusRow
            icon={PackageCheck}
            title="Released"
            description="Ready for pickup"
          />
        </div>

        <div className="my-4 border-t border-[#e7edf5] dark:border-slate-700" />

        <div className="flex items-center justify-between">
          <span className="text-2xs text-[#7a8798] dark:text-slate-400">
            Estimated cost
          </span>

          <span className="text-sm font-bold text-[#153f89] dark:text-blue-200">
            ₱1,450
          </span>
        </div>

        <CommonButton
          variant="outline"
          className="mt-3 flex w-full items-center justify-center gap-2 py-2"
        >
          <MessageSquare size={13} />
          Open repair chat
        </CommonButton>
      </CommonCard>
    </div>
  )
}
