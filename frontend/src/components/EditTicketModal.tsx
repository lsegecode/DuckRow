/**
 * EditTicketModal — Modal allowing the ticket creator, assigned resolver,
 * or sysadmin to edit the ticket details and add more context:
 * - Title, Urgency, Ticket Type
 * - Description (full markdown / structured context)
 * - Attach new screenshots (file picker, drag & drop, clipboard paste Ctrl+V)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Ticket, TicketType, Urgency } from '../types';

interface ImageAttachmentPreview {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
}

interface EditTicketModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    ticket_type: TicketType;
    urgency: Urgency;
    description: string;
    uploaded_images?: string[];
  }) => void;
  isPending: boolean;
}

export default function EditTicketModal({
  ticket,
  isOpen,
  onClose,
  onSave,
  isPending,
}: EditTicketModalProps) {
  const { t } = useTranslation(['tickets', 'common']);

  const [title, setTitle] = useState(ticket.title);
  const [ticketType, setTicketType] = useState<TicketType>(ticket.ticket_type || 'BUG');
  const [urgency, setUrgency] = useState<Urgency>(ticket.urgency || 'MEDIUM');
  const [description, setDescription] = useState(ticket.description || '');
  const [newImages, setNewImages] = useState<ImageAttachmentPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or ticket changes
  useEffect(() => {
    if (isOpen) {
      setTitle(ticket.title);
      setTicketType(ticket.ticket_type || 'BUG');
      setUrgency(ticket.urgency || 'MEDIUM');
      setDescription(ticket.description || '');
      setNewImages([]);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen, ticket]);

  // Handle closing animation
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Process selected or pasted images
  const processFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setNewImages((prev) => [
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

  // Listen for Ctrl+V image pastes while modal is open
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, processFiles]);

  const removeNewImage = (id: string) => {
    setNewImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleAppendSection = (header: string, defaultText: string) => {
    const separator = description.trim() ? '\n\n' : '';
    setDescription((prev) => `${prev.trim()}${separator}### ${header}\n${defaultText}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isPending) return;

    onSave({
      title: title.trim(),
      ticket_type: ticketType,
      urgency,
      description: description.trim(),
      uploaded_images: newImages.map((img) => img.dataUrl),
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      style={{
        background: 'rgba(11, 15, 18, 0.82)',
        backdropFilter: 'blur(8px)',
        transition: 'opacity 200ms ease',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        style={{
          transition: 'opacity 220ms ease, transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
        }}
        className="w-full max-w-2xl bg-obsidian-light border border-border/80 rounded-2xl shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between shrink-0 bg-surface/30">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-teal/15 text-teal-glow flex items-center justify-center text-sm font-bold border border-teal/20">
              ✏️
            </span>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                {t('tickets:detail.edit_modal_title', 'Editar Ticket / Agregar Contexto')}
              </h2>
              <p className="text-xs text-text-muted">
                {t('tickets:detail.edit_modal_subtitle', 'Agrega más contexto, modifica la descripción o adjunta capturas')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-surface hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-text-primary transition-all text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} id="edit-ticket-form" className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              {t('tickets:table.title', 'Título del Ticket')} <span className="text-urgency-high">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('tickets:wizard.title_hint', 'Título claro y descriptivo')}
              className="w-full px-3.5 py-2.5 bg-obsidian border border-border rounded-xl text-text-primary text-sm focus:border-teal outline-none transition-colors"
            />
          </div>

          {/* Type & Urgency Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ticket Type */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                {t('tickets:table.type', 'Tipo')}
              </label>
              <select
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value as TicketType)}
                className="w-full px-3.5 py-2 bg-obsidian border border-border rounded-xl text-text-primary text-sm focus:border-teal outline-none cursor-pointer"
              >
                <option value="BUG">🐛 {t('tickets:type.BUG', 'Bug / Error')}</option>
                <option value="FEATURE">🚀 {t('tickets:type.FEATURE', 'Funcionalidad')}</option>
              </select>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                {t('tickets:table.urgency', 'Urgencia')}
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Urgency)}
                className="w-full px-3.5 py-2 bg-obsidian border border-border rounded-xl text-text-primary text-sm focus:border-teal outline-none cursor-pointer"
              >
                <option value="LOW">{t('tickets:urgency.LOW', 'Baja')}</option>
                <option value="MEDIUM">{t('tickets:urgency.MEDIUM', 'Media')}</option>
                <option value="HIGH">{t('tickets:urgency.HIGH', 'Alta')}</option>
              </select>
            </div>
          </div>

          {/* Description & Quick Section Helpers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {t('tickets:detail.description_heading', 'Descripción y Contexto')}
              </label>
              <span className="text-[11px] text-text-muted font-sans">
                {t('tickets:wizard.paste_shortcut', 'Soporta Markdown')}
              </span>
            </div>

            {/* Quick Helper Pills to add more context sections */}
            <div className="flex flex-wrap items-center gap-1.5 py-1">
              <span className="text-[11px] text-text-muted mr-1">Insertar sección:</span>
              <button
                type="button"
                onClick={() => handleAppendSection('💡 Información Adicional', 'Detalles extra para el equipo...')}
                className="px-2 py-0.5 rounded-lg bg-surface hover:bg-teal/15 hover:text-teal-glow text-text-secondary text-[11px] font-medium border border-border transition-colors cursor-pointer"
              >
                + Info adicional
              </button>
              <button
                type="button"
                onClick={() => handleAppendSection('⚠️ Pasos para reproducir', '1. Ir a...\n2. Hacer clic en...\n3. Ocurre error...')}
                className="px-2 py-0.5 rounded-lg bg-surface hover:bg-amber-500/15 hover:text-amber-300 text-text-secondary text-[11px] font-medium border border-border transition-colors cursor-pointer"
              >
                + Pasos a reproducir
              </button>
              <button
                type="button"
                onClick={() => handleAppendSection('🔧 Notas técnicas', 'Contexto técnico o hallazgos preliminares...')}
                className="px-2 py-0.5 rounded-lg bg-surface hover:bg-indigo-500/15 hover:text-indigo-300 text-text-secondary text-[11px] font-medium border border-border transition-colors cursor-pointer"
              >
                + Notas técnicas
              </button>
            </div>

            <textarea
              rows={7}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('tickets:detail.description_placeholder', 'Escribe o amplía la información del ticket...')}
              className="w-full px-3.5 py-3 bg-obsidian border border-border rounded-xl text-text-primary text-sm focus:border-teal outline-none resize-y leading-relaxed font-sans"
            />
          </div>

          {/* Existing Attachments Display (Read-only summary) */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                {t('tickets:detail.attachments_heading', 'Capturas existentes')} ({ticket.attachments.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-surface/60 rounded-lg border border-border text-xs text-text-secondary"
                  >
                    <span>📎</span>
                    <span className="truncate max-w-[150px]">{att.file_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Attachments Upload Area */}
          <div className="space-y-3 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {t('tickets:detail.add_screenshots_label', 'Agregar Nuevas Capturas')}
              </label>
              <span className="text-[11px] text-teal-glow font-medium">
                📋 Ctrl + V para pegar captura
              </span>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-teal bg-teal/10 scale-[0.99]'
                  : 'border-border/80 hover:border-teal/50 bg-obsidian/40 hover:bg-surface/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) processFiles(e.target.files);
                }}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                <span className="text-2xl">📸</span>
                <p className="text-xs text-text-primary font-medium">
                  {t('tickets:wizard.attachments_hint', 'Arrastra imágenes aquí o haz clic para seleccionarlas')}
                </p>
                <p className="text-[11px] text-text-muted">
                  Formatos soportados: PNG, JPG, JPEG, WEBP
                </p>
              </div>
            </div>

            {/* Previews of newly attached images */}
            {newImages.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-teal-glow">
                  Nuevas imágenes a subir ({newImages.length}):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {newImages.map((img) => (
                    <div
                      key={img.id}
                      className="group relative rounded-xl overflow-hidden border border-border bg-obsidian aspect-video shadow-sm"
                    >
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        onClick={() => setPreviewImage(img.dataUrl)}
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(img.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-urgency-high text-white text-xs flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity shadow cursor-pointer"
                        title={t('tickets:wizard.remove_attachment', 'Quitar')}
                      >
                        ✕
                      </button>
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-0.5 truncate text-[10px] text-white">
                        {img.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border/60 flex items-center justify-end gap-3 shrink-0 bg-surface/30">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="px-4 py-2 bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary rounded-xl text-xs font-semibold transition-all border border-border cursor-pointer"
          >
            {t('common:actions.cancel', 'Cancelar')}
          </button>
          <button
            type="submit"
            form="edit-ticket-form"
            disabled={isPending || !title.trim()}
            className="px-5 py-2 bg-teal hover:bg-teal-light text-white rounded-xl text-xs font-semibold transition-all shadow-[var(--shadow-glow-teal)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {isPending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t('common:actions.saving', 'Guardando...')}</span>
              </>
            ) : (
              <span>{t('common:actions.save_changes', 'Guardar Cambios')}</span>
            )}
          </button>
        </div>
      </div>

      {/* Mini Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[85vh]">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-obsidian text-white flex items-center justify-center border border-border text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
