import { DocumentCategory } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "./audit-service";

type CreateDocumentInput = {
  employeeId: string;
  letterType: "OFFER_LETTER" | "APPOINTMENT_LETTER" | "INCREMENT_LETTER" | "EXPERIENCE_LETTER";
  title: string;
  notes?: string;
};

export type OnboardingDocumentRecord = Awaited<ReturnType<typeof listOnboardingDocuments>>[number];

export async function listOnboardingDocuments() {
  await cleanupDuplicateOnboardingDocuments();

  const documents = await prisma.employeeDocument.findMany({
    where: {
      fileUrl: {
        startsWith: "letter://"
      }
    },
    include: {
      employee: {
        include: {
          department: true,
          designation: true,
          user: {
            select: { email: true }
          }
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  const latestByEmployeeAndType = new Map<string, (typeof documents)[number]>();

  for (const document of documents) {
    const [letterType = "OFFER_LETTER"] = document.fileName.split("__");
    const key = `${document.employeeId}:${letterType}`;

    if (!latestByEmployeeAndType.has(key)) {
      latestByEmployeeAndType.set(key, document);
    }
  }

  return Array.from(latestByEmployeeAndType.values()).map((document) => {
    const content = decodeLetterContent(document.fileUrl);
    const [letterType = "OFFER_LETTER", title = document.fileName] = document.fileName.split("__");

    return {
      ...document,
      title: title.replace(/\.txt$/i, "").replace(/-/g, " "),
      letterType,
      notes: null,
      content,
      issuedAt: document.updatedAt
    };
  });
}

export async function getOnboardingDocumentById(id: string) {
  const documents = await listOnboardingDocuments();
  return documents.find((document) => document.id === id) ?? null;
}

export async function createOnboardingDocument(actorUserId: string, input: CreateDocumentInput) {
  const employee = await prisma.employee.findUnique({
    where: { id: input.employeeId },
    include: {
      department: true,
      designation: true,
      user: { select: { email: true } }
    }
  });

  if (!employee || employee.deletedAt) {
    throw new Error("Employee not found");
  }

  const title = input.title.trim();
  const content = buildLetterContent({
    letterType: input.letterType,
    title,
    notes: input.notes,
    employee
  });

  const normalizedFileName = `${input.letterType}__${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
  const existingDocuments = await prisma.employeeDocument.findMany({
    where: {
      employeeId: input.employeeId,
      fileUrl: {
        startsWith: "letter://"
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  const existingDocument = existingDocuments.find((item) => item.fileName.startsWith(`${input.letterType}__`));

  const document = existingDocument
    ? await prisma.employeeDocument.update({
        where: { id: existingDocument.id },
        data: {
          fileName: normalizedFileName,
          fileUrl: encodeLetterContent(content),
          uploadedById: actorUserId
        }
      })
    : await prisma.employeeDocument.create({
        data: {
          employeeId: input.employeeId,
          category: DocumentCategory.OFFER_LETTER,
          fileName: normalizedFileName,
          fileUrl: encodeLetterContent(content),
          uploadedById: actorUserId
        }
      });

  const duplicateIds = existingDocuments
    .filter((item) => item.id !== document.id && item.fileName.startsWith(`${input.letterType}__`))
    .map((item) => item.id);

  if (duplicateIds.length > 0) {
    await prisma.employeeDocument.deleteMany({
      where: {
        id: {
          in: duplicateIds
        }
      }
    });
  }

  await writeAuditLog({
    actorUserId,
    action: "document.generate",
    entityType: "EmployeeDocument",
    entityId: document.id,
    metadata: { letterType: input.letterType, employeeId: input.employeeId }
  });

  return {
    ...document,
    title,
    letterType: input.letterType,
    notes: input.notes ?? null,
    content,
    issuedAt: document.updatedAt
  };
}

async function cleanupDuplicateOnboardingDocuments() {
  const documents = await prisma.employeeDocument.findMany({
    where: {
      fileUrl: {
        startsWith: "letter://"
      }
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      employeeId: true,
      fileName: true
    }
  });

  const seen = new Set<string>();
  const staleIds: string[] = [];

  for (const document of documents) {
    const [letterType = "OFFER_LETTER"] = document.fileName.split("__");
    const key = `${document.employeeId}:${letterType}`;

    if (seen.has(key)) {
      staleIds.push(document.id);
      continue;
    }

    seen.add(key);
  }

  if (staleIds.length > 0) {
    await prisma.employeeDocument.deleteMany({
      where: {
        id: {
          in: staleIds
        }
      }
    });
  }
}

function buildLetterContent({
  letterType,
  title,
  notes,
  employee
}: {
  letterType: "OFFER_LETTER" | "APPOINTMENT_LETTER" | "INCREMENT_LETTER" | "EXPERIENCE_LETTER";
  title: string;
  notes?: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    joiningDate: Date;
    workLocation: string | null;
    department: { name: string } | null;
    designation: { title: string } | null;
    user: { email: string };
  };
}) {
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const today = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date());

  const joiningDate = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(employee.joiningDate);

  const introByType: Record<CreateDocumentInput["letterType"], string> = {
    OFFER_LETTER: `This offer letter is issued on ${today} by Ekagrah Solutions Private Limited to ${fullName} for the role of ${employee.designation?.title ?? "Employee"}.`,
    APPOINTMENT_LETTER: `This appointment letter is issued on ${today} by Ekagrah Solutions Private Limited confirming the employment of ${fullName}.`,
    INCREMENT_LETTER: `This increment letter is issued on ${today} by Ekagrah Solutions Private Limited to record a compensation revision for ${fullName}.`,
    EXPERIENCE_LETTER: `This experience letter is issued on ${today} by Ekagrah Solutions Private Limited in favor of ${fullName}.`
  };

  const sectionsByType: Record<CreateDocumentInput["letterType"], string[][]> = {
    OFFER_LETTER: [
      [
        "Role and Engagement",
        `You are being offered the position of ${employee.designation?.title ?? "Employee"} in the ${employee.department?.name ?? "assigned"} function. Your employment is proposed to commence on ${joiningDate}.`
      ],
      [
        "Commercial Terms",
        "Compensation will be governed by the final salary structure issued by the HR team and any annexures approved by management.",
        "This offer is subject to satisfactory completion of pre-joining documentation and background verification."
      ],
      [
        "Notice and Conditions",
        "You will be expected to comply with company policy, confidentiality requirements, ethical standards, and reporting obligations.",
        "Either party may withdraw from this offer prior to joining if required approvals or verifications are not completed."
      ]
    ],
    APPOINTMENT_LETTER: [
      [
        "Appointment Terms",
        `Your appointment is effective from ${joiningDate}. You will be engaged in the capacity of ${employee.designation?.title ?? "Employee"} and will discharge duties assigned by the company from time to time.`
      ],
      [
        "Service Conditions",
        "You are required to observe all company policies on confidentiality, conduct, information security, and acceptable use.",
        "Any violation of company rules may result in disciplinary action in accordance with internal policy."
      ],
      [
        "Notice Period",
        "Separation terms, notice obligations, and handover expectations will be governed by the appointment terms communicated by HR."
      ]
    ],
    INCREMENT_LETTER: [
      [
        "Revision Note",
        "Based on business review and performance assessment, your compensation has been revised and will take effect as communicated by HR and payroll."
      ],
      [
        "Payroll Processing",
        "The revised structure will be reflected in the applicable payroll cycle subject to payroll cut-off and internal approvals."
      ]
    ],
    EXPERIENCE_LETTER: [
      [
        "Employment Confirmation",
        `${fullName} has been associated with Ekagrah Solutions Private Limited in the capacity of ${employee.designation?.title ?? "Employee"} in the ${employee.department?.name ?? "assigned"} function.`
      ],
      [
        "Record Purpose",
        "This letter is issued upon request for professional and record-keeping purposes."
      ]
    ]
  };

  const lines = [
    title,
    "",
    introByType[letterType],
    "",
    `Employee Name: ${fullName}`,
    `Employee Code: ${employee.employeeCode}`,
    `Email: ${employee.user.email}`,
    `Designation: ${employee.designation?.title ?? "Not assigned"}`,
    `Department: ${employee.department?.name ?? "Not assigned"}`,
    `Work Location: ${employee.workLocation ?? "Not assigned"}`,
    `Joining Date: ${joiningDate}`,
    ""
  ];

  for (const section of sectionsByType[letterType]) {
    lines.push(section[0]);
    lines.push(...section.slice(1));
    lines.push("");
  }

  if (notes) {
    lines.push("Additional Notes");
    lines.push(notes);
    lines.push("");
  }

  lines.push("For Ekagrah Solutions Private Limited");
  lines.push("Authorized Signatory");
  lines.push("");
  lines.push(`Accepted By: ${fullName}`);

  return lines.join("\n");
}

function encodeLetterContent(content: string) {
  return `letter://${Buffer.from(content, "utf8").toString("base64")}`;
}

function decodeLetterContent(content: string) {
  const base64 = content.replace(/^letter:\/\//, "");
  return Buffer.from(base64, "base64").toString("utf8");
}
