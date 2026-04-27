"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
  type ReactNode,
  type KeyboardEvent
} from "react";
import { Eye, EyeOff, CheckCircle2, XCircle, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Toast notification system
// Rule: success auto-clears (user can move on), errors stay (user must read them)
// ─────────────────────────────────────────────────────────────────────────────

type ToastEntry = { id: string; message: string; type: "success" | "error" };
type ToastFn = (type: "success" | "error", message: string) => void;

function useToasts() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (type: "success" | "error", message: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, message }]);
      if (type === "success") setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  return { toasts, add, remove };
}

function ToastStack({ toasts, onRemove }: { toasts: ToastEntry[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed right-5 top-5 z-50 flex w-80 flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-panel text-sm font-medium animate-fade-in",
            t.type === "success"
              ? "border-brand-100 bg-brand-50 text-brand-800"
              : "border-red-100 bg-red-50 text-red-800"
          )}
        >
          {t.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          )}
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="shrink-0 rounded p-0.5 opacity-50 transition hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic CRUD hook — optimistic updates with full rollback
//
// Behavioural principle: the UI reflects the intended state immediately.
// The network call either confirms it (silent) or reverts it with an
// explanation. The user never waits for a spinner.
// ─────────────────────────────────────────────────────────────────────────────

function useCrud<T extends { id: string }>(initial: T[], endpoint: string, toast: ToastFn) {
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Returns true on success so callers can decide to restore form state on failure
  async function create(
    payload: Record<string, unknown>,
    optimistic: Omit<T, "id">,
    successMsg: string
  ): Promise<boolean> {
    const tempId = "tmp_" + Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { ...optimistic, id: tempId } as T]);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed");
      const real: { id: string } = await res.json();
      // Swap temp ID for the real one — all other data is already correct
      setItems((prev) => prev.map((i) => (i.id === tempId ? { ...i, id: real.id } : i)));
      toast("success", successMsg);
      return true;
    } catch (e) {
      setItems((prev) => prev.filter((i) => i.id !== tempId));
      toast("error", e instanceof Error ? e.message : "Something went wrong. Please try again.");
      return false;
    }
  }

  async function update(
    id: string,
    payload: Record<string, unknown>,
    optimisticPatch: Partial<T>,
    successMsg: string
  ): Promise<boolean> {
    const snapshot = items.find((i) => i.id === id);
    if (!snapshot) return false;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...optimisticPatch } : i)));
    setEditingId(null);
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed");
      toast("success", successMsg);
      return true;
    } catch (e) {
      // Revert the optimistic patch AND re-open the editor so the user can retry
      setItems((prev) => prev.map((i) => (i.id === id ? snapshot : i)));
      setEditingId(id);
      toast("error", e instanceof Error ? e.message : "Something went wrong. Please try again.");
      return false;
    }
  }

  async function remove(id: string, successMsg: string): Promise<boolean> {
    const snapshot = items.find((i) => i.id === id);
    const snapshotIndex = items.findIndex((i) => i.id === id);
    if (!snapshot) return false;
    setItems((prev) => prev.filter((i) => i.id !== id));
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed");
      toast("success", successMsg);
      return true;
    } catch (e) {
      // Restore at the original position so the list doesn't jump
      setItems((prev) => {
        const next = [...prev];
        next.splice(snapshotIndex, 0, snapshot);
        return next;
      });
      toast("error", e instanceof Error ? e.message : "Something went wrong. Please try again.");
      return false;
    }
  }

  return { items, editingId, setEditingId, confirmDeleteId, setConfirmDeleteId, create, update, remove };
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic entity section — one component drives all three CRUD tabs.
// Parameterised by field config; data normalised to { primary, secondary }
// so the hook stays generic and server-shape differences are absorbed here.
// ─────────────────────────────────────────────────────────────────────────────

type FieldConfig = {
  key: string;
  label: string;
  placeholder: string;
  mono?: boolean;
  uppercase?: boolean;
  optional?: boolean;
};

type EntityItem = {
  id: string;
  primary: string;
  secondary: string;
  employeeCount?: number;
};

