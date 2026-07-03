import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { ticketsApi } from '../api/tickets';
import { usersApi } from '../api/users';
import type { Urgency } from '../types';

export default function CreateTicketPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('MEDIUM');

  // Guided Rubber Duck description segments
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [stepsTried, setStepsTried] = useState('');

  // Fetch areas for the selection dropdown
  const { data: areas, isLoading: areasLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: usersApi.getAreas,
    enabled: role === 'SYSADMIN',
  });

  // Client user's assigned areas
  const clientAreas = user?.profile?.areas || [];
  const availableAreas = role === 'SYSADMIN' ? areas || [] : clientAreas;

  // Set default area if available
  useState(() => {
    if (availableAreas.length > 0) {
      setSelectedAreaId(availableAreas[0].id);
    }
  });

  const createTicketMutation = useMutation({
    mutationFn: ticketsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      navigate(`/tickets/${data.id}`);
    },
  });

  const getCombinedDescription = () => {
    return `### 💡 Expected Behavior
${expectedBehavior}

### ⚠️ Actual Behavior
${actualBehavior}

### 🔧 What I've Tried So Far
${stepsTried}`;
  };

  const handleNextStep = () => {
    if (step === 1 && (!title.trim() || !selectedAreaId)) return;
    if (step === 2 && (!expectedBehavior.trim() || !actualBehavior.trim())) return;
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createTicketMutation.isPending) return;

    createTicketMutation.mutate({
      title,
      description: getCombinedDescription(),
      urgency,
      source_area_id: selectedAreaId,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Create New Ticket</h1>
        <p className="text-text-secondary mt-1">Let&apos;s guide you through describing the issue step-by-step.</p>
      </div>

      {/* Progress Wizard Header */}
      <div className="glass-card p-6 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <WizardStepNum num={1} active={step >= 1} label="Context" />
          <div className={`h-[2px] flex-1 rounded ${step >= 2 ? 'bg-teal' : 'bg-border'}`} />
          <WizardStepNum num={2} active={step >= 2} label="Explain" />
          <div className={`h-[2px] flex-1 rounded ${step >= 3 ? 'bg-teal' : 'bg-border'}`} />
          <WizardStepNum num={3} active={step >= 3} label="Urgency" />
          <div className={`h-[2px] flex-1 rounded ${step >= 4 ? 'bg-teal' : 'bg-border'}`} />
          <WizardStepNum num={4} active={step >= 4} label="Confirm" />
        </div>
      </div>

      {/* Wizard Step Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Rubber Duck Mascot Panel (Left Side on larger screens) */}
        <div className="md:col-span-4 glass-card p-6 flex flex-col items-center text-center space-y-4 bg-gradient-to-b from-teal/15 to-transparent">
          <div className="w-20 h-20 rounded-full bg-teal/20 flex items-center justify-center animate-float border border-teal/20">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-teal-glow">
              <path
                d="M19.5 10.5c0-1.5-.5-3-1.5-4-1-1-2.5-2-4.5-2.5-.5-1.5-2-2.5-3.5-2.5-2 0-3.5 1.5-3.5 3.5 0 .3 0 .7.1 1C4.5 7 3 9 3 11.5c0 3 2 5.5 5 6.5v2c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-2c2.5-.8 4-3 4-5.5h-.5z"
                fill="currentColor"
                opacity="0.9"
              />
              <circle cx="8.5" cy="9" r="1" fill="#0B0F12" />
              <path d="M12 11.5c.8 0 1.5.3 2 .8" stroke="#F2A900" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary">Quack!</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              {getMascotSpeech(step)}
            </p>
          </div>
        </div>

        {/* Wizard Form panel (Right Side) */}
        <div className="md:col-span-8 glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Context (Title and Area) */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-lg font-semibold text-text-primary">Issue Context</h3>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Select Department / Area
                  </label>
                  {areasLoading ? (
                    <div className="h-11 bg-obsidian border border-border rounded-xl animate-pulse" />
                  ) : (
                    <select
                      value={selectedAreaId}
                      onChange={(e) => setSelectedAreaId(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm cursor-pointer"
                    >
                      <option value="" disabled>Choose department...</option>
                      {availableAreas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Ticket Title (Summary)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., VPN connection drops frequently"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm"
                  />
                  <p className="text-xs text-text-muted mt-1">Keep it short and descriptive.</p>
                </div>
              </div>
            )}

            {/* Step 2: Rubber Duck Debugging guided explanation */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-lg font-semibold text-text-primary">Explain the issue</h3>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    What was supposed to happen? (Expected)
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g., The VPN should stay connected while I am working..."
                    value={expectedBehavior}
                    onChange={(e) => setExpectedBehavior(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    What actually happened? (Actual)
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g., The connection drops every 15 minutes, with error code 102..."
                    value={actualBehavior}
                    onChange={(e) => setActualBehavior(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    What steps have you tried to fix it? (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Restarted the router, reinstalled the VPN client..."
                    value={stepsTried}
                    onChange={(e) => setStepsTried(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Urgency selection */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-lg font-semibold text-text-primary">Set Urgency</h3>
                <p className="text-sm text-text-secondary">How critical is this issue to your ability to work?</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <UrgencySelector
                    val="LOW"
                    title="Low Urgency"
                    desc="Non-blocking. I can still complete my daily tasks."
                    selected={urgency === 'LOW'}
                    onClick={() => setUrgency('LOW')}
                  />
                  <UrgencySelector
                    val="MEDIUM"
                    title="Medium Urgency"
                    desc="Partially blocking, but I have a workaround."
                    selected={urgency === 'MEDIUM'}
                    onClick={() => setUrgency('MEDIUM')}
                  />
                  <UrgencySelector
                    val="HIGH"
                    title="High Urgency"
                    desc="Completely blocked. No work can be completed."
                    selected={urgency === 'HIGH'}
                    onClick={() => setUrgency('HIGH')}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Confirmation review */}
            {step === 4 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-lg font-semibold text-text-primary">Review Details</h3>

                <div className="p-5 bg-obsidian rounded-xl border border-border space-y-4 text-sm">
                  <div>
                    <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold">Title</span>
                    <p className="text-text-primary font-medium mt-0.5">{title}</p>
                  </div>
                  <div>
                    <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold">Department</span>
                    <p className="text-text-primary font-medium mt-0.5">
                      {availableAreas.find((a) => a.id === selectedAreaId)?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold">Urgency</span>
                    <span className="inline-block mt-1 px-3 py-1 font-semibold rounded-full border bg-teal/20 text-teal-glow border-teal/30 text-xs">
                      {urgency}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold">Explanation Details</span>
                    <div className="mt-1.5 p-3.5 bg-surface/30 border border-border/50 rounded-lg space-y-2 text-text-secondary text-xs font-mono whitespace-pre-wrap">
                      {getCombinedDescription()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error notifications */}
            {createTicketMutation.isError && (
              <div className="p-4 rounded-xl bg-urgency-high/10 border border-urgency-high/20 text-urgency-high text-sm">
                Failed to create ticket. Please check all fields and try again.
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-border/50">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover text-text-primary font-semibold rounded-xl transition-all"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={
                    (step === 1 && (!title.trim() || !selectedAreaId)) ||
                    (step === 2 && (!expectedBehavior.trim() || !actualBehavior.trim()))
                  }
                  className="px-6 py-2.5 bg-teal hover:bg-teal-light text-white font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[var(--shadow-glow-teal)]"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="px-6 py-2.5 bg-teal hover:bg-teal-light text-white font-semibold rounded-xl transition-all disabled:opacity-40 hover:shadow-[var(--shadow-glow-teal)]"
                >
                  {createTicketMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Guided Mascot Dialog Helper ──

function getMascotSpeech(step: number): string {
  switch (step) {
    case 1:
      return 'Quack! Let&apos;s start by giving the issue a quick summary title and telling me which department is handling this context.';
    case 2:
      return 'Now, walk me through the problem step-by-step. What was supposed to happen, what actually happened, and what did you try? Take your time, explaining it helps me find the issue!';
    case 3:
      return 'Let me know how urgent this is so my IT team can triage this task appropriately. Be honest, I am here to help!';
    case 4:
      return 'Everything looks set in place! Review your inputs carefully and hit submit. I will deliver this right into our tracking queue.';
    default:
      return 'Quack!';
  }
}

// ── Subcomponents ──

interface WizardStepNumProps {
  num: number;
  active: boolean;
  label: string;
}

function WizardStepNum({ num, active, label }: WizardStepNumProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-[var(--transition-fast)] ${
          active
            ? 'bg-teal border-teal text-white shadow-[var(--shadow-glow-teal)]'
            : 'bg-obsidian border-border text-text-muted'
        }`}
      >
        {num}
      </div>
      <span className={`text-[10px] uppercase tracking-wider font-semibold ${active ? 'text-teal-glow' : 'text-text-muted'}`}>
        {label}
      </span>
    </div>
  );
}

interface UrgencySelectorProps {
  val: Urgency;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}

function UrgencySelector({ title, desc, selected, onClick }: UrgencySelectorProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 text-left border rounded-xl transition-all cursor-pointer h-full flex flex-col justify-between ${
        selected
          ? 'bg-teal/15 border-teal text-teal-glow shadow-[var(--shadow-glow-teal)]'
          : 'bg-obsidian border-border text-text-secondary hover:bg-surface-hover/30 hover:border-border-light'
      }`}
    >
      <div>
        <p className="font-semibold text-sm text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary mt-1 leading-normal">{desc}</p>
      </div>
    </button>
  );
}
