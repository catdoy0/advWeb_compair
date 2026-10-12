import { useNavigate } from "react-router";
import { ArrowRight, MessageCircle } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import DashboardPanel from "../components/DashboardPanel";
import type { CustomerOverviewLastMessage } from "../../../types/repair_requests";

dayjs.extend(relativeTime);

export default function MessageShop({
  lastMessage,
  loading,
}: {
  lastMessage: CustomerOverviewLastMessage | null;
  loading: boolean;
}) {
  const navigate = useNavigate();

  return (
    <DashboardPanel
      title="Messages"
      description="Direct line to the Compair team."
      headerAction={
        <button
          type="button"
          onClick={() => navigate("/dashboard/messages")}
          className="flex items-center gap-1 text-[10px] font-semibold text-[#2870e8] hover:underline"
        >
          Open
          <ArrowRight size={11} />
        </button>
      }
    >
      <div className="p-5">
        {loading ? (
          <p className="py-6 text-center text-[11px] text-slate-400">
            Loading...
          </p>
        ) : lastMessage ? (
          <>
            <p className="text-[10px] font-semibold text-slate-400">
              {lastMessage.sender_name}
            </p>
            <p className="mt-1 line-clamp-3 text-[12px] leading-5 text-[#102c50] dark:text-white">
              {lastMessage.content}
            </p>
            <p className="mt-3 text-[9px] text-slate-400">
              {dayjs(lastMessage.created_at).fromNow()}
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4ff] text-[#2870e8]">
              <MessageCircle size={16} />
            </div>
            <p className="mt-3 text-[12px] font-semibold text-[#102c50] dark:text-white">
              No messages yet
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Start a conversation with the shop.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/dashboard/messages")}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-[#d4ddea] px-4 py-2 text-[11px] font-semibold text-[#2870e8] transition-colors hover:bg-[#f8fafc] dark:border-slate-700 dark:hover:bg-[#162334]"
        >
          <MessageCircle size={13} />
          Message the shop
        </button>
      </div>
    </DashboardPanel>
  );
}
