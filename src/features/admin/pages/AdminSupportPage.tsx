import { useEffect, useMemo, useRef, useState } from "react";
import {
  closeAdminSupportTicket,
  sendAdminSupportMessage,
  subscribeAdminSupportChats,
  subscribeAdminSupportMessages,
  subscribeAdminSupportStatus,
  updateAdminSupportStatus,
} from "../services/adminMonitoringService";

type Props = {
  user: any;
};

export default function AdminSupportPage({ user }: Props) {
  const [supportStatus, setSupportStatus] = useState({
    isOnline: true,
    reason: "Siap membantu pengguna Rimo Food.",
  });
  const [draftReason, setDraftReason] = useState(supportStatus.reason);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubStatus = subscribeAdminSupportStatus((value) => {
      setSupportStatus(value);
      setDraftReason(value.reason);
    });
    const unsubChats = subscribeAdminSupportChats((rows) => {
      setChats(rows);
      setLoading(false);
      if (!selectedChatId && rows.length) {
        setSelectedChatId(rows[0].id);
      }
    });

    return () => {
      unsubStatus();
      unsubChats();
    };
  }, [selectedChatId]);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    const unsub = subscribeAdminSupportMessages(selectedChatId, setMessages);
    return () => unsub();
  }, [selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredChats = useMemo(
    () =>
      chats.filter((chat) =>
        [chat?.userName, chat?.id, chat?.lastMessage]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ),
    [chats, searchQuery]
  );

  const selectedChat = chats.find((item) => item.id === selectedChatId);

  const handleToggleStatus = async () => {
    await updateAdminSupportStatus({ isOnline: !supportStatus.isOnline });
  };

  const handleSaveReason = async () => {
    await updateAdminSupportStatus({ reason: draftReason });
  };

  const handleSend = async () => {
    if (!selectedChatId || !inputText.trim()) return;

    await sendAdminSupportMessage({
      chatId: selectedChatId,
      text: inputText,
      senderId: user?.uid || "ADMIN",
      senderName: user?.fullName || "Rimo Support",
      senderRole: user?.primaryRole || "ADMIN",
    });

    setInputText("");
  };

  const handleCloseTicket = async () => {
    if (!selectedChatId) return;
    await closeAdminSupportTicket(selectedChatId);
    setSelectedChatId(null);
    setMessages([]);
  };

  if (loading) return <div>Loading support workspace...</div>;

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col space-y-10 pb-12">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <section className="relative flex items-center justify-between overflow-hidden rounded-[48px] bg-slate-950 p-8 text-white shadow-2xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative z-10 flex items-center gap-6">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${
                supportStatus.isOnline
                  ? "bg-emerald-500 text-white shadow-emerald-500/30"
                  : "bg-rose-500 text-white shadow-rose-500/30"
              }`}
            >
              <span className="text-xl font-black">{supportStatus.isOnline ? "ON" : "OFF"}</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">
                Channel Status
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">
                {supportStatus.isOnline ? "Online" : "Offline"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleStatus}
            className={`relative z-10 rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-[0.18em] ${
              supportStatus.isOnline
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"
            }`}
          >
            {supportStatus.isOnline ? "Go Offline" : "Go Online"}
          </button>
        </section>

        <section className="rounded-[48px] bg-white p-8 shadow-xl xl:col-span-2">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            Pesan Status
          </div>
          <h3 className="mt-3 text-xl font-black text-slate-900">
            Pesan offline untuk customer, merchant, dan driver
          </h3>
          <div className="mt-5 flex flex-col gap-4 md:flex-row">
            <input
              value={draftReason}
              onChange={(event) => setDraftReason(event.target.value)}
              className="flex-1 rounded-2xl border border-transparent bg-slate-50 px-6 py-4 text-sm font-bold outline-none focus:border-orange-200 focus:bg-white"
            />
            <button
              type="button"
              onClick={handleSaveReason}
              className="rounded-2xl bg-orange-500 px-8 py-4 text-sm font-black text-white shadow-lg shadow-orange-200"
            >
              Save
            </button>
          </div>
        </section>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 xl:grid-cols-[0.95fr,1.4fr]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[56px] bg-white shadow-2xl">
          <div className="border-b border-slate-100 p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">
                  Support Tickets
                </h3>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Direct driver and customer assistance
                </p>
              </div>
              <div className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700">
                {chats.length}
              </div>
            </div>

            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tickets..."
              className="mt-6 w-full rounded-2xl border border-transparent bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:border-orange-200 focus:bg-white"
            />
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/40 p-6">
            {!filteredChats.length ? (
              <div className="pt-20 text-center text-sm font-semibold text-slate-400">
                No matching tickets
              </div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`w-full rounded-[34px] border-2 p-6 text-left transition-all ${
                    selectedChatId === chat.id
                      ? "scale-[1.01] border-slate-950 bg-slate-950 text-white shadow-2xl"
                      : "border-white bg-white hover:border-orange-200 hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                          selectedChatId === chat.id
                            ? "bg-slate-800 text-blue-300"
                            : "bg-slate-50 text-slate-400"
                        }`}
                      >
                        <span className="text-sm font-black">
                          {String(chat.userName || "U").slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-black tracking-tight">
                          {chat.userName || "User Rimo"}
                        </div>
                        <div
                          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                            selectedChatId === chat.id
                              ? "bg-slate-800 text-orange-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {chat.userRole || "CUSTOMER"}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] opacity-50">
                      {chat.lastUpdated
                        ? new Date(Number(chat.lastUpdated)).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </div>
                  </div>
                  <p
                    className={`mt-4 truncate text-[11px] font-bold ${
                      selectedChatId === chat.id ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {chat.lastMessage || "Belum ada pesan terakhir."}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-[56px] bg-slate-50 shadow-2xl">
          {selectedChat ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 bg-white px-8 py-7">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-slate-950 text-white shadow-lg">
                    <span className="text-lg font-black">
                      {String(selectedChat.userName || "U").slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
                      {selectedChat.userName || "User Rimo"}
                    </h3>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                      {(selectedChat.userRole || "CUSTOMER") +
                        " / " +
                        selectedChat.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseTicket}
                  className="rounded-2xl bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-rose-600"
                >
                  Close Ticket
                </button>
              </div>

              <div className="flex-1 space-y-8 overflow-y-auto px-8 py-8">
                {messages.map((msg, index) => {
                  const isMine = msg.isAdmin === true || msg.senderId === user?.uid;
                  const showDate =
                    index === 0 ||
                    new Date(Number(messages[index - 1]?.timestamp || 0)).toDateString() !==
                      new Date(Number(msg.timestamp || 0)).toDateString();

                  return (
                    <div key={msg.id}>
                      {showDate ? (
                        <div className="mb-6 flex justify-center">
                          <span className="rounded-full border border-slate-100 bg-white px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-slate-400 shadow-sm">
                            {msg.timestamp
                              ? new Date(Number(msg.timestamp)).toLocaleDateString("id-ID", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "short",
                                })
                              : "Today"}
                          </span>
                        </div>
                      ) : null}

                      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`flex max-w-[75%] flex-col ${isMine ? "items-end" : "items-start"}`}>
                          <div
                            className={`rounded-[28px] px-6 py-5 text-[13px] font-bold leading-relaxed shadow-xl ${
                              isMine
                                ? "rounded-br-none bg-slate-950 text-white"
                                : "rounded-bl-none border border-white bg-white text-slate-800"
                            }`}
                          >
                            {msg.text || ""}
                          </div>
                          <div className="mt-2 flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            {msg.timestamp
                              ? new Date(Number(msg.timestamp)).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "--:--"}
                            {isMine ? <span className="text-blue-500">sent</span> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-50 bg-white p-8">
                <div className="flex gap-4 rounded-[36px] border border-slate-100 bg-slate-50 p-3 shadow-inner">
                  <input
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Write your response here..."
                    className="flex-1 bg-transparent px-6 py-4 text-sm font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    className="rounded-[28px] bg-slate-950 px-7 py-4 text-sm font-black text-white shadow-2xl"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <div className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  Help Center Inbox
                </div>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
                  Pilih tiket untuk membalas
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
