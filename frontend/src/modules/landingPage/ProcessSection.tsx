import SectionContainer from "./SectionContainer"
import ProcessStep from "./components/ProcessStep"

const steps = [
  {
    number: "1",
    title: "Create your account",
    description:
      "Sign up with your email to create a convenient — and secure — repair account.",
  },
  {
    number: "2",
    title: "Register your device",
    description:
      "Add the device type, brand, serial, and details before you submit your service request.",
  },
  {
    number: "3",
    title: "Book a drop-off slot",
    description:
      "Choose an available date and time, and finalize your preferred drop-off appointment.",
  },
  {
    number: "4",
    title: "Track it to pickup",
    description:
      "Watch the latest updates along the way, and receive a final notification when it's ready for pickup.",
  },
]

export default function ProcessSection() {
  return (
    <section className="bg-white py-14 transition-colors duration-300 dark:bg-slate-950 md:h-screen md:py-0">
      <SectionContainer className="flex flex-col justify-center md:h-full">
        <div className="mx-auto max-w-[580px] text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[#123d85] dark:text-blue-200">
            From drop-off to pickup, in four
            <br />
            steps
          </h2>

          <p className="mt-3 text-2xs text-[#78869a] dark:text-slate-400">
            Everything happens inside the same account you create
            today.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-4">
          {steps.map((step) => (
            <ProcessStep
              key={step.number}
              {...step}
            />
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
