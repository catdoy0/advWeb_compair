import { useState } from "react";
import {
  ArrowDownToLine,
  ChevronRight,
  MessageCircle,
  Search,
} from "lucide-react";

import CommonButton from "../../../components/common/widgets/CommonButton";

interface Conversation {
  id: string;
  customerName: string;
  initials: string;
  device: string;
  preview: string;
  time: string;
  unread?: number;
}

const conversations: Conversation[] = [
  {
    id: "CP-1042",
    customerName: "Mika Santos",
    initials: "CT",
    device: 'MacBook Pro 14"',
    preview: "Hello, Mika our technician is finishing the diagnosis...",
    time: "10:42 AM",
  },
];

export default function Messages() {
  const [search, setSearch] = useState("");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  const filteredConversations = conversations.filter((conversation) => {
    const searchValue = search.toLowerCase();

    return (
      conversation.id.toLowerCase().includes(searchValue) ||
      conversation.customerName.toLowerCase().includes(searchValue) ||
      conversation.device.toLowerCase().includes(searchValue)
    );
  });

  return (
    <main className="flex-1 bg-[#f7f9fc] dark:bg-[#0f1724]">
      <div className="mx-auto max-w-[1240px] p-5 lg:p-7">
        {/* Header */}
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2870e8]">
              Customer care / inbox
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#102c50] dark:text-white">
              Service messages
            </h1>

            <p className="mt-1 max-w-[600px] text-[12px] leading-5 text-slate-500 dark:text-slate-400">
              Keep repair conversations attached to the request so customers
              always know what happens next.
            </p>
          </div>

          <CommonButton
            variant="outline"
            className="flex items-center gap-2 self-start border-[#d4ddea] px-4 py-2 xl:self-auto"
          >
            <ArrowDownToLine size={14} />
            Export inbox
          </CommonButton>
        </div>

        {/* Messages workspace */}
        <div className="mt-6 grid h-[590px] gap-4 lg:grid-cols-[373px_minmax(0,1fr)]">
          {/* Inbox */}
          <section className="overflow-hidden rounded-lg border border-[#d8e0eb] bg-white dark:border-slate-700 dark:bg-[#111c2b]">
            {/* Inbox header */}
            <div className="border-b border-[#d8e0eb] px-4 py-3 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-bold text-[#102c50] dark:text-white">
                    Inbox
                  </h2>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    0 unread messages
                  </p>
                </div>

                <span className="rounded bg-[#eef4ff] px-2 py-0.5 text-[10px] font-semibold text-[#2870e8]">
                  0
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="border-b border-[#d8e0eb] p-3 dark:border-slate-700">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Find my repair"
                  className="h-9 w-full rounded-md border border-[#d8e0eb] bg-[#f8fafc] pl-9 pr-3 text-[11px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div>
              {filteredConversations.map((conversation) => {
                const isSelected =
                  selectedConversation?.id === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversation(conversation)}
                    className={`flex w-full gap-3 border-b border-[#edf0f5] px-4 py-4 text-left transition-colors dark:border-slate-700 ${
                      isSelected
                        ? "bg-[#f1f6ff] dark:bg-[#172a42]"
                        : "hover:bg-[#f8fafc] dark:hover:bg-[#162334]"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dceaff] text-[9px] font-bold text-[#2870e8]">
                      {conversation.initials}
                    </div>

                    {/* Conversation info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-bold text-[#102c50] dark:text-white">
                          {conversation.id}
                        </p>

                        <span className="shrink-0 text-[9px] text-slate-400">
                          {conversation.time}
                        </span>
                      </div>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {conversation.device}
                      </p>

                      <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400">
                        {conversation.preview}
                      </p>
                    </div>

                    <ChevronRight
                      size={14}
                      className="mt-2 shrink-0 text-slate-400"
                    />
                  </button>
                );
              })}

              {filteredConversations.length === 0 && (
                <div className="px-4 py-8 text-center text-[11px] text-slate-400">
                  No repairs found.
                </div>
              )}
            </div>
          </section>

          {/* Conversation */}
          <section className="flex min-w-0 items-center justify-center rounded-lg border border-[#d8e0eb] bg-white dark:border-slate-700 dark:bg-[#111c2b]">
            {selectedConversation ? (
              <div className="flex h-full w-full flex-col">
                {/* Conversation header */}
                <div className="flex items-center gap-3 border-b border-[#d8e0eb] px-5 py-4 dark:border-slate-700">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dceaff] text-[10px] font-bold text-[#2870e8]">
                    {selectedConversation.initials}
                  </div>

                  <div>
                    <p className="text-[13px] font-bold text-[#102c50] dark:text-white">
                      {selectedConversation.id}
                    </p>

                    <p className="text-[10px] text-slate-400">
                      {selectedConversation.device}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-5">
                  <div className="max-w-[500px] rounded-lg bg-[#f1f5f9] px-4 py-3 text-[11px] text-slate-600 dark:bg-[#182536] dark:text-slate-300">
                    {selectedConversation.preview}
                  </div>
                </div>

                {/* Reply */}
                <div className="border-t border-[#d8e0eb] p-4 dark:border-slate-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a message..."
                      className="h-10 flex-1 rounded-md border border-[#d8e0eb] px-3 text-[11px] outline-none focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
                    />

                    <CommonButton>Send</CommonButton>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8e0eb] bg-[#f8fafc] text-[#2870e8] dark:border-slate-600 dark:bg-[#182536]">
                  <MessageCircle size={16} />
                </div>

                <h2 className="mt-4 text-[16px] font-bold text-[#102c50] dark:text-white">
                  Select a conversation
                </h2>

                <p className="mt-1 max-w-[240px] text-[11px] leading-5 text-slate-400">
                  Choose a person from the inbox to view messages and reply.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
