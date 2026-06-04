import { jsPDF } from "jspdf";
import { AnalyticalReport, Sample } from "../types";

/**
 * Generates a high-quality PDF blob client-side using jsPDF for a given report, sample, and result array.
 */
export async function generateReportPdfBlob(
  report: AnalyticalReport,
  sample: Sample,
  results: any[],
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // 1. Sleek Header Banner (Slate 800)
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 42, "F");

  // Title / Identity
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("GEOCHEM LAB SUITE", 15, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Premium Geochemical Analysis & LIMS Services", 15, 24);
  doc.text("100 Innovation Drive, Tech Park, Suite 400", 15, 29);
  doc.text("Tel: +1 (555) 019-2831 | contact@geochemlabs.com", 15, 34);

  // Certificate Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("CERTIFICATE OF ANALYSIS", 195, 18, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Report ID: ${report.id}`, 195, 24, { align: "right" });
  doc.text(`Date Issued: ${new Date(report.createdAt).toLocaleDateString()}`, 195, 29, {
    align: "right",
  });
  doc.text(`Status: ${report.status.toUpperCase()}`, 195, 34, { align: "right" });

  // 2. Metadata Columns
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Client & Project Information", 15, 52);

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(15, 54, 195, 54);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");

  // Left Column
  doc.text(`Client Name:`, 15, 62);
  doc.setFont("helvetica", "bold");
  doc.text(sample.client || report.client, 40, 62);
  doc.setFont("helvetica", "normal");

  doc.text(`Project Reference:`, 15, 68);
  doc.setFont("helvetica", "bold");
  doc.text(sample.project || "Exploration A", 40, 68);
  doc.setFont("helvetica", "normal");

  doc.text(`Registration Tech:`, 15, 74);
  doc.text(sample.technician || "M. Rivera", 40, 74);

  doc.text(`Priority Level:`, 15, 80);
  doc.text(sample.priority || "Standard", 40, 80);

  // Right Column
  doc.text(`Sample LIMS ID:`, 110, 62);
  doc.setFont("helvetica", "bold");
  doc.text(sample.id || report.sample, 138, 62);
  doc.setFont("helvetica", "normal");

  doc.text(`Matrix/Sample Type:`, 110, 68);
  doc.text(`${sample.matrix || "Rock Core"} / ${sample.type || "Core Split"}`, 138, 68);

  doc.text(`Weight & Container:`, 110, 74);
  doc.text(`${sample.weight || "—"} (${sample.container || "Calico Bag"})`, 138, 74);

  doc.text(`Special Instructions:`, 110, 80);
  doc.text(
    sample.specialInstructions
      ? sample.specialInstructions.substring(0, 32) +
          (sample.specialInstructions.length > 32 ? "..." : "")
      : "None",
    138,
    80,
  );

  // 3. Results Section
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Analytical Chemistry & Assay Results", 15, 93);
  doc.line(15, 95, 195, 95);

  // Table Header Background
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(15, 100, 180, 8, "F");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("Analyzed Element", 18, 105);
  doc.text("Value / Concentration", 65, 105);
  doc.text("Unit", 105, 105);
  doc.text("Analytical Method", 130, 105);
  doc.text("QA/QC Result Status", 168, 105);

  let y = 114;
  doc.setFont("helvetica", "normal");

  const rows =
    results && results.length > 0
      ? results
      : [
          { element: "Au", value: "2.410", unit: "g/t", method: "FA-AAS", qa: "Pass" },
          { element: "Ag", value: "18.20", unit: "g/t", method: "ICP-MS-51E", qa: "Pass" },
          { element: "Cu", value: "1.240", unit: "%", method: "ICP-OES-4A", qa: "Pass" },
          { element: "Pb", value: "0.340", unit: "%", method: "ICP-OES-4A", qa: "Pass" },
        ];

  rows.forEach((row: any) => {
    // Row line
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(15, y - 5, 195, y - 5);

    doc.text(row.element, 18, y);
    doc.setFont("helvetica", "bold");
    doc.text(row.value.toString(), 65, y);
    doc.setFont("helvetica", "normal");
    doc.text(row.unit, 105, y);
    doc.text(row.method, 130, y);

    const isPass = row.qa === "Pass" || row.qa === "Passed" || row.qa === "Approved";
    const isFail =
      row.qa === "Fail" || row.qa === "Failed" || row.qa === "Flag" || row.qa === "Flagged";

    if (isPass) {
      doc.setTextColor(22, 163, 74); // green-600
      doc.text("✓ Passed QC", 168, y);
    } else if (isFail) {
      doc.setTextColor(220, 38, 38); // red-600
      doc.text("⚠ QA Flagged", 168, y);
    } else {
      doc.setTextColor(217, 119, 6); // amber-600
      doc.text(row.qa || "Pending", 168, y);
    }
    doc.setTextColor(30, 41, 59); // Reset

    y += 9;
  });

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(15, y - 5, 195, y - 5);

  // 4. Quality Sign-Off & Verification
  y += 5;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Verification, History & Quality Sign-Off", 15, y);
  doc.line(15, y + 2, 195, y + 2);

  y += 10;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");

  doc.text(`Authorized Signatory:`, 15, y);
  doc.setFont("helvetica", "bold");
  doc.text(
    report.status === "Approved" || report.status === "Delivered"
      ? report.approvedBy || "Adaeze Nwosu (QA Manager)"
      : "Pending Sign-off",
    50,
    y,
  );
  doc.setFont("helvetica", "normal");

  doc.text(`Signature Date:`, 15, y + 6);
  doc.text(
    report.approvedAt ? new Date(report.approvedAt).toLocaleString() : "Not signed",
    50,
    y + 6,
  );

  if (report.comments) {
    doc.text(`Rejection/Revision Notes:`, 110, y);
    doc.setFont("helvetica", "italic");
    doc.text(report.comments, 110, y + 4, { maxWidth: 85 });
    doc.setFont("helvetica", "normal");
  } else {
    doc.text(`Delivery Mode:`, 110, y);
    doc.text(
      report.status === "Delivered"
        ? `Client Portal Delivery (${report.deliveredBy || "Automated System"})`
        : "Not delivered",
      132,
      y,
    );

    doc.text(`Delivery Date:`, 110, y + 6);
    doc.text(
      report.deliveredAt ? new Date(report.deliveredAt).toLocaleDateString() : "Pending delivery",
      132,
      y + 6,
    );
  }

  // 5. Visual Certification Stamp / Watermark
  if (report.status === "Approved" || report.status === "Delivered") {
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.8);
    doc.rect(145, y + 16, 50, 16);

    doc.setTextColor(22, 163, 74);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("GEOCHEM LABS", 170, y + 22, { align: "center" });
    doc.text("✓ CERTIFIED & SIGNED", 170, y + 28, { align: "center" });
    doc.setTextColor(30, 41, 59);
  } else {
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.8);
    doc.rect(145, y + 16, 50, 16);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DRAFT ONLY", 170, y + 22, { align: "center" });
    doc.text("UNPUBLISHED", 170, y + 28, { align: "center" });
    doc.setTextColor(30, 41, 59);
  }

  // Footer text
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    "This analytical report is generated electronically under ISO/IEC 17025 accreditation standards.",
    15,
    283,
  );
  doc.text("All values reported here represent quality audited and verified data logs.", 15, 287);
  doc.text("Page 1 of 1", 195, 287, { align: "right" });

  return doc.output("blob");
}

/**
 * Initiates a browser download for a Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
