import {
  ArrowRight,
  Check,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react"

import CommonButton from "../../components/common/widgets/CommonButton"
import SectionContainer from "./SectionContainer"
import RepairStatusCard from "./components/RepairStatusCard"
import { useNavigate } from "react-router"
import { ROUTES } from "../../routes"

export default function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="bg-[#eef6ff] pb-12 pt-24 transition-colors duration-300 dark:bg-[#0a1428] md:min-h-svh md:pb-0 md:pt-25 xl:pt-14">
      <SectionContainer className="flex items-center md:min-h-[calc(100svh-3.5rem)] modal-open">
        <div className="grid w-full items-center gap-8 md:gap-12 md:grid-cols-[1fr_1fr]">
          {/* Left */}
          <div>
            <div
              className="
                mb-5
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-[#d7e4f6]
                bg-white
                px-3
                py-1
                text-3xs
                font-medium
                text-[#3964a7] dark:border-blue-900 dark:bg-slate-800 dark:text-blue-300
              "
            >
              <Check size={9} strokeWidth={3} />

              From booking every step, live
            </div>

            <h1
              className="
                max-w-[580px]
                text-4xl
                font-bold
                leading-[1.05]
                tracking-[-0.035em]
                text-[#123d85] dark:text-blue-200
                sm:text-5xl
              "
            >
              Reliable computer
              <br />

              repair, with every step
              <br />

              <span className="font-serif font-normal italic text-[#2a579d] dark:text-blue-300">
                in view.
              </span>
            </h1>

            <p
              className="
                mt-5
                max-w-[490px]
                text-sm
                leading-6
                text-[#667991] dark:text-slate-300
              "
            >
              Compair keeps your device&apos;s repair — from
              drop-off to diagnosis to pickup — visible in one
              account, with technicians logging every update as it
              happens.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <CommonButton
                variant="primary"
                className="flex items-center gap-2"
                onClick={() => navigate(`${ROUTES.AUTHPAGE}?type=signup`)}
              >
                Create a free account
                <ArrowRight size={12} />
              </CommonButton>

              <CommonButton variant="outline" onClick={() => navigate(ROUTES.AUTHPAGE)}>
                Sign in
              </CommonButton>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-3xs text-[#6f8097] dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={11} />
                Live status, no phone calls needed
              </span>

              <span className="flex items-center gap-1.5">
                <Check size={11} />
                Cost approval before work starts
              </span>

              <span className="flex items-center gap-1.5">
                <ShieldCheck size={11} />
                A full history for every device
              </span>
            </div>
          </div>

          {/* Right */}
            <RepairStatusCard />
        </div>
      </SectionContainer>
    </section>
  )
}
