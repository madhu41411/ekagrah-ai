"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useRouter } from "next/navigation";

type Option = {
  id: string;
  label: string;
};

type EmployeeRecord = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  joiningDate: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  workLocation: string | null;
  departmentId: string | null;
  designationId: string | null;
  managerId: string | null;
  departmentName: string | null;
  designationTitle: string | null;
  managerName: string | null;
  user: {
    email: string;
    role: "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE";
  };
};

type Props = {
  employees: EmployeeRecord[];
  departments: Option[];
  designations: Option[];
  managers: Option[];
  canManage: boolean;
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

export function EmployeeDirectoryAdmin({
  employees,
  departments,
  designations,
  managers,
  canManage
}: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);

  function openEditor(employee: EmployeeRecord) {
    setEditingId(employee.id);
    setMessage(null);
    setError(null);
    setForm({
      email: employee.user.email,
      role: employee.user.role,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      joiningDate: employee.joiningDate.slice(0, 10),
      employmentType: employee.employmentType,
      departmentId: employee.departmentId ?? "",
      designationId: employee.designationId ?? "",
      managerId: employee.managerId ?? "",
      workLocation: employee.workLocation ?? ""
    });
  }

  function closeEditor() {
    setEditingId(null);
    setForm(null);
  }

  function updateField(name: keyof EditFormState, value: string) {
    setForm((current) => (current ? { ...current, [name]: value } : current));
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId || !form) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/employees/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        joiningDate: new Date(form.joiningDate).toISOString(),
        departmentId: form.departmentId || undefined,
        designationId: form.designationId || undefined,
        managerId: form.managerId || undefined,
        workLocation: form.workLocation || undefined
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Unable to update employee");
      return;
    }

    setMessage("Employee profile updated.");
    closeEditor();
    router.refresh();
  }

  return (
    <Card title="Employee Directory" description="Review current profiles, reporting lines, and operational assignments.">
      {message ? <p className="mb-4 text-sm text-brand-700">{message}</p> : null}
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line text-slate-500">
            <tr>
              <th className="px-3 py-2">Employee</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Designation</th>
              <th className="px-3 py-2">Manager</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Location</th>
              {canManage ? <th className="px-3 py-2">Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b border-line align-top last:border-b-0">
                <td className="px-3 py-3">
                  <p className="font-medium text-ink">{employee.firstName} {employee.lastName}</p>
                  <p className="text-xs text-slate-500">{employee.employeeCode} • {employee.user.email}</p>
                </td>
                <td className="px-3 py-3">{employee.departmentName ?? "-"}</td>
                <td className="px-3 py-3">{employee.designationTitle ?? "-"}</td>
                <td className="px-3 py-3">{employee.managerName ?? "-"}</td>
                <td className="px-3 py-3">{employee.user.role}</td>
                <td className="px-3 py-3">{employee.workLocation ?? "-"}</td>
                {canManage ? (
                  <td className="px-3 py-3">
                    <Button variant="secondary" type="button" onClick={() => openEditor(employee)}>
                      Edit
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManage && form ? (
        <div className="mt-6 rounded-lg border border-line bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-ink">Edit Employee</h3>
              <p className="text-sm text-slate-500">Update directory details, reporting manager, and access role.</p>
            </div>
            <Button type="button" variant="ghost" onClick={closeEditor}>Close</Button>
          </div>

          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={submitEdit}>
            <Field label="First name">
              <Input value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} required />
            </Field>
            <Field label="Last name">
              <Input value={form.lastName} onChange={(event) => updateField("lastName", event.target.value)} required />
            </Field>
            <Field label="Employee code">
              <Input value={form.employeeCode} onChange={(event) => updateField("employeeCode", event.target.value)} required />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
            </Field>
            <Field label="Joining date">
              <Input type="date" value={form.joiningDate} onChange={(event) => updateField("joiningDate", event.target.value)} required />
            </Field>
            <Field label="Work location">
              <Input value={form.workLocation} onChange={(event) => updateField("workLocation", event.target.value)} />
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
                {isSubmitting ? "Saving changes..." : "Save changes"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </Card>
  );
}

type EditFormState = {
  email: string;
  role: "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE";
  employeeCode: string;
  firstName: string;
  lastName: string;
  joiningDate: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  departmentId: string;
  designationId: string;
  managerId: string;
  workLocation: string;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
