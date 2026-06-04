import { jsPDF } from "jspdf";
import { Sample } from "../types";

/**
 * Escapes characters for CSV compatibility (RFC 4180)
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Escapes characters for XML/HTML compatibility
 */
function escapeHtml(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generates an optimized UTF-8 CSV blob with BOM for seamless Microsoft Excel loading.
 */
export function generateSamplesCsv(samples: Sample[]): Blob {
  const csvHeaders = [
    "Sample ID",
    "Client",
    "Project Reference",
    "Sample Type",
    "Matrix Type",
    "Weight",
    "Priority Level",
    "Technician Assigned",
    "Storage Location",
    "Container Type",
    "Received From",
    "Special Instructions",
    "Status",
    "Received Date",
  ];

  const csvRows = samples.map((s) => [
    escapeCsv(s.id),
    escapeCsv(s.client),
    escapeCsv(s.project),
    escapeCsv(s.type),
    escapeCsv(s.matrix || "Sulphide"),
    escapeCsv(s.weight || "—"),
    escapeCsv(s.priority),
    escapeCsv(s.technician),
    escapeCsv(s.location),
    escapeCsv(s.container || "Calico Bag"),
    escapeCsv(s.receivedFrom || "Field Courier"),
    escapeCsv(s.specialInstructions || "None"),
    escapeCsv(s.status),
    escapeCsv(s.receivedAt),
  ]);

  // Prepend UTF-8 Byte Order Mark (BOM) to force Excel to open in UTF-8 mode
  const csvContent =
    "\uFEFF" + [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\r\n");
  return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
}

/**
 * Generates a styled Excel spreadsheet utilizing standard XML styles for custom colors and margins.
 */
export function generateSamplesExcel(samples: Sample[]): Blob {
  const rowsHtml = samples
    .map((s, idx) => {
      const rowStyle = idx % 2 === 1 ? 'style="background-color: #f8fafc;"' : "";

      let priorityColor = "#475569";
      if (s.priority === "High" || s.priority === "Rush") priorityColor = "#dc2626";

      let statusColor = "#475569";
      if (s.status === "Completed" || s.status === "Report Ready") statusColor = "#16a34a";
      else if (s.status === "In Analysis") statusColor = "#2563eb";
      else if (s.status === "In Preparation") statusColor = "#d97706";

      return `
      <tr ${rowStyle}>
        <td style="font-family: monospace; font-weight: bold; color: #2563eb; border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(s.id)}</td>
        <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(s.client)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(s.project)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(s.type)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(s.matrix || "Sulphide")}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(s.weight || "—")}</td>
        <td style="color: ${priorityColor}; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(s.priority)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(s.technician)}</td>
        <td style="font-family: monospace; border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(s.location)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(s.container || "Calico Bag")}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(s.receivedFrom || "Field Courier")}</td>
        <td style="font-style: italic; border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(s.specialInstructions || "None")}</td>
        <td style="color: ${statusColor}; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(s.status)}</td>
        <td style="color: #64748b; border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(new Date(s.receivedAt).toLocaleString())}</td>
      </tr>`;
    })
    .join("");

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
    <!--[if gte mso 9]>
    <xml>
     <x:ExcelWorkbook>
      <x:ExcelWorksheets>
       <x:ExcelWorksheet>
        <x:Name>LIMS Samples Export</x:Name>
        <x:WorksheetOptions>
         <x:DisplayGridlines/>
        </x:WorksheetOptions>
       </x:ExcelWorksheet>
      </x:ExcelWorksheets>
     </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <style>
      table { border-collapse: collapse; }
      th { background-color: #1e293b; color: #ffffff; font-weight: bold; font-family: sans-serif; text-align: left; padding: 10px 8px; border: 1px solid #cbd5e1; font-size: 11px; }
      td { font-family: sans-serif; font-size: 11px; }
    </style>
    </head>
    <body>
    <h2 style="font-family: sans-serif; color: #0f172a; margin-bottom: 5px;">GEOChem LIMS - Exported Sample Registry</h2>
    <p style="font-family: sans-serif; color: #64748b; font-size: 11px; margin-top: 0; margin-bottom: 20px;">
      Generated: ${new Date().toLocaleString()} · Total Records: ${samples.length} · ISO 17025 System Export
    </p>
    <table>
      <thead>
        <tr>
          <th>Sample ID</th>
          <th>Client Name</th>
          <th>Project</th>
          <th>Sample Type</th>
          <th>Matrix</th>
          <th>Weight</th>
          <th>Priority</th>
          <th>Technician</th>
          <th>Storage Location</th>
          <th>Container</th>
          <th>Received From</th>
          <th>Special Instructions</th>
          <th>Status</th>
          <th>Received Date</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    </body>
    </html>
  `;

  return new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8" });
}

/**
 * Generates an auto-paginated landscape PDF inventory table with professional LIMS headers and color coding.
 */
export function generateSamplesPdf(samples: Sample[]): Blob {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageHeight = 210;
  const pageWidth = 297;
  let pageNum = 1;

  const drawHeader = (docInstance: jsPDF, page: number) => {
    // Slate 800 Top Banner
    docInstance.setFillColor(30, 41, 59);
    docInstance.rect(0, 0, pageWidth, 28, "F");

    // Title
    docInstance.setTextColor(255, 255, 255);
    docInstance.setFont("helvetica", "bold");
    docInstance.setFontSize(18);
    docInstance.text("GEOChem LIMS Workspace", 15, 12);

    docInstance.setFont("helvetica", "normal");
    docInstance.setFontSize(8.5);
    docInstance.text("Enterprise Sample Registry Export · Certified Data Log", 15, 18);
    docInstance.text(
      `Total Records: ${samples.length} | Generated: ${new Date().toLocaleString()}`,
      15,
      23,
    );

    // Document Type Label
    docInstance.setFont("helvetica", "bold");
    docInstance.setFontSize(12);
    docInstance.text("SAMPLES LOG INVENTORY", pageWidth - 15, 13, { align: "right" });

    docInstance.setFontSize(8.5);
    docInstance.setFont("helvetica", "normal");
    docInstance.text(`Page ${page}`, pageWidth - 15, 19, { align: "right" });
    docInstance.text("ISO/IEC 17025 System Standard", pageWidth - 15, 24, { align: "right" });

    // Table Header Background (slate-100)
    docInstance.setFillColor(241, 245, 249);
    docInstance.rect(15, 34, pageWidth - 30, 8, "F");

    // Headers
    docInstance.setTextColor(51, 65, 85);
    docInstance.setFont("helvetica", "bold");
    docInstance.setFontSize(8.5);
    docInstance.text("Sample ID", 18, 39);
    docInstance.text("Client Name", 40, 39);
    docInstance.text("Project Reference", 82, 39);
    docInstance.text("Matrix / Type", 125, 39);
    docInstance.text("Priority", 175, 39);
    docInstance.text("Storage Loc", 195, 39);
    docInstance.text("Technician", 225, 39);
    docInstance.text("Status", 258, 39);

    // Separator line
    docInstance.setDrawColor(226, 232, 240);
    docInstance.setLineWidth(0.4);
    docInstance.line(15, 42, pageWidth - 15, 42);
  };

  drawHeader(doc, pageNum);

  let y = 48;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  samples.forEach((s, idx) => {
    // Height boundary check with automatic page creation
    if (y > pageHeight - 15) {
      doc.addPage();
      pageNum++;
      drawHeader(doc, pageNum);
      y = 48;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
    }

    // Row alternating background (slate-50)
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 5, pageWidth - 30, 7.5, "F");
    }

    // Row bottom separator line
    doc.setDrawColor(241, 245, 249);
    doc.line(15, y + 2.5, pageWidth - 15, y + 2.5);

    // Draw values
    doc.setFont("helvetica", "bold");
    doc.text(s.id, 18, y);
    doc.setFont("helvetica", "normal");

    // Safety truncation
    const clientStr = s.client.length > 22 ? s.client.substring(0, 20) + ".." : s.client;
    doc.text(clientStr, 40, y);

    const projStr = s.project.length > 22 ? s.project.substring(0, 20) + ".." : s.project;
    doc.text(projStr, 82, y);

    const typeStr = `${s.matrix || "Rock"} / ${s.type}`;
    const truncatedType = typeStr.length > 24 ? typeStr.substring(0, 22) + ".." : typeStr;
    doc.text(truncatedType, 125, y);

    // Color code high priorities
    const isHigh = s.priority === "High" || s.priority === "Rush";
    if (isHigh) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
    }
    doc.text(s.priority, 175, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);

    doc.text(s.location, 195, y);
    doc.text(s.technician, 225, y);

    // Status coloring
    const isCompleted = s.status === "Completed" || s.status === "Report Ready";
    if (isCompleted) {
      doc.setTextColor(22, 163, 74);
      doc.setFont("helvetica", "bold");
    } else if (s.status === "In Analysis") {
      doc.setTextColor(37, 99, 235);
    } else if (s.status === "In Preparation") {
      doc.setTextColor(217, 119, 6);
    }
    doc.text(s.status, 258, y);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");

    y += 7.5;
  });

  // Stamp total page counts on bottom footer
  const totalPages = pageNum;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text(
      "GEOChem LIMS · CONFIDENTIAL SYSTEMS DATA EXPORT · CERTIFIED LOG SHEET",
      15,
      pageHeight - 7,
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 7, { align: "right" });
  }

  return doc.output("blob");
}

// Re-export downloadBlob from its canonical location for backward compatibility
export { downloadBlob } from "./report-service";
