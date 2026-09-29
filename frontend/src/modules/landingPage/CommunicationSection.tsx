import {
  Check,
  MessageSquare,
  Users,
} from "lucide-react"

import CommonCard from "../../components/common/CommonCard"
import SectionContainer from "./SectionContainer"
import CommunicationCard from "./components/CommunicationCard"

export default function CommunicationSection() {
  return (
    <section className="bg-[#eef6ff] py-14 transition-colors duration-300 dark:bg-slate-900 md:h-screen md:py-0">
      <SectionContainer className="flex items-center md:h-full">
        <div className="grid w-full items-center gap-8 md:gap-12 md:grid-cols-[1fr_0.95fr]">
          {/* Left */}
          <div>
            <h2
              className="
                max-w-[450px]
                text-2xl
                font-bold
                leading-tight
                tracking-tight
                text-[#123d85] dark:text-blue-200
              "
            >
              Built around one problem: not knowing
              where your device is in the process.
            </h2>

            <p
              className="
                mt-4
                max-w-[530px]
                text-2xs
                leading-5
                text-[#718198] dark:text-slate-300
              "
            >
              Most repair shops still use phone calls and
              guesswork. Compair gives customers a single place to
              check in, get status updates, and see what&apos;s
              happening without searching every little detail
              between the counter and the workbench.
            </p>

            <div className="mt-5 space-y-2 text-3xs text-[#5e7190] dark:text-slate-300">
              <p className="flex items-center gap-2">
                <Check
                  size={11}
                  className="text-[#285db3]"
                />

                See exactly how your device gets from request to
                pickup
              </p>

              <p className="flex items-center gap-2">
                <Check
                  size={11}
                  className="text-[#285db3]"
                />

                Appointment slots you can change without calling
              </p>

              <p className="flex items-center gap-2">
                <Check
                  size={11}
                  className="text-[#285db3]"
                />

                Direct messages with the shop if you have a
                question mid-repair
              </p>
            </div>
          </div>

          {/* Right */}
          <CommonCard className="p-7">
            <div className="space-y-7">
              <CommunicationCard
                icon={MessageSquare}
                title="Messages, kept with the request"
                description="Ask about a part swap or a diagnostic update. Everything stays with your account — no misplaced calls, no lost texts."
              />

              <CommunicationCard
                icon={Users}
                title="Technicians see the same queue"
                description="Repair requests are assigned and tracked on the same place too, so staff always know which step is next."
              />
            </div>
          </CommonCard>
        </div>
      </SectionContainer>
    </section>
  )
}
