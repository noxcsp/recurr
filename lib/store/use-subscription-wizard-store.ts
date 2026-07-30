import { create } from "zustand"
import { type SubscriptionFormValues } from "@/lib/validations/subscription"

export interface WizardDraftData extends Partial<SubscriptionFormValues> {
  selectedServiceId?: string
  selectedPlanId?: string
  selectedTrialDurationId?: string
  isStartedToday?: boolean
}

interface SubscriptionWizardState {
  currentStep: number
  draftData: WizardDraftData
  isCalendarTriggered: boolean
  
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  updateDraft: (data: Partial<WizardDraftData>) => void
  resetWizard: (initialData?: Partial<WizardDraftData>, isCalendarTriggered?: boolean) => void
}

const INITIAL_DRAFT: WizardDraftData = {
  service_name: "",
  cost: 0,
  plan_type: "Monthly",
  payment_mode: "",
  next_due_date: undefined,
  is_trial: false,
  trial_end_date: undefined,
  subscription_status: "unpaid",
  selectedServiceId: undefined,
  selectedPlanId: undefined,
  selectedTrialDurationId: "none",
  isStartedToday: false,
}

export const useSubscriptionWizardStore = create<SubscriptionWizardState>((set, get) => ({
  currentStep: 1,
  draftData: INITIAL_DRAFT,
  isCalendarTriggered: false,

  setStep: (step: number) => set({ currentStep: step }),
  
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  
  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),

  updateDraft: (data: Partial<WizardDraftData>) =>
    set((state) => ({
      draftData: { ...state.draftData, ...data },
    })),

  resetWizard: (initialData?: Partial<WizardDraftData>, isCalendarTriggered = false) =>
    set({
      currentStep: 1,
      isCalendarTriggered,
      draftData: {
        ...INITIAL_DRAFT,
        ...initialData,
      },
    }),
}))
