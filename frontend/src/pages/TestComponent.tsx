import { useEffect, useState } from "react"
import { Bell, Mail, User } from "lucide-react"

import Logo from "../components/common/widgets/Logo"
import Modal from "../components/common/modals/Modal"
import Spinner from "../components/common/widgets/Spinner"
import CommonButton from "../components/common/widgets/CommonButton"
import LoadingScreen from "../components/common/LoadingScreen"
import CommonBackground from "../components/common/background/CommonBackground"
import CommonInput from "../components/common/widgets/CommonInput"
import ScrollToTopButton from "../components/common/widgets/ScrollToTopButton"
import DarkModeButton from "../components/common/widgets/DarkModeButton"
import BackButton from "../components/common/widgets/BackButton"
import GoogleLogo from "../components/common/widgets/GoogleLogo"
import UserAvatar from "../components/common/widgets/UserAvatar"
import CommonDashboardHeader from "../components/common/layout/CommonDashboardHeader"
import CommonDashboardSidebar from "../components/common/layout/CommonDashboardSidebar"
import DataTable from "../components/common/widgets/DataTable"
import StatusBox from "../components/common/widgets/StatusBox"

function ShowcaseSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h2>
      <div className="flex min-h-44 flex-wrap items-center justify-center gap-8 rounded-xl bg-slate-50 p-6 transition-colors dark:bg-slate-950">
        {children}
      </div>
    </section>
  )
}

/**
 * Development-only visual reference for shared UI components.
 *
 *  http://localhost:5173/test-components
 *  remove after development
 **/