type EntitySectionProps = {
  noun: string;
  items: EntityItem[];
  primaryField: FieldConfig;
  secondaryField: FieldConfig;
  endpoint: string;
  showEmployeeCount?: boolean;
  onToast: ToastFn;
};

function EntitySection({
  noun,
  items: initialItems,
  primaryField,
  secondaryField,
  endpoint,
  showEmployeeCount = false,
  onToast
}: EntitySectionProps) {
  const { items, editingId, setEditingId, confirmDeleteId, setConfirmDeleteId, create, update, remove } =
    useCrud<EntityItem>(initialItems, endpoint, onToast);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ primary: "", secondary: "" });
  const [editForm, setEditForm] = useState({ primary: "", secondary: "" });
  const addPrimaryRef = useRef<HTMLInputElement>(null);
  const editPrimaryRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (showAdd) addPrimaryRef.current?.focus(); }, [showAdd]);
  useEffect(() => { if (editingId) editPrimaryRef.current?.focus(); }, [editingId]);

  function cancelAdd() {
    setShowAdd(false);
    setAddForm({ primary: "", secondary: "" });
  }

  function applyCase(value: string, field: FieldConfig) {
    return field.uppercase ? value.toUpperCase() : value;
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const primary = addForm.primary.trim();
    const secondary = applyCase(addForm.secondary.trim(), secondaryField);
    const saved = { primary, secondary };
    setAddForm({ primary: "", secondary: "" });
    setShowAdd(false);

    const payload: Record<string, unknown> = { [primaryField.key]: primary };
    if (secondary) payload[secondaryField.key] = secondary;

    const optimistic: Omit<EntityItem, "id"> = {
      primary,
      secondary,
      ...(showEmployeeCount ? { employeeCount: 0 } : {})
    };

    const ok = await create(payload, optimistic, `"${primary}" ${noun} added`);
    if (!ok) {
      // Restore the form so the user can retry without retyping
      setAddForm(saved);
      setShowAdd(true);
    }
  }

  function openEdit(item: EntityItem) {
    setEditingId(item.id);
    setEditForm({ primary: item.primary, secondary: item.secondary });
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const primary = editForm.primary.trim();
    const secondary = applyCase(editForm.secondary.trim(), secondaryField);
    const payload: Record<string, unknown> = { [primaryField.key]: primary };
    if (secondary) payload[secondaryField.key] = secondary;
    await update(editingId, payload, { primary, secondary }, `"${primary}" updated`);
  }

  function onKeyDown(e: KeyboardEvent, onEsc: () => void) {
    if (e.key === "Escape") { e.preventDefault(); onEsc(); }
  }

  const isPending = (id: string) => id.startsWith("tmp_");
  const nounPlural = `${noun}s`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {items.length === 0
            ? `No ${nounPlural} yet`
            : `${items.length} ${items.length === 1 ? noun : nounPlural} configured`}
        </p>
        {items.length > 0 && !showAdd && (
          <Button type="button" variant="secondary" onClick={() => setShowAdd(true)}>
            + Add {noun}
          </Button>
        )}
      </div>

      {items.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-slate-50/60 py-12 text-center">
          <p className="text-sm text-slate-400">
            Your first {noun} will appear here.
          </p>
          <Button type="button" variant="secondary" onClick={() => setShowAdd(true)}>
            Add {noun}
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-slate-50/80 text-left">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {primaryField.label}
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {secondaryField.label}
                </th>
                {showEmployeeCount && (
                  <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Employees
                  </th>
                )}
                <th className="w-44 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    "group border-b border-line last:border-0 transition-colors",
                    isPending(item.id) ? "opacity-50" : "hover:bg-slate-50/40"
                  )}
                >
                  {editingId === item.id ? (
                    <td colSpan={showEmployeeCount ? 4 : 3} className="bg-brand-50/30 px-4 py-3">
                      <form
                        className="flex flex-wrap items-end gap-3"
                        onSubmit={handleEdit}
                        onKeyDown={(e) => onKeyDown(e, () => setEditingId(null))}
                      >
                        <div className="min-w-40 flex-1">
                          <FormField label={primaryField.label}>
                            <Input
                              ref={editPrimaryRef}
                              value={editForm.primary}
                              onChange={(e) => setEditForm((f) => ({ ...f, primary: e.target.value }))}
                              required
                            />
                          </FormField>
                        </div>
                        <div className="min-w-28">
                          <FormField label={secondaryField.label + (secondaryField.optional ? " (optional)" : "")}>
                            <Input
                              value={editForm.secondary}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  secondary: applyCase(e.target.value, secondaryField)
                                }))
                              }
                              required={!secondaryField.optional}
                              className={cn(secondaryField.mono && "font-mono tracking-wide")}
                            />
                          </FormField>
                        </div>
                        <div className="flex gap-2 pb-0.5">
                          <Button type="submit">Save</Button>
                          <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-ink">{item.primary}</td>
                      <td className={cn("px-4 py-3 text-slate-500", secondaryField.mono && "font-mono tracking-wide")}>
                        {item.secondary || <span className="text-slate-300">—</span>}
                      </td>
                      {showEmployeeCount && (
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              (item.employeeCount ?? 0) > 0
                                ? "bg-brand-50 text-brand-700"
                                : "bg-slate-100 text-slate-400"
                            )}
                          >
                            {item.employeeCount ?? 0}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        {!isPending(item.id) &&
                          (confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-2 text-xs">
                              {showEmployeeCount && (item.employeeCount ?? 0) > 0 ? (
                                <span className="text-amber-600">
                                  Reassign {item.employeeCount}{" "}
                                  {(item.employeeCount ?? 0) === 1 ? "employee" : "employees"} first
                                </span>
                              ) : (
                                <>
                                  <span className="text-slate-500">Remove this {noun}?</span>
                                  <button
                                    className="rounded-md bg-red-500 px-2.5 py-1 font-medium text-white transition hover:bg-red-600"
                                    onClick={() => remove(item.id, `"${item.primary}" removed`)}
                                  >
                                    Remove
                                  </button>
                                  <button
                                    className="rounded-md px-2 py-1 text-slate-500 transition hover:bg-slate-100"
                                    onClick={() => setConfirmDeleteId(null)}
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                              <Button
                                type="button"
                                variant="secondary"
                                className="h-7 px-3 text-xs"
                                onClick={() => openEdit(item)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-7 px-3 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => setConfirmDeleteId(item.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <form
          className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-brand-100 bg-brand-50/30 px-4 py-4"
          onSubmit={handleAdd}
          onKeyDown={(e) => onKeyDown(e, cancelAdd)}
        >
          <div className="min-w-40 flex-1">
            <FormField label={primaryField.label}>
              <Input
                ref={addPrimaryRef}
                value={addForm.primary}
                onChange={(e) => setAddForm((f) => ({ ...f, primary: e.target.value }))}
                placeholder={primaryField.placeholder}
                required
              />
            </FormField>
          </div>
          <div className="min-w-28">
            <FormField label={secondaryField.label + (secondaryField.optional ? " (optional)" : "")}>
              <Input
                value={addForm.secondary}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    secondary: applyCase(e.target.value, secondaryField)
                  }))
                }
                placeholder={secondaryField.placeholder}
                required={!secondaryField.optional}
                className={cn(secondaryField.mono && "font-mono tracking-wide")}
              />
            </FormField>
          </div>
          <div className="flex gap-2 pb-0.5">
            <Button type="submit">Add {noun}</Button>
            <Button type="button" variant="ghost" onClick={cancelAdd}>
              Cancel{" "}
              <span className="ml-1 text-xs text-slate-400">Esc</span>
            </Button>
          </div>
        </form>
      )}

      {!showAdd && items.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="text-sm font-medium text-brand-600 transition hover:text-brand-700"
          >
            + Add another {noun}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// System Roles — read-only with contextual colour badges
// ─────────────────────────────────────────────────────────────────────────────

type RoleStat = { role: string; description: string; count: number };

const ROLE_META: Record<string, { label: string; chip: string }> = {
  SUPER_ADMIN: { label: "Super Admin", chip: "bg-purple-50 text-purple-700 ring-1 ring-purple-100" },
  HR_ADMIN: { label: "HR Admin", chip: "bg-blue-50 text-blue-700 ring-1 ring-blue-100" },
  MANAGER: { label: "Manager", chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" },
  EMPLOYEE: { label: "Employee", chip: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" }
};

function RolesSection({ roleStats }: { roleStats: RoleStat[] }) {
  return (
    <div>
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          These are built-in access levels — they cannot be added or removed.
          Assign roles to employees from the{" "}
          <a href="/employees" className="font-medium underline underline-offset-2">
            Employee directory
          </a>
          .
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {roleStats.map((stat) => {
          const meta = ROLE_META[stat.role] ?? { label: stat.role, chip: "bg-slate-100 text-slate-600" };
          return (
            <div
              key={stat.role}
              className="rounded-xl border border-line bg-white p-4 shadow-sm transition-shadow hover:shadow-panel"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", meta.chip)}>
                  {meta.label}
                </span>
                <span className="text-xs text-slate-400">
                  {stat.count} {stat.count === 1 ? "user" : "users"}
                </span>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-500">{stat.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Password field with show/hide and strength indicator
// ─────────────────────────────────────────────────────────────────────────────

function getStrength(p: string): { score: number; label: string; bar: string } {
  if (!p) return { score: 0, label: "", bar: "" };
  if (p.length < 8) return { score: 1, label: "Too short — 8+ characters required", bar: "bg-red-400" };
  let s = 1;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (s <= 2) return { score: 2, label: "Fair — add numbers or symbols", bar: "bg-amber-400" };
  if (s === 3) return { score: 3, label: "Good", bar: "bg-brand-500" };
  return { score: 4, label: "Strong", bar: "bg-brand-600" };
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  showStrength = false
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  showStrength?: boolean;
}) {
  const [show, setShow] = useState(false);
  const strength = showStrength && value ? getStrength(value) : null;

  return (
    <FormField label={label}>
      <div className="space-y-1.5">
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {strength && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    i <= strength.score ? strength.bar : "bg-slate-200"
                  )}
                />
              ))}
            </div>
            {strength.label && (
              <p
                className={cn(
                  "text-xs",
                  strength.score <= 1
                    ? "text-red-500"
                    : strength.score === 2
                    ? "text-amber-500"
                    : "text-brand-600"
                )}
              >
                {strength.label}
              </p>
            )}
          </div>
        )}
      </div>
    </FormField>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Password section — admin reset + self change
// ─────────────────────────────────────────────────────────────────────────────

type Employee = { id: string; firstName: string; lastName: string; employeeCode: string };

function PasswordsSection({ employees }: { employees: Employee[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ResetEmployeePassword employees={employees} />
      <ChangeSelfPassword />
    </div>
  );
}

function InlineAlert({ type, children }: { type: "success" | "error"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm animate-fade-in",
        type === "success"
          ? "border-brand-100 bg-brand-50 text-brand-800"
          : "border-red-100 bg-red-50 text-red-700"
      )}
    >
      {type === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
      ) : (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      )}
      <span className="leading-snug">{children}</span>
    </div>
  );
}

function ResetEmployeePassword({ employees }: { employees: Employee[] }) {
  const [employeeId, setEmployeeId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/config/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, newPassword })
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed");
      setStatus({ type: "success", message: "Password reset — the employee can log in with their new password." });
      setEmployeeId("");
      setNewPassword("");
    } catch (e) {
      setStatus({ type: "error", message: e instanceof Error ? e.message : "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Reset employee password" description="The employee will use this password at their next login.">
      {status && <InlineAlert type={status.type}>{status.message}</InlineAlert>}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField label="Employee">
          <Select
            value={employeeId}
            onChange={(e) => { setEmployeeId(e.target.value); setStatus(null); }}
            required
          >
            <option value="">Select employee…</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} — {emp.employeeCode}
              </option>
            ))}
          </Select>
        </FormField>
        <PasswordField
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          showStrength
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </Card>
  );
}

function ChangeSelfPassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/config/password-reset/self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed");
      setStatus({ type: "success", message: "Password changed — use your new password from next login." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (e) {
      setStatus({ type: "error", message: e instanceof Error ? e.message : "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Change your password" description="You'll need your current password to confirm the change.">
      {status && <InlineAlert type={status.type}>{status.message}</InlineAlert>}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <PasswordField
          label="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
        />
        <PasswordField
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          showStrength
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Changing…" : "Change password"}
        </Button>
      </form>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared label wrapper
// ─────────────────────────────────────────────────────────────────────────────

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab navigation + main export
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "departments" | "designations" | "locations" | "roles" | "passwords";

const TABS: { key: Tab; label: string }[] = [
  { key: "departments", label: "Departments" },
  { key: "designations", label: "Designations" },
  { key: "locations", label: "Locations" },
  { key: "roles", label: "System Roles" },
  { key: "passwords", label: "Password Reset" }
];

type Department = { id: string; name: string; code: string; _count: { employees: number } };
type Designation = { id: string; title: string; level: string | null; _count: { employees: number } };
type Location = { id: string; name: string; code: string };

type ConfigProps = {
  departments: Department[];
  designations: Designation[];
  locations: Location[];
  roleStats: RoleStat[];
  employees: Employee[];
};

export function ConfigurationWorkspace({ departments, designations, locations, roleStats, employees }: ConfigProps) {
  const [activeTab, setActiveTab] = useState<Tab>("departments");
  const { toasts, add: addToast, remove: removeToast } = useToasts();

  return (
    <>
      <ToastStack toasts={toasts} onRemove={removeToast} />

      <div className="space-y-5">
        {/* Tab bar */}
        <div className="flex gap-0.5 border-b border-line">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition",
                activeTab === tab.key
                  ? "text-brand-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t-full after:bg-brand-600"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "departments" && (
          <Card
            title="Departments"
            description="Organise your workforce into departments. Changes apply across the portal instantly."
          >
            <EntitySection
              noun="department"
              items={departments.map((d) => ({
                id: d.id,
                primary: d.name,
                secondary: d.code,
                employeeCount: d._count.employees
              }))}
              primaryField={{ key: "name", label: "Name", placeholder: "e.g. Engineering" }}
              secondaryField={{ key: "code", label: "Short code", placeholder: "ENG", mono: true, uppercase: true }}
              endpoint="/api/config/departments"
              showEmployeeCount
              onToast={addToast}
            />
          </Card>
        )}

        {activeTab === "designations" && (
          <Card
            title="Designations"
            description="Job titles used across employee profiles and onboarding documents."
          >
            <EntitySection
              noun="designation"
              items={designations.map((d) => ({
                id: d.id,
                primary: d.title,
                secondary: d.level ?? "",
                employeeCount: d._count.employees
              }))}
              primaryField={{ key: "title", label: "Title", placeholder: "e.g. Software Engineer" }}
              secondaryField={{ key: "level", label: "Level", placeholder: "e.g. L3, Senior", optional: true }}
              endpoint="/api/config/designations"
              showEmployeeCount
              onToast={addToast}
            />
          </Card>
        )}

        {activeTab === "locations" && (
          <Card
            title="Work Locations"
            description="Office, remote, and hybrid locations available for employee assignment."
          >
            <EntitySection
              noun="location"
              items={locations.map((l) => ({ id: l.id, primary: l.name, secondary: l.code }))}
              primaryField={{ key: "name", label: "Location name", placeholder: "e.g. Bangalore HQ" }}
              secondaryField={{ key: "code", label: "Short code", placeholder: "BLR", mono: true, uppercase: true }}
              endpoint="/api/config/locations"
              onToast={addToast}
            />
          </Card>
        )}

        {activeTab === "roles" && (
          <Card
            title="System Roles"
            description="Access levels built into the portal. Assign them to employees from the directory."
          >
            <RolesSection roleStats={roleStats} />
          </Card>
        )}

        {activeTab === "passwords" && <PasswordsSection employees={employees} />}
      </div>
    </>
  );
}
