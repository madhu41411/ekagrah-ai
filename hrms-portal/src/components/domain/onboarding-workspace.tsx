"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

type EmployeeOption = {
  id: string;
  label: string;
};

type DocumentRecord = {
  id: string;
  employeeId: string;
  title: string;
  letterType: string;
  notes: string | null;
  content: string | null;
  issuedAt: string | null;
  createdAt: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    user: {
      email: string;
    };
  };
};

type Props = {
  employees: EmployeeOption[];
  documents: DocumentRecord[];
};

const categoryOptions = [
  { value: "OFFER_LETTER", label: "Offer Letter" },
  { value: "APPOINTMENT_LETTER", label: "Appointment Letter" },
  { value: "INCREMENT_LETTER", label: "Increment Letter" },
  { value: "EXPERIENCE_LETTER", label: "Experience Letter" }
] as const;

const titleByCategory: Record<string, string> = {
  OFFER_LETTER: "Offer Letter",
  APPOINTMENT_LETTER: "Appointment Letter",
  INCREMENT_LETTER: "Increment Letter",
  EXPERIENCE_LETTER: "Experience Letter"
};

export function OnboardingWorkspace({ employees, documents }: Props) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [letterType, setLetterType] = useState("OFFER_LETTER");
  const [title, setTitle] = useState("Offer Letter");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(documents[0]?.id ?? "");

  const filteredDocuments = useMemo(
    () => documents.filter((document) => document.employeeId === employeeId),
    [documents, employeeId]
  );
  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === employeeId) ?? null,
    [employees, employeeId]
  );

  const selectedDocument = useMemo(
    () => filteredDocuments.find((document) => document.id === selectedId) ?? filteredDocuments[0] ?? null,
    [filteredDocuments, selectedId]
  );

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/onboarding-documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        letterType,
        title,
        notes: notes || undefined
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Unable to generate document");
      return;
    }

    const createdDocument = (await response.json()) as { id: string; employeeId: string };
    setMessage("Letter generated and saved.");
    setNotes("");
    setEmployeeId(createdDocument.employeeId);
    setSelectedId(createdDocument.id);
    router.refresh();
  }

  function handleCategoryChange(value: string) {
    setLetterType(value);
    setTitle(titleByCategory[value] ?? "Generated Letter");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Generate Letter" description="Create reusable onboarding and employee lifecycle letters from stored profile data.">
          {message ? <p className="mb-4 text-sm text-brand-700">{message}</p> : null}
          {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

          <form className="grid gap-4" onSubmit={submitForm}>
            <Field label="Employee">
              <Select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Letter type">
              <Select value={letterType} onChange={(event) => handleCategoryChange(event.target.value)}>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Document title">
              <input
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>
            <Field label="Additional notes">
              <textarea
                className="min-h-28 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add compensation notes, effective date context, or special clauses."
              />
            </Field>
            <div>
              <Button type="submit" disabled={isSubmitting || !employeeId}>
                {isSubmitting ? "Generating..." : "Generate document"}
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Generated Documents" description="Recent letters created by HR and admin users.">
          <div className="mb-4 rounded-lg border border-line bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Showing Documents For</p>
            <p className="mt-1 text-sm font-medium text-ink">{selectedEmployee?.label ?? "No employee selected"}</p>
          </div>
          <div className="space-y-3">
            {filteredDocuments.length === 0 ? (
              <p className="text-sm text-slate-500">No letters generated yet for the selected employee.</p>
            ) : (
              filteredDocuments.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => setSelectedId(document.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                    selectedDocument?.id === document.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-line bg-white hover:border-brand-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{document.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {document.employee.firstName} {document.employee.lastName} • {document.letterType}
                      </p>
                    </div>
                    {selectedDocument?.id === document.id ? (
                      <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
                        Current
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Last updated {formatDate(document.issuedAt ?? document.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card title="Document Viewer" description="Preview generated letter content before exporting to PDF or final storage.">
        {selectedDocument ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-ink">{selectedDocument.title}</p>
                <p className="text-sm text-slate-500">
                  {selectedDocument.employee.firstName} {selectedDocument.employee.lastName} • {selectedDocument.employee.employeeCode}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Last updated {formatDate(selectedDocument.issuedAt ?? selectedDocument.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {selectedDocument.letterType}
                </span>
                <a
                  href={`/api/onboarding-documents/${selectedDocument.id}/pdf`}
                  className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
                >
                  Download PDF
                </a>
              </div>
            </div>
            <pre className="overflow-x-auto rounded-lg border border-line bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
              {selectedDocument.content ?? "No preview available."}
            </pre>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Generate a letter to view it here.</p>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
