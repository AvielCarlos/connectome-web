import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { AuraClient, GlobalFeedbackPayload } from '../lib/AuraClient';
import CPExplainerModal from './CPExplainerModal';
import { useToast } from './Toast';
import { buildFeedbackContextSnapshot } from '../lib/feedbackContext';

const CATEGORIES: GlobalFeedbackPayload['category'][] = ['Bad Card/Node', 'Malfunction', 'Bug', 'Confusing', 'Idea', 'Design', 'Praise', 'Other'];

export default function GlobalFeedbackButton({ inlineMode = false, inlineTrigger, onClose }: { inlineMode?: boolean; inlineTrigger?: boolean; onClose?: () => void } = {}) {
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [cpExplainerOpen, setCpExplainerOpen] = useState(false);
  const [category, setCategory] = useState<GlobalFeedbackPayload['category']>('Bad Card/Node');
  const [message, setMessage] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => textareaRef.current?.focus(), 80);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) closeFeedback();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, submitting]);

  const closeFeedback = (notifyParent = true) => {
    setOpen(false);
    setMessage('');
    setCategory('Bad Card/Node');
    setIncludeScreenshot(true);
    setError(null);
    if (notifyParent) onClose?.();
  };

  const captureScreenshot = async () => {
    if (!includeScreenshot) return null;
    const canvas = await html2canvas(document.body, {
      backgroundColor: '#060610',
      useCORS: true,
      allowTaint: false,
      scale: Math.min(window.devicePixelRatio || 1, 1.4),
      ignoreElements: (element) => element instanceof HTMLElement && element.dataset.feedbackWidget === 'true',
    });

    // Keep feedback reliable on mobile: full-page PNG screenshots can exceed
    // proxy/body limits or the 15s client timeout. Downscale and JPEG-compress
    // before sending; if still large, the submit path retries without it.
    const maxSide = 1100;
    const ratio = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(canvas.width * ratio));
    out.height = Math.max(1, Math.round(canvas.height * ratio));
    const ctx = out.getContext('2d');
    ctx?.drawImage(canvas, 0, 0, out.width, out.height);
    return out.toDataURL('image/jpeg', 0.68);
  };

  const errorMessage = (err: any) => {
    const status = err?.response?.status;
    const detail = err?.response?.data?.detail;
    if (status === 401) return 'Please sign in again, then resend this feedback.';
    if (status === 413) return 'The screenshot was too large. Feedback was not sent yet.';
    if (detail) return typeof detail === 'string' ? detail : 'Could not send feedback. Please try again.';
    if (err?.code === 'ECONNABORTED') return 'Feedback timed out. Retrying without screenshot may help.';
    return 'Could not send feedback. Please try again.';
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      setError('Please share at least a few words.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      let screenshot: string | null = null;
      const feedbackContext = buildFeedbackContextSnapshot();
      const metadata: Record<string, any> = {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        title: document.title,
        report_type: 'bad_or_malfunctional_card_or_node',
        feedback_context: feedbackContext,
        activeElement: document.activeElement instanceof HTMLElement ? { tag: document.activeElement.tagName, id: document.activeElement.id || null, name: document.activeElement.getAttribute('name'), ariaLabel: document.activeElement.getAttribute('aria-label') } : null,
      };

      try {
        screenshot = await captureScreenshot();
        if (screenshot) metadata.screenshot_client_bytes = Math.round((screenshot.length * 3) / 4);
      } catch (captureErr: any) {
        metadata.screenshot_capture_error = captureErr?.message || 'capture failed';
        screenshot = null;
      }

      const payload = {
        category,
        message: trimmed,
        route: window.location.pathname + window.location.search + window.location.hash,
        screenshot_data_url: screenshot,
        metadata,
      };

      let res;
      try {
        res = await AuraClient.submitGlobalFeedback(payload);
      } catch (submitErr: any) {
        // If a mobile screenshot payload causes timeout/body-limit trouble, keep
        // the text feedback flowing and retry once without the attachment.
        if (screenshot && (submitErr?.response?.status === 413 || submitErr?.code === 'ECONNABORTED' || !submitErr?.response)) {
          res = await AuraClient.submitGlobalFeedback({
            ...payload,
            screenshot_data_url: null,
            metadata: { ...metadata, screenshot_retry_without_attachment: true, first_error: errorMessage(submitErr) },
          });
        } else {
          throw submitErr;
        }
      }

      if (res.cp_earned) show(`Report sent +${res.cp_earned} CP`, 'success');
      else show(res.message || 'Report sent +10 CP', 'success');
      closeFeedback();
    } catch (err: any) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger from external inlineTrigger prop
  React.useEffect(() => {
    if (inlineTrigger) setOpen(true);
  }, [inlineTrigger]);

  const handleClose = () => {
    closeFeedback();
  };

  return (
    <>
      {!inlineMode && (
        <button
          type="button"
          className="global-feedback-fab"
          data-feedback-widget="true"
          aria-label="Report bad card or node"
          title="Report bad card/node or give feedback"
          onClick={() => setOpen(true)}
        >
          !
        </button>
      )}

      {open && (
        <div className="global-feedback-modal-backdrop" data-feedback-widget="true" onClick={() => !submitting && handleClose()}>
          <section
            className="global-feedback-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-feedback-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="global-feedback-modal__header">
              <div>
                <h2 id="global-feedback-title">Report bad card/node</h2>
                <p className="global-feedback-reward">
                  <span>Earn +10 CP</span>
                  <span aria-hidden="true">·</span>
                  <button type="button" onClick={() => setCpExplainerOpen(true)}>What is CP?</button>
                </p>
              </div>
              <button type="button" aria-label="Close feedback" onClick={handleClose} disabled={submitting}>×</button>
            </div>

            <label className="global-feedback-label" htmlFor="global-feedback-message">
              What card, node, pathway, or screen feels bad, broken, misleading, or missing?
            </label>
            <textarea
              id="global-feedback-message"
              ref={textareaRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell Aura what went wrong, what should have appeared, or why this card/node did not fit…"
              rows={5}
            />

            <div className="global-feedback-categories" aria-label="Feedback category">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={item === category ? 'global-feedback-category global-feedback-category--active' : 'global-feedback-category'}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="global-feedback-checkbox">
              <input
                type="checkbox"
                checked={includeScreenshot}
                onChange={(event) => setIncludeScreenshot(event.target.checked)}
              />
              <span>Include screenshot and current route/context</span>
            </label>

            {error && <div className="global-feedback-error" role="alert">{error}</div>}

            <button type="button" className="global-feedback-submit" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Sending…' : 'Report to Aura + earn 10 CP'}
            </button>
          </section>
        </div>
      )}

      <CPExplainerModal open={cpExplainerOpen} onClose={() => setCpExplainerOpen(false)} />
    </>
  );
}
