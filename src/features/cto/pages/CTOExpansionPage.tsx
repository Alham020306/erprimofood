import { useCTOExpansionAnalyzerLite } from "../hooks/useCTOExpansionAnalyzerLite";
import CTOExpansionTable from "../components/CTOExpansionTable";
import CTOTechMetricCard from "../components/CTOTechMetricCard";

export default function CTOExpansionPage() {
  const { loading, analysis } = useCTOExpansionAnalyzerLite();

  if (loading) return <div>Loading CTO expansion analyzer...</div>;

  const highPotential = analysis.filter((x) => x.recommendation === "HIGH_POTENTIAL").length;
  const needDriver = analysis.filter((x) => x.recommendation === "NEED_DRIVER_FIRST").length;
  const needMerchant = analysis.filter((x) => x.recommendation === "NEED_MERCHANT_FIRST").length;
  const lowActivity = analysis.filter((x) => x.recommendation === "LOW_ACTIVITY").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CTOTechMetricCard title="Areas Analyzed" value={analysis.length} />
        <CTOTechMetricCard title="High Potential" value={highPotential} />
        <CTOTechMetricCard title="Need Driver First" value={needDriver} />
        <CTOTechMetricCard title="Need Merchant First" value={needMerchant} subtitle={`Low Activity: ${lowActivity}`} />
      </div>

      <CTOExpansionTable rows={analysis} />
    </div>
  );
}
