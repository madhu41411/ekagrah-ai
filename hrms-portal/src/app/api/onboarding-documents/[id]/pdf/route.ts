import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { requireRole } from "@/server/auth/guards";
import { getOnboardingDocumentById } from "@/server/services/onboarding-service";

const PYTHON_BIN =
  process.env.WORKSPACE_PYTHON ??
  "/Users/madhu/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const LOGO_PATH =
  "/Users/madhu/Library/Mobile Documents/com~apple~CloudDocs/Ekagrah-Company/eka_logo.png";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);

  if (response) {
    return response;
  }

  const { id } = await context.params;
  const document = await getOnboardingDocumentById(id);

  if (!document) {
    return NextResponse.json({ message: "Document not found" }, { status: 404 });
  }

  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const employeeSlug = `${document.employee.firstName}-${document.employee.lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const fileName = `${employeeSlug}_${stamp}.pdf`;

  const payload = {
    company: {
      name: "Ekagrah Solutions Private Limited",
      tagline: "FOCUS INNOVATION",
      logoPath: LOGO_PATH,
      signatory: "Authorized Signatory",
      signatoryTitle: "HR & Operations"
    },
    employee: {
      fullName: `${document.employee.firstName} ${document.employee.lastName}`,
      employeeCode: document.employee.employeeCode,
      email: document.employee.user.email,
      designation: document.employee.designation?.title ?? "Employee",
      department: document.employee.department?.name ?? "Consulting",
      joiningDate: (document.employee.joiningDate ?? now).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }),
      workLocation: document.employee.workLocation ?? "India"
    },
    document: {
      title: formatTitle(document.title),
      subtitle: `${formatLetterType(document.letterType)} | Ekagrah Solutions Private Limited`,
      intro:
        document.content?.split("\n").find((line) => line.trim()) ??
        "This document is issued by Ekagrah Solutions Private Limited.",
      compensation: "As per offer and annexures approved by management",
      sections: buildSectionsFromContent(document.content ?? "")
    }
  };

  const stdout = await renderPdf(payload);

  return new NextResponse(new Uint8Array(stdout), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store"
    }
  });
}

async function renderPdf(payload: unknown) {
  return new Promise<Buffer>((resolve, reject) => {
    const child = spawn(PYTHON_BIN, ["/Users/madhu/Documents/Codex/hrms-portal/scripts/generate_letter_pdf.py"], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    const chunks: Buffer[] = [];
    const errors: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => errors.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(Buffer.concat(errors).toString("utf8") || "PDF generation failed"));
        return;
      }

      resolve(Buffer.concat(chunks));
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

function buildSectionsFromContent(content: string) {
  const blocks = content
    .split("\n\n")
    .map((block) => block.trim())
    .filter(Boolean);

  const sections = [];

  for (const block of blocks.slice(2)) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) {
      continue;
    }

    sections.push({
      heading: lines[0],
      kind: "paragraphs",
      items: lines.slice(1)
    });
  }

  if (sections.length === 0) {
    sections.push({
      heading: "Terms",
      kind: "paragraphs",
      items: [content]
    });
  }

  sections.push({
    heading: "General Conditions",
    kind: "bullets",
    items: [
      "This document is issued for internal HR and employee record purposes.",
      "The employee is expected to comply with company policy, confidentiality, and conduct obligations.",
      "Commercial terms remain subject to final management and payroll confirmation where applicable."
    ]
  });

  return sections;
}

function formatLetterType(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTitle(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
