import jsPDF from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type Gender = "masculino" | "femenino";
export type ProgramType = "curso" | "carrera" | "diplomatura";
export type DocType = "DNI" | "Cédula" | "RUT";

export interface CertificateData {
  fullName: string;
  email: string;
  gender: Gender;
  docType: DocType;
  docNumber: string;
  programType: ProgramType;
  programName: string;
  startDate: Date;
  endDate: Date;
  /** For curso/carrera: single day. For diplomatura: multiple days. */
  days: string[];
  startTime: string; // "18:00"
  endTime: string; // "21:00"
  issueDate: Date;
  // Company / signatory placeholders
  directorName?: string;
  directorTitle?: string;
  companyAddress?: string;
  companyUrl?: string;
}

const COMPANY = {
  name: "Nombre de la Empresa",
  director: "Nombre del Director",
  directorTitle: "Director Académico",
  address: "Dirección de la empresa, Ciudad, País",
  url: "www.empresa.com",
};

function formatLongDate(d: Date) {
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: es });
}

function joinDays(days: string[]) {
  if (days.length === 0) return "";
  if (days.length === 1) return days[0];
  if (days.length === 2) return `${days[0]} y ${days[1]}`;
  return `${days.slice(0, -1).join(", ")} y ${days[days.length - 1]}`;
}

export function buildCertificateText(data: CertificateData) {
  const studentLabel = data.gender === "femenino" ? "nuestra estudiante" : "nuestro estudiante";

  let programLabel: string;
  if (data.programType === "carrera") programLabel = "la carrera de";
  else if (data.programType === "diplomatura") programLabel = "la diplomatura de";
  else programLabel = "el curso de";

  const daysLower = data.days.map((d) => d.toLowerCase());
  const daysText =
    data.programType === "diplomatura"
      ? `con días de cursada los ${joinDays(daysLower)}`
      : `con día de cursada los ${daysLower[0] ?? ""}`;

  return `Por medio de la presente, se deja constancia de que ${studentLabel} ${data.fullName}, con número de ${data.docType} ${data.docNumber}, realizó ${programLabel} ${data.programName} con fecha de inicio el ${formatLongDate(data.startDate)} y finalización el ${formatLongDate(data.endDate)}, ${daysText} en el horario de ${data.startTime} a ${data.endTime} hs (hora argentina).`;
}

export function generateCertificatePdf(data: CertificateData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentWidth = pageWidth - margin * 2;

  // ---------- Logo placeholder ----------
  const logoH = 56;
  const logoW = 140;
  doc.setDrawColor(200);
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, margin, logoW, logoH, "FD");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.setFont("helvetica", "italic");
  doc.text("[ LOGO ]", margin + logoW / 2, margin + logoH / 2 + 3, { align: "center" });

  // ---------- Header line ----------
  const headerY = margin + logoH + 28;
  doc.setDrawColor(220);
  doc.setLineWidth(0.5);
  doc.line(margin, headerY, pageWidth - margin, headerY);

  // ---------- Place + date ----------
  let cursorY = headerY + 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.text(`Buenos Aires, ${formatLongDate(data.issueDate)}`, pageWidth - margin, cursorY, {
    align: "right",
  });

  // ---------- Title ----------
  cursorY += 50;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text("Constancia de Cursada", pageWidth / 2, cursorY, { align: "center" });

  // ---------- Body ----------
  cursorY += 36;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11.5);
  doc.setTextColor(30);
  const body = buildCertificateText(data);
  const lines = doc.splitTextToSize(body, contentWidth) as string[];
  doc.text(lines, margin, cursorY, { align: "justify", lineHeightFactor: 1.6, maxWidth: contentWidth });
  cursorY += lines.length * 11.5 * 1.6;

  // ---------- Closing ----------
  cursorY += 24;
  doc.text(
    "Se extiende la presente a pedido del interesado, a los efectos que estime corresponder.",
    margin,
    cursorY,
    { maxWidth: contentWidth, lineHeightFactor: 1.6 },
  );

  // ---------- Signature ----------
  const sigY = pageHeight - margin - 130;
  doc.setDrawColor(60);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - 90, sigY, pageWidth / 2 + 90, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text(data.directorName || COMPANY.director, pageWidth / 2, sigY + 16, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(data.directorTitle || COMPANY.directorTitle, pageWidth / 2, sigY + 30, { align: "center" });

  // ---------- Footer ----------
  const footerY = pageHeight - margin;
  doc.setDrawColor(220);
  doc.line(margin, footerY - 36, pageWidth - margin, footerY - 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(data.companyAddress || COMPANY.address, margin, footerY - 18);
  const url = data.companyUrl || COMPANY.url;
  doc.setTextColor(30, 80, 180);
  doc.textWithLink(url, pageWidth - margin, footerY - 18, { url: `https://${url.replace(/^https?:\/\//, "")}`, align: "right" });

  // ---------- Save ----------
  const safeEmail = data.email.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, "_");
  doc.save(`${safeEmail}.pdf`);
}
