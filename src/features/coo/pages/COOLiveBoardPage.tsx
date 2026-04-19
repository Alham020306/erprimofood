import LiveOpsFeed from "../components/LiveOpsFeed";
import LiveOpsIssuesPanel from "../components/LiveOpsIssuesPanel";
import LiveOpsStatusGrid from "../components/LiveOpsStatusGrid";
import { useCOOLiveBoard } from "../hooks/useCOOLiveBoard";

export default function COOLiveBoardPage() {
  const { loading, board } = useCOOLiveBoard();

  if (loading) return <div>Loading COO live board...</div>;

  return (
    <div className="space-y-6">
      <LiveOpsStatusGrid stats={board.stats} />

      <div className="grid gap-4 md:grid-cols-2">
        <LiveOpsIssuesPanel issues={board.issues} />
        <LiveOpsFeed orders={board.orders} />
      </div>
    </div>
  );
}