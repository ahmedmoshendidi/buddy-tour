import React from 'react';
import { Progress } from '../ui/progress';
import { CheckCircle2 } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface CheckoutStepsProps {
  currentStep: number;
  steps: Step[];
}

export default function CheckoutSteps({ currentStep, steps }: CheckoutStepsProps) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="mb-8">
      <Progress value={progress} className="mb-6" />
      <div className="flex justify-between">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex flex-col items-center text-center ${
              step.id === currentStep
                ? 'text-primary'
                : step.id < currentStep
                ? 'text-green-600'
                : 'text-muted-foreground'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 border-2 ${
                step.id === currentStep
                  ? 'border-primary bg-primary/10'
                  : step.id < currentStep
                  ? 'border-green-600 bg-green-50'
                  : 'border-muted-foreground/30'
              }`}
            >
              {step.id < currentStep ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <span className="text-sm font-medium">{step.id}</span>
              )}
            </div>
            <div className="max-w-[120px]">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}