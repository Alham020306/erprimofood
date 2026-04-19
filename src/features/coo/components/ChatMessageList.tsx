type Props = {
  messages: any[];
  currentUserId: string;
};

export default function ChatMessageList({ messages, currentUserId }: Props) {
  if (!messages.length) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow">
        <h2 className="mb-4 text-lg font-bold">COO Chat</h2>
        <div>No messages</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <h2 className="mb-4 text-lg font-bold">COO Chat</h2>

      <div className="space-y-3">
        {messages.map((msg: any) => {
          const isMine = msg.senderId === currentUserId;

          return (
            <div
              key={msg.id}
              className={`rounded-xl px-4 py-3 ${
                isMine
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-slate-50 border border-slate-200"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">
                  {msg.senderName ?? "-"}
                </span>
                <span className="text-xs text-slate-500">
                  {msg.senderRole ?? "-"}
                </span>
              </div>
              <p className="text-sm text-slate-700">{msg.text ?? ""}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}