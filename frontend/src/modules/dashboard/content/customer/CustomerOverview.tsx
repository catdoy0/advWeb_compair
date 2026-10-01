import {
  CalendarDays,
  Laptop,
  MessageCircle,
  Wrench,
} from "lucide-react";

import CommonButton from "../../../../components/common/widgets/CommonButton";
import StatCard from "../../components/StatCard";
import RepairRequests from "../../components/RepairRequests";
import MessageShop from "../../components/MessageShop";
import PageHeader from "../../components/PageHeader";

export default function CustomerOverview() {
  return (
    <main className="flex-1 bg-[#f7f9fc] dark:bg-[#0f1724]">
      <div className="mx-auto max-w-[1180px] p-5 lg:p-7">
        {/* Header */}

        <PageHeader
          eyebrow="Computer repair customer portal"
          title="Your computer repair overview"
          description="Keep your computer requests, appointments, and shop conversations together."
          action={
            <CommonButton
              className="flex items-center gap-2 px-4 py-2"
            >
              <MessageCircle size={14} />
              Message the shop
            </CommonButton>
          }
        />

        {/* Statistics */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active request"
            value="CP-1042"
            icon={Wrench}
            variant="blue"
            detail="Diagnosing"
            detailMuted='MacBook Pro 14"'
          />

          <StatCard
            label="Next appointment"
            value="09/14/2026 - 11:00 AM"
            icon={CalendarDays}
            variant="orange"
            detail="Confirmed"
            detailMuted='MacBook Pro 14"'
          />

          <StatCard
            label="Unread messages"
            value="1"
            icon={MessageCircle}
            variant="cyan"
          />

          <StatCard
            label="Computer records"
            value="1"
            icon={Laptop}
            variant="blue"
          />
        </div>

        {/* Lower content */}
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <RepairRequests />

          <MessageShop />
        </div>
      </div>
    </main>
  );
}
