import { ReactNode, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export interface WizardStep {
  key: string;
  title: string;
  description?: string;
  /** Render function for the step's body */
  render: () => ReactNode;
  /** Optional validator. Return null/true if valid, or a string error message */
  validate?: () => string | null | true | Promise<string | null | true>;
  /** Whether this step can be skipped */
  optional?: boolean;
}

interface StepperFormProps {
  steps: WizardStep[];
  onComplete: () => void | Promise<void>;
  onCancel?: () => void;
  onSaveDraft?: (state: Record<string, unknown>) => void;
  completeLabel?: string;
  initialStep?: number;
  className?: string;
}

/**
 * Generic stepper-form used by all 6 wizards.
 * Renders: step indicator at top, current step body, Back/Next/Save-Draft/Complete buttons at bottom.
 */
export function StepperForm({
  steps,
  onComplete,
  onCancel,
  onSaveDraft,
  completeLabel = 'إنشاء',
  initialStep = 0,
  className,
}: StepperFormProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;
  const step = steps[currentStep];

  const goNext = async () => {
    setError(null);
    if (step.validate) {
      const result = await step.validate();
      if (result && result !== true) {
        setError(typeof result === 'string' ? result : 'يوجد خطأ في هذه الخطوة');
        return;
      }
    }
    if (isLast) {
      setSubmitting(true);
      try { await onComplete(); } finally { setSubmitting(false); }
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const goBack = () => {
    setError(null);
    if (!isFirst) setCurrentStep(s => s - 1);
  };

  return (
    <div className={cn('space-y-4', className)} dir="rtl">
      {/* Step indicator */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {steps.map((s, i) => {
              const done = i < currentStep;
              const current = i === currentStep;
              return (
                <div key={s.key} className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => i < currentStep && setCurrentStep(i)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      current ? 'bg-[#1B2559] text-white' :
                      done ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer' :
                      'bg-gray-100 text-gray-500',
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-5 w-5 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>}
                    <span>{s.title}</span>
                  </button>
                  {i < steps.length - 1 && <ChevronLeft className="h-3 w-3 text-gray-300" />}
                </div>
              );
            })}
          </div>
          {step.description && (
            <p className="text-xs text-muted-foreground mt-3">{step.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Step body */}
      <Card>
        <CardContent className="p-6 min-h-[300px]">
          {step.render()}
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Footer with buttons */}
      <div className="flex items-center justify-between gap-2 sticky bottom-0 bg-white border-t border-gray-100 -mx-4 px-4 py-3">
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="h-9 text-sm">إلغاء</Button>
          )}
          {onSaveDraft && (
            <Button variant="ghost" onClick={() => onSaveDraft({})} className="h-9 text-sm gap-1.5 text-gray-600">
              <Save className="h-3.5 w-3.5" /> حفظ كمسودة
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goBack} disabled={isFirst} className="h-9 text-sm gap-1">
            <ChevronRight className="h-4 w-4" /> السابق
          </Button>
          <Button onClick={goNext} disabled={submitting} className="h-9 text-sm gap-1 bg-[#533afd] hover:bg-blue-600 text-white">
            {isLast ? (submitting ? 'جاري الإنشاء...' : completeLabel) : 'التالي'}
            {!isLast && <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
