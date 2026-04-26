import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "./formatters";

export const exportSettlementsToPDF = (
  entityType: "RESTAURANT" | "DRIVER",
  user: any,
  summary: any,
  entities: any[]
) => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString("id-ID");
  const timeStr = new Date().toLocaleTimeString("id-ID");
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  const title = `Laporan Settlement ${entityType === "RESTAURANT" ? "Restoran" : "Driver"}`;
  doc.text(title, 14, 22);

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`C-Level ERP - Diekspor pada: ${dateStr} ${timeStr}`, 14, 30);
  doc.text(`Oleh: ${user?.name || user?.email || "Admin CFO"}`, 14, 35);

  // Summary box
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, 42, 182, 40, 3, 3, "FD");

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Ringkasan Komisi Keseluruhan", 20, 50);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  // Mitra (Restaurant)
  doc.setTextColor(100, 116, 139);
  doc.text("Total Mitra (Restoran):", 20, 58);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(`Terbayar: ${formatCurrency(summary.restaurantPaid || 0)}`, 65, 58);
  doc.setTextColor(244, 63, 94); // rose-500
  doc.text(`Belum Dibayar: ${formatCurrency(summary.restaurantUnpaid || 0)}`, 125, 58);

  // Driver
  doc.setTextColor(100, 116, 139);
  doc.text("Total Driver:", 20, 65);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(`Terbayar: ${formatCurrency(summary.driverPaid || 0)}`, 65, 65);
  doc.setTextColor(244, 63, 94); // rose-500
  doc.text(`Belum Dibayar: ${formatCurrency(summary.driverUnpaid || 0)}`, 125, 65);

  // Grand Total
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total:", 20, 72);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(`Terbayar: ${formatCurrency(summary.totalPaid || 0)}`, 65, 72);
  doc.setTextColor(244, 63, 94); // rose-500
  doc.text(`Belum Dibayar: ${formatCurrency(summary.totalUnpaid || 0)}`, 125, 72);

  // Table Data
  const tableColumn = ["Entitas", "Pendapatan Kotor", "Belum Dibayar", "Sudah Dibayar", "Status"];
  const tableRows: any[] = [];

  entities.forEach((entity) => {
    const status = entity.isBanned 
      ? "BANNED" 
      : entity.totalUnpaid > 0 
        ? "BELUM BAYAR" 
        : "LUNAS";

    const entityData = [
      entity.entityName,
      formatCurrency(entity.grossEarnings || 0),
      formatCurrency(entity.totalUnpaid || 0),
      formatCurrency(entity.totalPaid || 0),
      status
    ];
    tableRows.push(entityData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 88,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'center' },
    },
    didParseCell: function (data) {
      if (data.section === "body" && data.column.index === 4) {
        if (data.cell.raw === "BANNED") {
          data.cell.styles.textColor = [244, 63, 94]; // rose-500
          data.cell.styles.fontStyle = "bold";
        } else if (data.cell.raw === "BELUM BAYAR") {
          data.cell.styles.textColor = [245, 158, 11]; // amber-500
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [16, 185, 129]; // emerald-500
          data.cell.styles.fontStyle = "bold";
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 85;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Digenerate otomatis oleh sistem C-Level ERP", 14, finalY + 10);

  doc.save(`Settlement_Report_${entityType}_${dateStr.replace(/\//g, "-")}.pdf`);
};