export default function TestComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [backgroundActive, setBackgroundActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    document.title = "Compair: test-components"
  })

  return (
    <CommonBackground
      variant={backgroundActive ? "purpleGradient" : "none"}
      className={`h-screen px-4 py-10 transition-colors duration-250 sm:px-6 `}>
      {isLoading && (
        <>
          <CommonButton
            className="z-999 fixed bottom-1/3 left-1/2 -translate-x-1/2"
            onClick={() => setIsLoading(false)}
          >
            Remove Loading
          </CommonButton>
          <LoadingScreen />
        </>
      )}

      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Component showcase
          </h1>

          <div className="flex items-center gap-3">
            <DarkModeButton />
          </div>
        </header>

        <div className="grid gap-6">
          <ShowcaseSection title="Logo">
            <Logo size={80} />
            <Logo size={110} />
            <Logo size={140} />


            <div className="rounded-lg bg-[#0b213d] p-4">
              <Logo variant="title" size={60} />
            </div>

          </ShowcaseSection>

          <ShowcaseSection title="Spinner">
            <Spinner size={24} />
            <Spinner size={40} />
            <Spinner size={56} />
          </ShowcaseSection>

          <ShowcaseSection title="CommonButton">
            <CommonButton variant="primary" className="min-w-[100px] max-w-[150px]">
              Primary
            </CommonButton>
            <CommonButton variant="secondary" className="min-w-[100px] max-w-[150px]">
              Secondary
            </CommonButton>
            <CommonButton variant="outline" className="min-w-[100px] max-w-[150px]">
              Outline
            </CommonButton>
            <CommonButton variant="gray" className="min-w-[100px] max-w-[150px]">
              Gray
            </CommonButton>
            <CommonButton variant="none" className="min-w-[100px] max-w-[150px]">
              None
            </CommonButton>
            <CommonButton variant="primary" disabled className="min-w-[100px] max-w-[150px]">
              Disabled
            </CommonButton>
            <CommonButton variant="icon" aria-label="Example icon button">
              <Bell size={16} />
            </CommonButton>
          </ShowcaseSection>

          <ShowcaseSection title="UserAvatar">
            <UserAvatar initials="MS" />
            <UserAvatar initials="JD" tone="sidebar" />
            <UserAvatar initials="AB" size={48} />
          </ShowcaseSection>

          <ShowcaseSection title="CommonInput">
            <div className="flex w-full max-w-100 flex-col gap-5">
              <CommonInput
                id="email"
                label="Email Address"
                type="email"
                icon={<Mail size={18} />}
                placeholder="admin@gmail.com"
              />
              <CommonInput
                id="name"
                label="Name"
                type="text"
                icon={<User size={18} />}
                placeholder="placeholder"
              />
              <CommonInput
                id="password"
                label="Password"
                variant="password"
                placeholder="Enter password"
              />
              <CommonInput
                variant="compact"
                id="compact"
                label="Name of Submitter (compact)"
                placeholder="Place holder"
              />
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="Modal">
            <CommonButton onClick={() => setIsModalOpen(true)}>
              Open Modal
            </CommonButton>
          </ShowcaseSection>

          <ShowcaseSection title="DataTable">
            <DataTable
              columns={
                [
                  {
                    key: "time",
                    label: "Time",
                    className: "w-[16%]",
                  },
                  {
                    key: "computer",
                    label: "Computer",
                    className: "w-[32%]",
                  },
                  {
                    key: "service",
                    label: "Service",
                    className: "w-[32%]",
                  },
                  {
                    key: "status",
                    label: "Status",
                    className: "w-[20%]",
                    render: () => (
                      <StatusBox status="Confirmed" />
                    ),
                  },
                ]
              }
              data={
                [
                  {
                    id: "APT-1001",
                    time: "11:00",
                    computer: 'MacBook Pro 14"',
                    service: "Initial diagnosis",
                    status: "Confirmed",
                  },
                ]
              }
            />
          </ShowcaseSection>

          <ShowcaseSection title="CommonBackground">
            <div className="flex h-[250px] w-[250px] flex-col gap-2">
              <CommonBackground variant="purpleGradient" className="border-2" />
              <CommonButton onClick={() => setBackgroundActive(!backgroundActive)}>
                toggle
              </CommonButton>
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="DarkModeButton">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  inline
                </span>
                <DarkModeButton variant="inline" />
              </div>

              <div className="relative flex h-24 w-40 items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                <span className="absolute left-2 top-1 text-2xs text-slate-400">
                  absolute
                </span>
                <DarkModeButton variant="absolute" />
              </div>
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="BackButton">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  inline
                </span>
                <BackButton variant="inline" />
              </div>

              <div className="relative flex h-24 w-40 items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                <span className="absolute left-2 top-1 text-2xs text-slate-400">
                  absolute
                </span>
                <BackButton variant="absolute" />
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                </span>
                <BackButton variant="inline" hideOnDesktop />
              </div>
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="GoogleLogo">
            <div className="flex items-center gap-6">
              <GoogleLogo size={16} />
              <GoogleLogo size={24} />
              <GoogleLogo size={32} />
              <CommonButton
                type="button"
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <GoogleLogo size={16} /> Sign in with Google
              </CommonButton>
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="CommonDashboardHeader">
            <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
              <CommonDashboardHeader
                breadcrumbs={["Compair", "My repairs"]}
                statusLabel="Live workspace"
                userInitials="MS"
                onMenuClick={() => {}}
              />
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="CommonDashboardSidebar">
            <div className="h-80 w-56 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
              <CommonDashboardSidebar
                sections={[
                  {
                    label: "Main",
                    items: [
                      { label: "Overview", href: "#", icon: User },
                      { label: "Notifications", href: "#alt", icon: Bell },
                    ],
                  },
                ]}
                activeHref="#"
                user={{ initials: "MS", name: "Mika Santos", role: "CUSTOMER" }}
                onLogout={() => {}}
              />
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="ScrollToTopButton">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rendered once at the bottom of this page, appears after scrolling
              halfway.
            </p>
          </ShowcaseSection>
        </div>

        <ScrollToTopButton />
      </div>

      <Modal
        className="bg-white dark:bg-slate-900"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Example modal
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Lorem ipsum.
        </p>
        <div className="mt-6 flex justify-end">
          <CommonButton
            variant="gray"
            type="button"
            onClick={() => setIsModalOpen(false)}
          >
            Close
          </CommonButton>
        </div>
      </Modal>
    </CommonBackground>
  )
}
