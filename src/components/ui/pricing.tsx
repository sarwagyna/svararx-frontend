"use client";

import type { PricingPlanUi } from "@/lib/pricing-plans-ui";
import { formatInr } from "@/lib/subscription-plans";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { useRef, useState } from "react";

interface PricingProps {
  plans: PricingPlanUi[];
  title?: string;
  description?: string;
  currentPlanId?: string;
  onPlanSelect?: (planId: PricingPlanUi["id"]) => void;
}

export function Pricing({
  plans,
  title = "Simple, transparent pricing",
  description = "Choose the plan that fits your practice.\nAll paid plans include unlimited voice prescribing and branded PDF letterhead.",
  currentPlanId,
  onPlanSelect,
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const annualBtnRef = useRef<HTMLButtonElement>(null);

  const fireConfetti = () => {
    const el = annualBtnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    confetti({
      particleCount: 48,
      spread: 60,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      },
      colors: ["#9fe870", "#2ead4b", "#e2f6d5", "#0e0f0c"],
      ticks: 200,
      gravity: 1.2,
      decay: 0.94,
      startVelocity: 28,
      shapes: ["circle"],
    });
  };

  const selectAnnual = () => {
    if (isMonthly) fireConfetti();
    setIsMonthly(false);
  };

  return (
    <div className="w-full font-sans">
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-2xl lg:text-[32px] font-semibold text-ink tracking-tight leading-tight">
          {title}
        </h2>
        <p className="text-sm text-mute whitespace-pre-line max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex justify-center mb-10">
        <div className="inline-flex rounded-pill border border-ink/15 p-1 bg-canvas-soft shadow-sm">
          <button
            type="button"
            onClick={() => setIsMonthly(true)}
            className={cn(
              "rounded-pill px-5 py-2.5 text-sm font-semibold transition-colors",
              isMonthly ? "bg-ink text-green" : "text-body hover:text-ink"
            )}
          >
            Monthly
          </button>
          <button
            ref={annualBtnRef}
            type="button"
            onClick={selectAnnual}
            className={cn(
              "rounded-pill px-5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2",
              !isMonthly ? "bg-ink text-green" : "text-body hover:text-ink"
            )}
          >
            Annual
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-warning text-warning-content rounded-pill px-2 py-0.5">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch">
        {plans.map((plan, index) => {
          const isCurrent = currentPlanId === plan.id;
          const showAnnual = !isMonthly && plan.annualAvailable;
          const displayPrice = showAnnual ? Number(plan.yearlyPrice) : Number(plan.price);

          return (
            <motion.article
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.45,
                delay: index * 0.08,
                ease: "easeOut",
              }}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 lg:p-7 text-left transition-shadow",
                plan.isPopular
                  ? "border-positive/35 bg-green-pale/50 shadow-lg ring-1 ring-positive/15 md:-translate-y-2"
                  : "border-ink/10 bg-canvas shadow-sm hover:shadow-md",
                isCurrent && "ring-2 ring-positive"
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-pill bg-positive px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  Popular
                </div>
              )}

              <header className="mb-5 pt-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-mute">
                  {plan.name}
                </p>
                <div className="mt-4 flex items-end gap-1.5 flex-wrap">
                  <span className="text-3xl font-black tracking-tight text-ink leading-none tabular-nums">
                    <NumberFlow
                      value={displayPrice}
                      format={{
                        style: "currency",
                        currency: "INR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }}
                      transformTiming={{ duration: 450, easing: "ease-out" }}
                      willChange
                      className="font-sans"
                    />
                  </span>
                  <span className="text-sm font-semibold text-mute pb-0.5">
                    / {plan.period}
                  </span>
                </div>
                <p className="text-xs text-mute mt-2">
                  {showAnnual
                    ? "Billed annually · Solo plan only"
                    : isMonthly
                      ? "Billed monthly"
                      : "Monthly billing only"}
                </p>
                {showAnnual && (
                  <p className="text-xs font-semibold text-positive-deep mt-1">
                    vs {formatInr(Number(plan.price))}/mo on monthly Solo
                  </p>
                )}
              </header>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-pale">
                      <Check className="h-3 w-3 text-positive" strokeWidth={3} />
                    </span>
                    <span className="text-sm text-body leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <span className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold bg-canvas-soft text-mute border border-ink/10">
                  Current plan
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onPlanSelect?.(plan.id)}
                  className={cn(
                    "w-full rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors",
                    plan.isPopular
                      ? "bg-green text-ink hover:bg-green-hover shadow-sm"
                      : "bg-ink text-green hover:bg-ink/90"
                  )}
                >
                  {plan.buttonText}
                </button>
              )}

              <p className="mt-4 text-xs text-mute leading-relaxed border-t border-ink/10 pt-4">
                {plan.description}
              </p>
            </motion.article>
          );
        })}
      </div>

      {!isMonthly && (
        <p className="text-center text-sm text-body mt-6 max-w-xl mx-auto">
          Annual billing applies to <span className="font-semibold text-ink">Solo</span> only.
          Clinic and OPD remain on monthly plans.
        </p>
      )}
    </div>
  );
}
