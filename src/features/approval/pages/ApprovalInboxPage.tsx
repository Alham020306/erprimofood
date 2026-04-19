import ApprovalDetailPanel from "../components/ApprovalDetailPanel";
import ApprovalFilters from "../components/ApprovalFilters";
import ApprovalInboxTable from "../components/ApprovalInboxTable";
import ApprovalSummaryCards from "../components/ApprovalSummaryCards";
import ApprovalComposerForm from "../components/ApprovalComposerForm";
import DocumentsLibraryPanel from "../components/DocumentsLibraryPanel";
import { useApprovalInbox } from "../hooks/useApprovalInbox";
import { useApprovalComposer } from "../hooks/useApprovalComposer";
import { useDocumentsLibrary } from "../hooks/useDocumentsLibrary";

type Props = {
  user: any;
};

export default function ApprovalInboxPage({ user }: Props) {
  const inbox = useApprovalInbox({ user });
  const composer = useApprovalComposer({ user });
  const documents = useDocumentsLibrary();

  return (
    <div className="space-y-6">
      <ApprovalSummaryCards summary={inbox.summary} />

      <ApprovalFilters
        statusFilter={inbox.statusFilter}
        onStatusFilterChange={inbox.setStatusFilter}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ApprovalInboxTable
            items={inbox.items}
            onSelect={inbox.setSelectedApproval}
          />
        </div>

        <div>
          <ApprovalComposerForm
            title={composer.title}
            setTitle={composer.setTitle}
            description={composer.description}
            setDescription={composer.setDescription}
            requestType={composer.requestType}
            setRequestType={composer.setRequestType}
            targetRole={composer.targetRole}
            setTargetRole={composer.setTargetRole}
            priority={composer.priority}
            setPriority={composer.setPriority}
            amount={composer.amount}
            setAmount={composer.setAmount}
            notes={composer.notes}
            setNotes={composer.setNotes}
            files={composer.files}
            setFiles={composer.setFiles}
            submitting={composer.submitting}
            submit={composer.submit}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ApprovalDetailPanel
          approval={inbox.selectedApproval}
          activityLogs={inbox.activityLogs}
          onApprove={inbox.approve}
          onReject={inbox.reject}
          onRequestRevision={inbox.requestRevision}
        />

        <DocumentsLibraryPanel
          loading={documents.loading}
          documents={documents.documents}
          typeFilter={documents.typeFilter}
          setTypeFilter={documents.setTypeFilter}
        />
      </div>
    </div>
  );
}