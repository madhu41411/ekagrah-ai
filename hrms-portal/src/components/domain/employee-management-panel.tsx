"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Option = {
  id: string;
  label: string;
};

type EmployeeManagementPanelProps = {
  departments: Option[];
  designations: Option[];
  managers: Option[];
};

const roleOptions = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "MANAGER", label: "Manager" },
  { value: "HR_ADMIN", label: "HR Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" }
] as const;

const employmentTypeOptions = [
  { value: "FULL_TIME", label: "Full time" },
  { value: "PART_TIME", label: "Part time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" }
] as const;

const initialForm = {
  email: "",
  password: "ChangeMe123!",
  role: "EMPLOYEE",
  employeeCode: "",
  firstName: "",
  lastName: "",
  joiningDate: new Date().toISOString().slice(0, 10),
  employmentType: "FULL_TIME",
  departmentId: "",
  designationId: "",
  managerId: "",
  workLocation: ""
};

export function EmployeeManagementPanel({
  departments,
  designations,
  managers
}: EmployeeManagementPanelProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      ...form,
      joiningDate: new Date(form.joiningDate).toISOString(),
      departmentId: form.departmentId || undefined,
      designationId: form.designationId || undefined,
      managerId: form.managerId || undefined,
      workLocation: form.workLocation || undefined
    };

    const response = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Unable to create employee");
      return;
    }

    setSuccess("Employee added successfully.");
    setForm(initialForm);
    setIsOpen(false);
    router.refresh();
  }

  function updateField(name: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <Card
      title="Manage Employees"
      description="Add new hires, assign reporting lines, and keep the directory current."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          This section is visible to Super Admin and HR Admin users.
        </div>
        <Button type="button" onClick={() => setIsOpen((current) => !current)}>
          {isOpen ? "Hide form" : "Add Employee"}
        </Button>
      </div>

      {success ? <p className="mt-4 text-sm text-brand-700">{success}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {isOpen ? (
        <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={submitForm}>
          <Field label="First name">
            <Input value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} required />
          </Field>
          <Field label="Last name">
            <Input value={form.lastName} onChange={(event) => updateField("lastName", event.target.value)} required />
          </Field>
          <Field label="Employee code">
            <Input value={form.employeeCode} onChange={(event) => updateField("employeeCode", event.target.value)} placeholder="50003" required />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
          </Field>
          <Field label="Temporary password">
            <Input type="text" value={form.password} onChange={(event) => updateField("password", event.target.value)} required />
          </Field>
          <Field label="Joining date">
            <Input type="date" value={form.joiningDate} onChange={(event) => updateField("joiningDate", event.target.value)} required />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(event) => updateField("role", event.target.value)}>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Employment type">
            <Select value={form.employmentType} onChange={(event) => updateField("employmentType", event.target.value)}>
              {employmentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Work location">
            <Input value={form.workLocation} onChange={(event) => updateField("workLocation", event.target.value)} placeholder="Mumbai" />
          </Field>
          <Field label="Department">
            <Select value={form.departmentId} onChange={(event) => updateField("departmentId", event.target.value)}>
              <option value="">Select department</option>
              {departments.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Designation">
            <Select value={form.designationId} onChange={(event) => updateField("designationId", event.target.value)}>
              <option value="">Select designation</option>
              {designations.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Reporting manager">
            <Select value={form.managerId} onChange={(event) => updateField("managerId", event.target.value)}>
              <option value="">Select manager</option>
              {managers.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-2 xl:col-span-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding employee..." : "Create employee"}
            </Button>
          </div>
        </form>
      ) : null}
    </Card>
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
