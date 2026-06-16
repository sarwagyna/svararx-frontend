"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import {
  Building2,
  Check,
  FileText,
  HelpCircle,
  LayoutGrid,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { SUPPORT_EMAIL } from "@/lib/support";

export type OnboardingStepConfig = {
  id: number;
  stepLabel: string;
  title: string;
  description?: string;
  icon: LucideIcon;
};

export const SOLO_ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 1,
    stepLabel: "STEP 1",
    title: "Your profile",
    description: "Name, qualifications & registration",
    icon: User,
  },
  {
    id: 2,
    stepLabel: "STEP 2",
    title: "Ready to prescribe",
    description: "Optional branding & PIN",
    icon: FileText,
  },
];

export const CLINIC_ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 1,
    stepLabel: "STEP 1",
    title: "Your profile",
    description: "Name, qualifications & registration",
    icon: User,
  },
  {
    id: 2,
    stepLabel: "STEP 2",
    title: "Clinic details",
    description: "Address shown on every Rx",
    icon: Building2,
  },
  {
    id: 3,
    stepLabel: "STEP 3",
    title: "Letterhead",
    description: "Logo, signature & preview",
    icon: LayoutGrid,
  },
  {
    id: 4,
    stepLabel: "STEP 4",
    title: "Security & voice",
    description: "Approval PIN & calibration",
    icon: Shield,
  },
];

type StepStatus = "completed" | "active" | "pending";

function getStepStatus(
  stepId: number,
  currentStep: number,
  savedStep: number
): StepStatus {
  if (stepId === currentStep) return "active";
  if (savedStep >= stepId) return "completed";
  return "pending";
}

function statusBadge(status: StepStatus): string | null {
  if (status === "completed") return "Completed";
  if (status === "active") return "In progress";
  return "Pending";
}

