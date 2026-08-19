import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ticketsApi } from '../api/tickets';
import { usersApi } from '../api/users';
import TicketTypeBadge from '../components/TicketTypeBadge';
import type { TicketType, Urgency } from '../types';

interface ImageAttachmentPreview {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
}

export default function CreateTicketPage() {
  const { user, role } = useAuth();
  const { t } = useTranslation(['tickets', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<number>(1);
  const [ticketType, setTicketType] = useState<TicketType>('BUG');
  const [title, setTitle] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('MEDIUM');

  // Guided Bug description segments
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [stepsTried, setStepsTried] = useState('');

  // Guided Feature description segments
  const [featureGoal, setFeatureGoal] = useState('');
  const [useCase, setUseCase] = useState('');
  const [featureDetails, setFeatureDetails] = useState('');

  // Attached screenshots / images
  const [images, setImages] = useState<ImageAttachmentPreview[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all areas for SYSADMIN and RESOLVER roles
  const canChooseAnyArea = role === 'SYSADMIN' || role === 'RESOLVER';
  const { data: areas, isLoading: areasLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: usersApi.getAreas,
    enabled: canChooseAnyArea,
  });

  // Client user's assigned areas vs full area catalog for staff
  const clientAreas = user?.profile?.areas || [];
  const availableAreas = canChooseAnyArea ? areas || [] : clientAreas;

  // Set default area when available
  useEffect(() => {
    if (!selectedAreaId && availableAreas.length > 0) {
      setSelectedAreaId(availableAreas[0].id);
    }
  }, [availableAreas, selectedAreaId]);

  // Handle image files added (via file picker, drag & drop, or clipboard paste)
  const processFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setImages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name || `screenshot_${prev.length + 1}.png`,
              size: file.size,
              dataUrl,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // Clipboard paste listener for instant screenshots (Ctrl+V)
  useEffect(() => {
    if (step !== 2) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }
      if (pastedFiles.length > 0) {
        processFiles(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [step, processFiles]);

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const createTicketMutation = useMutation({
    mutationFn: ticketsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      navigate(`/tickets/${data.id}`);
    },
  });

  const getCombinedDescription = () => {
    if (ticketType === 'BUG') {
      return `${t('tickets:wizard.expected_md_header')}
${expectedBehavior}

${t('tickets:wizard.actual_md_header')}
${actualBehavior}
${stepsTried.trim() ? `\n${t('tickets:wizard.tried_md_header')}\n${stepsTried}` : ''}`;
    }

    return `${t('tickets:wizard.goal_md_header')}
${featureGoal}

${t('tickets:wizard.use_case_md_header')}
${useCase}
${featureDetails.trim() ? `\n${t('tickets:wizard.feature_details_md_header')}\n${featureDetails}` : ''}`;
  };

  const isStep1Valid = Boolean(title.trim() && selectedAreaId);
  const isStep2Valid =
    ticketType === 'BUG'
      ? Boolean(expectedBehavior.trim() && actualBehavior.trim())
      : Boolean(featureGoal.trim() && useCase.trim());

  const handleNextStep = () => {
    if (step === 1 && !isStep1Valid) return;
    if (step === 2 && !isStep2Valid) return;
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
      ticket_type: ticketType,
      description: getCombinedDescription(),
      urgency,
      source_area_id: selectedAreaId,
      uploaded_images: images.map((img) => img.dataUrl),
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">{t('tickets:create_title')}</h1>
        <p className="text-text-secondary mt-1">{t('tickets:create_subtitle')}</p>
      </div>

      {/* Progress Wizard Header */}
      <div className="glass-card p-6 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <WizardStepNum num={1} active={step >= 1} label={t('tickets:wizard.step_context')} />
          <div className={`h-[2px] flex-1 rounded ${step >= 2 ? 'bg-teal' : 'bg-border'}`} />
          <WizardStepNum num={2} active={step >= 2} label={t('tickets:wizard.step_explain')} />
          <div className={`h-[2px] flex-1 rounded ${step >= 3 ? 'bg-teal' : 'bg-border'}`} />
          <WizardStepNum num={3} active={step >= 3} label={t('tickets:wizard.step_urgency')} />
          <div className={`h-[2px] flex-1 rounded ${step >= 4 ? 'bg-teal' : 'bg-border'}`} />
          <WizardStepNum num={4} active={step >= 4} label={t('tickets:wizard.step_confirm')} />
        </div>
      </div>

      {/* Wizard Step Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Rubber Duck Mascot Panel */}
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
            <h4 className="font-semibold text-text-primary">{t('tickets:wizard.mascot_quack')}</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              {getMascotSpeech(step, ticketType, t)}
            </p>
          </div>
        </div>

        {/* Wizard Form panel */}
        <div className="md:col-span-8 glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Context (Type, Area, Title) */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-lg font-semibold text-text-primary">{t('tickets:wizard.context_heading')}</h3>

                {/* Ticket Type Selector (Bug vs Feature) */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('tickets:wizard.select_type_label')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTicketType('BUG')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        ticketType === 'BUG'
                          ? 'bg-rose-500/15 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)] text-rose-300'
                          : 'bg-obsidian border-border text-text-secondary hover:border-border-light hover:bg-surface-hover/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🐞</span>
                        <p className="font-bold text-sm text-text-primary">{t('tickets:wizard.type_bug_title')}</p>
                      </div>
                      <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                        {t('tickets:wizard.type_bug_desc')}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTicketType('FEATURE')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        ticketType === 'FEATURE'
                          ? 'bg-indigo-500/15 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)] text-indigo-300'
                          : 'bg-obsidian border-border text-text-secondary hover:border-border-light hover:bg-surface-hover/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">✨</span>
                        <p className="font-bold text-sm text-text-primary">{t('tickets:wizard.type_feature_title')}</p>
                      </div>
                      <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                        {t('tickets:wizard.type_feature_desc')}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Department Selector */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('tickets:wizard.select_dept_label')}
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
                      <option value="" disabled>{t('tickets:wizard.choose_dept_placeholder')}</option>
                      {availableAreas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('tickets:wizard.title_label')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      ticketType === 'BUG'
                        ? t('tickets:wizard.title_placeholder_bug')
                        : t('tickets:wizard.title_placeholder_feature')
                    }
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm"
                  />
                  <p className="text-xs text-text-muted mt-1">{t('tickets:wizard.title_hint')}</p>
                </div>
              </div>
            )}

            {/* Step 2: Tailored explanation + Screenshots */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">
                    {ticketType === 'BUG'
                      ? t('tickets:wizard.explain_heading_bug')
                      : t('tickets:wizard.explain_heading_feature')}
                  </h3>
                  <TicketTypeBadge type={ticketType} />
                </div>

                {ticketType === 'BUG' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        {t('tickets:wizard.expected_label')}
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder={t('tickets:wizard.expected_placeholder')}
                        value={expectedBehavior}
                        onChange={(e) => setExpectedBehavior(e.target.value)}
                        className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        {t('tickets:wizard.actual_label')}
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder={t('tickets:wizard.actual_placeholder')}
                        value={actualBehavior}
                        onChange={(e) => setActualBehavior(e.target.value)}
                        className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        {t('tickets:wizard.tried_label')}
                      </label>
                      <textarea
                        rows={2}
                        placeholder={t('tickets:wizard.tried_placeholder')}
                        value={stepsTried}
                        onChange={(e) => setStepsTried(e.target.value)}
                        className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm resize-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        {t('tickets:wizard.goal_label')}
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder={t('tickets:wizard.goal_placeholder')}
                        value={featureGoal}
                        onChange={(e) => setFeatureGoal(e.target.value)}
                        className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        {t('tickets:wizard.use_case_label')}
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder={t('tickets:wizard.use_case_placeholder')}
                        value={useCase}
                        onChange={(e) => setUseCase(e.target.value)}
                        className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        {t('tickets:wizard.feature_details_label')}
                      </label>
                      <textarea
                        rows={2}
                        placeholder={t('tickets:wizard.feature_details_placeholder')}
                        value={featureDetails}
                        onChange={(e) => setFeatureDetails(e.target.value)}
                        className="w-full px-4 py-3 bg-obsidian border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-teal focus:ring-1 focus:ring-teal/50 transition-all outline-none text-sm resize-none"
                      />
                    </div>
                  </>
                )}

                {/* Screenshots & Images Uploader Box */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-text-secondary">
                      {t('tickets:wizard.attachments_heading')}
                    </label>
                    <span className="text-xs px-2 py-0.5 rounded bg-surface/50 text-text-muted">
                      {t('tickets:wizard.paste_shortcut')}
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        processFiles(e.target.files);
                      }
                      e.target.value = '';
                    }}
                  />

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files) {
                        processFiles(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-teal bg-teal/10 scale-[1.01]'
                        : 'border-border hover:border-teal/50 bg-obsidian/60 hover:bg-surface/20'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-teal/15 flex items-center justify-center text-teal-glow mb-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <p className="text-xs text-text-primary font-medium">
                      {t('tickets:wizard.attachments_hint')}
                    </p>
                  </div>

                  {/* Thumbnails grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      {images.map((img) => (
                        <div
                          key={img.id}
                          className="relative group rounded-lg overflow-hidden border border-border bg-obsidian aspect-video flex items-center justify-center"
                        >
                          <img
                            src={img.dataUrl}
                            alt={img.name}
                            onClick={() => setPreviewImage(img.dataUrl)}
                            className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(img.id)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-obsidian/80 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition-colors shadow"
                            title={t('tickets:wizard.remove_attachment')}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Urgency selection */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-lg font-semibold text-text-primary">{t('tickets:wizard.urgency_heading')}</h3>
                <p className="text-sm text-text-secondary">{t('tickets:wizard.urgency_question')}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <UrgencySelector
                    val="LOW"
                    title={t('tickets:wizard.urgency_low_title')}
                    desc={t('tickets:wizard.urgency_low_desc')}
                    selected={urgency === 'LOW'}
                    onClick={() => setUrgency('LOW')}
                  />
                  <UrgencySelector
                    val="MEDIUM"
                    title={t('tickets:wizard.urgency_med_title')}
                    desc={t('tickets:wizard.urgency_med_desc')}
                    selected={urgency === 'MEDIUM'}
                    onClick={() => setUrgency('MEDIUM')}
                  />
                  <UrgencySelector
                    val="HIGH"
                    title={t('tickets:wizard.urgency_high_title')}
                    desc={t('tickets:wizard.urgency_high_desc')}
                    selected={urgency === 'HIGH'}
                    onClick={() => setUrgency('HIGH')}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Confirmation review */}
            {step === 4 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-lg font-semibold text-text-primary">{t('tickets:wizard.review_heading')}</h3>

                <div className="p-5 bg-obsidian rounded-xl border border-border space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold">{t('tickets:wizard.review_type')}</span>
                      <div className="mt-1">
                        <TicketTypeBadge type={ticketType} size="md" />
                      </div>
                    </div>
                    <div>
                      <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold">{t('tickets:wizard.review_urgency')}</span>
                      <span className="inline-block mt-1 px-3 py-1 font-semibold rounded-full border bg-teal/20 text-teal-glow border-teal/30 text-xs">
                        {t(`tickets:urgency.${urgency}`)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold">{t('tickets:wizard.review_title')}</span>
                    <p className="text-text-primary font-medium mt-0.5">{title}</p>
                  </div>

                  <div>
                    <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold">{t('tickets:wizard.review_dept')}</span>
                    <p className="text-text-primary font-medium mt-0.5">
                      {availableAreas.find((a) => a.id === selectedAreaId)?.name || 'Unknown'}
                    </p>
                  </div>

                  <div>
                    <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold">{t('tickets:wizard.review_explanation')}</span>
                    <div className="mt-1.5 p-3.5 bg-surface/30 border border-border/50 rounded-lg space-y-2 text-text-secondary text-xs font-mono whitespace-pre-wrap">
                      {getCombinedDescription()}
                    </div>
                  </div>

                  {images.length > 0 && (
                    <div>
                      <span className="text-text-muted block text-xs uppercase tracking-wider font-semibold mb-2">
                        {t('tickets:wizard.review_attachments')} ({images.length})
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {images.map((img) => (
                          <div
                            key={img.id}
                            onClick={() => setPreviewImage(img.dataUrl)}
                            className="rounded-lg overflow-hidden border border-border aspect-video cursor-pointer hover:border-teal transition-colors"
                          >
                            <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error notifications */}
            {createTicketMutation.isError && (
              <div className="p-4 rounded-xl bg-urgency-high/10 border border-urgency-high/20 text-urgency-high text-sm">
                {t('tickets:wizard.create_error')}
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
                  {t('common:actions.back')}
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
                  className="px-6 py-2.5 bg-teal hover:bg-teal-light text-white font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[var(--shadow-glow-teal)]"
                >
                  {t('common:actions.continue')}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="px-6 py-2.5 bg-teal hover:bg-teal-light text-white font-semibold rounded-xl transition-all disabled:opacity-40 hover:shadow-[var(--shadow-glow-teal)]"
                >
                  {createTicketMutation.isPending ? t('common:actions.submitting') : t('tickets:create_ticket')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImage} alt="Attachment Preview" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-border" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-obsidian border border-border text-white flex items-center justify-center text-sm font-bold shadow-lg hover:bg-surface"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Guided Mascot Dialog Helper ──

function getMascotSpeech(step: number, type: TicketType, t: (key: string) => string): string {
  switch (step) {
    case 1:
      return type === 'BUG' ? t('tickets:wizard.speech_step1_bug') : t('tickets:wizard.speech_step1_feature');
    case 2:
      return type === 'BUG' ? t('tickets:wizard.speech_step2_bug') : t('tickets:wizard.speech_step2_feature');
    case 3:
      return t('tickets:wizard.speech_step3');
    case 4:
      return t('tickets:wizard.speech_step4');
    default:
      return t('tickets:wizard.mascot_quack');
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
