import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, MessageCircle, Search } from "lucide-react";

import CommonButton from "../../../components/common/widgets/CommonButton";
import PageHeader from "../components/PageHeader";
import UserAvatar from "../../../components/common/widgets/UserAvatar";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";

import { useAuth } from "../../../context/AuthContext";
import { dummySession } from "../../../dummyData";
import {
  listConversations,
  listMessages,
  sendMessage,
} from "../../../api/conversations";
import { useMessageEvents } from "../../../hooks/useMessageEvents";
import type { Conversation, Message } from "../../../types/messages";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
dayjs.extend(calendar);

// ---------- display helpers ----------

function initialsOf(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function conversationTitle(conv: Conversation, isCustomer: boolean): string {
  if (!isCustomer) {
    return conv.customer_name || conv.customer_email || "Customer";
  }
  if (conv.repair_request_id === null) return "Compair Team";
  return conv.repair_number || "Repair";
}

function conversationSubtitle(conv: Conversation, isCustomer: boolean): string {
  if (!isCustomer) {
    if (conv.repair_number) {
      return conv.device_label
        ? `${conv.repair_number} · ${conv.device_label}`
        : conv.repair_number;
    }
    return "";
  }
  if (conv.repair_request_id === null) return "General support";
  return conv.device_label || "Repair chat";
}


function messageSenderLabel(
  msg: Message,
  viewerRole: string,
  viewerId: number,
): string {
  if (viewerRole === "CUSTOMER") {
    return msg.sender_role === "CUSTOMER" ? "You" : "Compair Team";
  }
  if (msg.sender_id === viewerId) return "You";
  return msg.sender_name || "Unknown";
}


export default function Messages() {
  const { session } = useAuth();
  const currentUser = (session ?? dummySession).user;
  const isCustomer = currentUser.role === "CUSTOMER";
  const viewerId = Number( currentUser.id ?? 0 );

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(true);

  function isNearBottom(el: HTMLDivElement, threshold = 80): boolean {
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    if (!atBottom) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, atBottom]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await listConversations();
      if (cancelled) return;
      setConversations(data);
      if (data.length > 0) setSelectedId(data[0].id);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedId === null) return;

    let cancelled = false;
    (async () => {
      const data = await listMessages(selectedId);
      if (cancelled) return;
      setMessages([...data].reverse());
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const handlePoke = useCallback(
    async (conversationId: number) => {
      const list = await listConversations();
      setConversations(list);

      if (conversationId === selectedId) {
        const data = await listMessages(conversationId);
        setMessages([...data].reverse());
      }
    },
    [selectedId],
  );

  useMessageEvents(handlePoke);

  async function handleSend() {
    if (selectedId === null) return;
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const msg = await sendMessage(selectedId, content);
      if (!msg) return;

      setMessages((prev) => [...prev, msg]);
      setDraft("");

      const list = await listConversations();
      setConversations(list);
    } finally {
      setSending(false);
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    const title = conversationTitle(conv, isCustomer).toLowerCase();
    const subtitle = conversationSubtitle(conv, isCustomer).toLowerCase();
    const preview = (conv.preview ?? "").toLowerCase();

    return title.includes(q) || subtitle.includes(q) || preview.includes(q);
  });

  const selectedConversation =
    conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <DashboardPage className="mb-6 pb-15">
      <PageHeader
        eyebrow="Customer care / inbox"
        title="Service messages"
        description="Keep repair conversations attached to the request so customers always know what happens next."
      />

      <div className="mt-6 grid min-h-[590px] max-h-[600px] gap-4 lg:grid-cols-[373px_minmax(0,1fr)]">
        {/* Inbox */}
        <DashboardPanel contentClassName="h-full">
          <div className="border-b border-[#d8e0eb] px-4 py-3 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-md font-bold text-[#102c50] dark:text-white">
                  Inbox
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {conversations.length} conversation
                  {conversations.length === 1 ? "" : "s"}
                </p>
              </div>
              <span className="rounded bg-[#eef4ff] dark:bg-[#0b213d] px-2 py-0.5 text-xs font-semibold text-[#2870e8] dark:text-[#8ec5ff]">
                {conversations.length}
              </span>
            </div>
          </div>

          <div className="border-b border-[#d8e0eb] p-3 dark:border-slate-700">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isCustomer ? "Find a conversation" : "Find a customer or repair"}
                className="h-9 w-full rounded-md border border-[#d8e0eb] bg-[#f8fafc] pl-9 pr-3 text-[11px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-y-auto">
            {filteredConversations.map((conv) => {
              const isSelected = selectedId === conv.id;
              const title = conversationTitle(conv, isCustomer);
              const subtitle = conversationSubtitle(conv, isCustomer);

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedId(conv.id)}
                  className={`flex w-full gap-3 border-b border-[#edf0f5] px-4 py-4 text-left transition-colors dark:border-slate-700 ${
                    isSelected
                      ? "bg-[#f1f6ff] dark:bg-[#172a42]"
                      : "hover:bg-[#f8fafc] dark:hover:bg-[#162334]"
                  }`}
                >
                  <UserAvatar variant="messages" initials={initialsOf(title)} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12px] font-bold text-[#102c50] dark:text-white">
                        {title}
                      </p>
                      <span className="shrink-0 text-[9px] text-slate-400">
                        {/* {formatTime(conv.last_message_at)} */}
                        {dayjs(conv.last_message_at).calendar()}
                      </span>
                    </div>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {subtitle}
                    </p>

                    <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400">
                      {conv.preview || "No messages yet"}
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
              <div className="px-4 py-8 text-center text-xs text-slate-400">
                {conversations.length === 0
                  ? "No conversations yet."
                  : "Nothing matches your search."}
              </div>
            )}
          </div>
        </DashboardPanel>


        <DashboardPanel contentClassName="flex h-full w-full min-w-0 items-center justify-center">
          {selectedConversation ? (
            <div className="flex max-h-[670px] h-full w-full flex-col">
              <div className="flex items-center gap-3 border-b border-[#d8e0eb] px-5 py-4 dark:border-slate-700">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dceaff] text-[10px] font-bold text-[#2870e8]">
                  {initialsOf(conversationTitle(selectedConversation, isCustomer))}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#102c50] dark:text-white">
                    {conversationTitle(selectedConversation, isCustomer)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {conversationSubtitle(selectedConversation, isCustomer)}
                  </p>
                </div>
              </div>

              <div
                ref={messagesRef}
                onScroll={(e) => setAtBottom(isNearBottom(e.currentTarget))}
                className="flex flex-1 flex-col gap-3 overflow-y-auto p-5"
              >
                {messages.length === 0 ? (
                  <p className="m-auto text-[11px] text-slate-400">
                    No messages yet. Say hello.
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === viewerId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex max-w-[75%] flex-col ${
                          isMine ? "self-end items-end" : "self-start items-start"
                        }`}
                      >
                        <p className="mb-1 text-[10px] text-slate-400">
                          {messageSenderLabel(msg, currentUser.role, viewerId)}
                        </p>
                        <div
                          className={`rounded-lg px-4 py-2.5 text-xs leading-5 ${
                            isMine
                              ? "bg-[#2870e8] text-white"
                              : "bg-[#f1f5f9] text-slate-700 dark:bg-[#182536] dark:text-slate-300"
                          }`}
                        >
                          {msg.content}
                        </div>
                          <span className={`mt-1 text-[9px] text-slate-400 dark:text-slate-500`}>
                            {/* {new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} */}
                            {dayjs(msg.created_at).calendar()}
                          </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-[#d8e0eb] p-4 dark:border-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Write a message..."
                    className="h-10 flex-1 rounded-md border border-[#d8e0eb] px-3 text-[11px] outline-none focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
                  />
                  <CommonButton
                    onClick={handleSend}
                    disabled={sending || draft.trim().length === 0}
                    className="disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send"}
                  </CommonButton>
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
        </DashboardPanel>
      </div>
    </DashboardPage>
  );
}
