import jsPDF from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import logoSvgAsString from "/logo.svg?raw";

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
  days: string[];
  startTime: string;
  endTime: string;
  issueDate: Date;
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
  let programLabel =
    data.programType === "carrera"
      ? "la carrera de"
      : data.programType === "diplomatura"
      ? "la diplomatura de"
      : "el curso de";

  const daysLower = data.days.map((d) => d.toLowerCase());
  const daysText =
    data.programType === "diplomatura"
      ? `con días de cursada los ${joinDays(daysLower)}`
      : `con día de cursada los ${daysLower[0] ?? ""}`;

  return `Por medio de la presente, se deja constancia de que ${studentLabel} ${data.fullName}, con número de ${
    data.docType
  } ${data.docNumber}, realizó ${programLabel} ${data.programName} con fecha de inicio el ${
    formatLongDate(data.startDate)
  } y finalización el ${formatLongDate(data.endDate)}, ${daysText} en el horario de ${data.startTime} a ${
    data.endTime
  } hs (hora argentina).`;
}

/**
 * Convierte una cadena de texto SVG a una imagen PNG en formato base64.
 * @param svgString El contenido del archivo SVG como string.
 */
async function svgStringToBase64PNG(svgString: string): Promise<string | null> {
  try {
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = (img.naturalWidth || 500) * 2;
        canvas.height = (img.naturalHeight || 200) * 2;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          return resolve(null);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngBase64 = canvas.toDataURL("image/png");
        URL.revokeObjectURL(url);
        resolve(pngBase64);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  } catch (e) {
    console.warn("Error convirtiendo SVG a PNG:", e);
    return null;
  }
}

function drawPlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(200);
  doc.setFillColor(245, 247, 250);
  doc.rect(x, y, w, h, "FD");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text("[ LOGO ]", x + w / 2, y + h / 2 + 3, { align: "center" });
}

export async function generateCertificatePdf(data: CertificateData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentWidth = pageWidth - margin * 2;

  // ---------- Logo ----------
  const logoH = 50;
  const logoW = 130;

  // Convertimos el SVG importado como texto a Base64 y lo agregamos al PDF.
  const imageBase64 = await svgStringToBase64PNG(logoSvgAsString);

  if (imageBase64) {
    try {
      doc.addImage(imageBase64, "PNG", margin, margin, logoW, logoH);
    } catch (e) {
      drawPlaceholder(doc, margin, margin, logoW, logoH);
    }
  } else {
    drawPlaceholder(doc, margin, margin, logoW, logoH);
  }

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
  doc.text(`Buenos Aires, ${formatLongDate(data.issueDate)}`, pageWidth - margin, cursorY, { align: "right" });

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
  doc.text(lines, margin, cursorY, { align: "justify", lineHeightFactor: 1.6 });
  cursorY += lines.length * 11.5 * 1.6;

  // ---------- Closing ----------
  cursorY += 24;
  doc.text(
    "Se extiende la presente a pedido del interesado, a los efectos que estime corresponder.",
    margin,
    cursorY,
    { maxWidth: contentWidth, lineHeightFactor: 1.6 }
  );

  // ---------- Signature ----------
  const sigY = pageHeight - margin - 130;
  doc.setDrawColor(60);
  doc.line(pageWidth / 2 - 90, sigY, pageWidth / 2 + 90, sigY);
  doc.setFont("helvetica", "bold");
  doc.text(data.directorName || COMPANY.director, pageWidth / 2, sigY + 16, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(data.directorTitle || COMPANY.directorTitle, pageWidth / 2, sigY + 30, { align: "center" });

  // ---------- Footer ----------
  const footerY = pageHeight - margin;
  doc.setDrawColor(220);
  doc.line(margin, footerY - 36, pageWidth - margin, footerY - 36);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(data.companyAddress || COMPANY.address, margin, footerY - 18);
  const url = data.companyUrl || COMPANY.url;
  doc.setTextColor(30, 80, 180);
  doc.textWithLink(url, pageWidth - margin, footerY - 18, {
    url: `https://${url.replace(/^https?:\/\//, "")}`,
    align: "right",
  });

  // ---------- Save ----------
  const safeEmail = data.email.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, "_");
  doc.save(`${safeEmail}.pdf`);
}