function StepNode({
  step,
  status,
  isLast,
  onClick,
  clickable,
}: {
  step: OnboardingStepConfig;
  status: StepStatus;
  isLast: boolean;
  onClick?: () => void;
  clickable: boolean;
}) {
  const Icon = step.icon;
  const badge = statusBadge(status);

  return (
    <li className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={onClick}
          disabled={!clickable}
          className={clsx(
            "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            status === "completed" &&
              "border-positive bg-positive text-white",
            status === "active" &&
              "border-positive bg-green text-ink shadow-md ring-4 ring-green-pale",
            status === "pending" &&
              "border-ink/15 bg-canvas-soft text-mute",
            clickable && "cursor-pointer hover:scale-105",
            !clickable && "cursor-default"
          )}
          aria-current={status === "active" ? "step" : undefined}
        >
          {status === "completed" ? (
            <Check className="h-5 w-5" strokeWidth={2.5} />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </button>
        {!isLast && (
          <div
            className={clsx(
              "w-0.5 flex-1 min-h-[2.5rem] my-1 rounded-full",
              status === "completed" ? "bg-positive" : "bg-ink/15"
            )}
          />
        )}
      </div>

      <div className={clsx("pb-8 min-w-0 flex-1", isLast && "pb-2")}>
        <button
          type="button"
          onClick={onClick}
          disabled={!clickable}
          className={clsx(
            "text-left w-full",
            clickable ? "cursor-pointer" : "cursor-default"
          )}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mute">
              {step.stepLabel}
            </p>
            {badge && (
              <span
                className={clsx(
                  "text-[10px] font-semibold uppercase tracking-wide rounded-pill px-2 py-0.5",
                  status === "completed" && "bg-green-pale text-positive-deep",
                  status === "active" && "bg-green text-ink",
                  status === "pending" && "bg-canvas-soft text-mute"
                )}
              >
                {badge}
              </span>
            )}
          </div>
          <p
            className={clsx(
              "font-bold mt-0.5",
              status === "active" ? "text-ink text-base" : "text-body text-sm",
              status === "pending" && "text-mute"
            )}
          >
            {step.title}
          </p>
          {step.description && status === "active" && (
            <p className="text-xs text-body mt-1 leading-relaxed">{step.description}</p>
          )}
        </button>
      </div>
    </li>
  );
}

function HorizontalStepStrip({
  steps,
  currentStep,
  savedStep,
  onStepClick,
}: {
  steps: OnboardingStepConfig[];
  currentStep: number;
  savedStep: number;
  onStepClick?: (step: number) => void;
}) {
  const maxReachable = Math.min(savedStep + 1, steps.length);

  return (
    <div className="lg:hidden overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex min-w-max gap-2">
        {steps.map((step) => {
          const status = getStepStatus(step.id, currentStep, savedStep);
          const clickable = step.id <= maxReachable && !!onStepClick;
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(step.id)}
              className={clsx(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors shrink-0",
                status === "active"
                  ? "border-positive/40 bg-green-pale/60"
                  : "border-ink/10 bg-canvas",
                clickable && "hover:border-positive/30",
                !clickable && "opacity-60"
              )}
            >
              <span
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
                  status === "completed" && "bg-positive text-white",
                  status === "active" && "bg-green text-ink",
                  status === "pending" && "bg-canvas-soft text-mute"
                )}
              >
                {status === "completed" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </span>
              <div>
                <p className="text-[10px] font-bold text-mute uppercase">{step.stepLabel}</p>
                <p className="text-xs font-semibold text-ink whitespace-nowrap">{step.title}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OnboardingStepper({
  steps,
  currentStep,
  savedStep,
  onStepClick,
  practiceLabel,
}: {
  steps: OnboardingStepConfig[];
  currentStep: number;
  savedStep: number;
  onStepClick?: (step: number) => void;
  practiceLabel?: string;
}) {
  const maxReachable = Math.min(savedStep + 1, steps.length);
  const progressPct = Math.round((currentStep / steps.length) * 100);

  return (
    <div className="space-y-6">
      <div className="hidden lg:block">
        <BrandLogo variant="sidebar" href="/" showTagline />
        {practiceLabel && (
          <p className="text-xs text-body mt-4 leading-relaxed">{practiceLabel}</p>
        )}
      </div>

      <HorizontalStepStrip
        steps={steps}
        currentStep={currentStep}
        savedStep={savedStep}
        onStepClick={onStepClick}
      />

      <aside className="hidden lg:flex flex-col rounded-2xl border border-ink/10 bg-canvas shadow-sm overflow-hidden min-h-[32rem]">
        <div className="relative flex-1 p-6 pb-4">
          <div
            className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 opacity-40"
            aria-hidden
            style={{
              background:
                "radial-gradient(circle at 100% 100%, #e2f6d5 0%, transparent 70%)",
            }}
          />
          <ol className="relative space-y-0">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id, currentStep, savedStep);
              const clickable = step.id <= maxReachable && !!onStepClick;

              return (
                <StepNode
                  key={step.id}
                  step={step}
                  status={status}
                  isLast={index === steps.length - 1}
                  clickable={clickable}
                  onClick={clickable ? () => onStepClick?.(step.id) : undefined}
                />
              );
            })}
          </ol>
        </div>

        <div className="border-t border-ink/10 p-4">
          <div className="flex items-start gap-3 rounded-xl bg-canvas-soft p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-pale text-positive">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Having trouble?</p>
              <p className="text-xs text-body mt-0.5">
                <Link
                  href="/support"
                  className="text-positive font-semibold hover:underline"
                >
                  Visit support
                </Link>
                {" · "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-positive font-semibold hover:underline"
                >
                  Email us
                </a>
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:hidden space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-mute">
          <span>
            STEP {currentStep} / {steps.length}
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-canvas-soft overflow-hidden">
          <div
            className="h-full rounded-full bg-positive transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function OnboardingContentCard({
  stepLabel,
  title,
  subtitle,
  children,
}: {
  stepLabel?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-canvas rounded-2xl border border-ink/10 p-6 lg:p-8 shadow-sm">
      {stepLabel && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-mute mb-2">
          {stepLabel}
        </p>
      )}
      <h1 className="text-2xl lg:text-[28px] font-semibold text-ink tracking-tight mb-2">
        {title}
      </h1>
      {subtitle && <p className="text-base text-body mb-6">{subtitle}</p>}
      {children}
    </div>
  );
}
