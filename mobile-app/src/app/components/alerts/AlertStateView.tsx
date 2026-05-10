import { AlertTriangle, Info, LoaderCircle } from "lucide-react";

interface AlertStateViewProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  tone?: "default" | "error";
  isLoading?: boolean;
  compact?: boolean;
}

export function AlertStateView({
  title,
  description,
  actionLabel,
  onAction,
  tone = "default",
  isLoading = false,
  compact = false,
}: AlertStateViewProps) {
  const Icon = isLoading ? LoaderCircle : tone === "error" ? AlertTriangle : Info;

  return (
    <div
      className={`rounded-[26px] border ${
        tone === "error"
          ? "border-rose-200 bg-rose-50/80"
          : "border-dashed border-slate-200 bg-slate-50/80"
      } ${compact ? "p-4" : "p-6"} text-center`}
    >
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            tone === "error" ? "bg-rose-100 text-rose-600" : "bg-sky-100 text-sky-600"
          }`}
        >
          <Icon className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        {actionLabel && onAction && !isLoading ? (
          <button
            type="button"
            onClick={() => void onAction()}
            className={`mt-4 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg ${
              tone === "error" ? "bg-rose-600 shadow-rose-200" : "bg-sky-600 shadow-sky-200"
            }`}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
