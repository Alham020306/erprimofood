import ChatComposer from "../components/ChatComposer";
import ChatMessageList from "../components/ChatMessageList";
import { useCOOChat } from "../hooks/useCOOChat";

type Props = {
  user: any;
};

export default function COOChatPage({ user }: Props) {
  const { loading, messages, text, setText, sendMessage } = useCOOChat({ user });

  if (loading) return <div>Loading COO chat...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChatMessageList messages={messages} currentUserId={user?.uid} />
      <ChatComposer text={text} onTextChange={setText} onSend={sendMessage} />
    </div>
  );
}