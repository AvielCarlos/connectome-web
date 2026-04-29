import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { OraClient, GlobalFeedbackPayload } from '../lib/OraClient';
import { useToast } from './Toast';

const CATEGORIES: GlobalFeedbackPayload['category'][] = ['Bug', 'Confusing', 'Idea', 'Design', 'Praise', 'Other'];

export default function GlobalFeedbackButton() {
  const { show, showCP } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<GlobalFeedbackPayload['category']>('Idea');
  const [message, setMessage] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => textareaRef.current?.focus(), 80);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, submitting]);

  const captureScreenshot = async () => {
    if (!includeScreenshot) return null;
    const canvas = await html2canvas(document.body, {
      backgroundColor: '#060610',
      useCORS: true,
      scale: Math.min(window.devicePixelRatio || 1, 2),
      ignoreElements: (element) => element instanceof HTMLElement && element.dataset.feedbackWidget === 'true',
    });
    return canvas.toDataURL('image/png');
  };

  const resetAndClose = () => {
    setOpen(false);
    setMessage('');
    setCategory('Idea');
    setIncludeScreenshot(true);
    setError(null);
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
      const screenshot = await captureScreenshot();
      const res = await OraClient.submitGlobalFeedback({
        category,
        message: trimmed,
        route: window.location.pathname + window.location.search + window.location.hash,
        screenshot_data_url: screenshot,
        metadata: {
          viewport: { width: window.innerWidth, height: window.innerHeight },
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          title: document.title,
        },
      });

      if (res.cp_earned) showCP(res.cp_earned, res.total_dao_cp);
      else show(res.message || '+10 XP / feedback received', 'success');
      resetAndClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not send feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="global-feedback-fab"
        data-feedback-widget="true"
        aria-label="Give feedback & earn CP"
        title="Give feedback & earn CP"
        onClick={() => setOpen(true)}
      >
        ?
      </button>

      {open && (
        <div className="global-feedback-modal-backdrop" data-feedback-widget="true" onClick={() => !submitting && resetAndClose()}>
          <section
            className="global-feedback-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-feedback-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="global-feedback-modal__header">
              <div>
                <h2 id="global-feedback-title">Help improve Ora</h2>
                <p>Send what you notice here and earn contribution points.</p>
              </div>
              <button type="button" aria-label="Close feedback" onClick={resetAndClose} disabled={submitting}>×</button>
            </div>

            <label className="global-feedback-label" htmlFor="global-feedback-message">
              What feels confusing, broken, beautiful, or missing?
            </label>
            <textarea
              id="global-feedback-message"
              ref={textareaRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell Ora what you’re noticing…"
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
              <span>Include screenshot of this screen</span>
            </label>

            {error && <div className="global-feedback-error" role="alert">{error}</div>}

            <button type="button" className="global-feedback-submit" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Sending…' : 'Send feedback + earn CP'}
            </button>
          </section>
        </div>
      )}
    </>
  );
}
