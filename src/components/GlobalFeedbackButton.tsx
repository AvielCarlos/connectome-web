import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { OraClient, GlobalFeedbackPayload } from '../lib/OraClient';
import CPExplainerModal from './CPExplainerModal';
import { useToast } from './Toast';

const CATEGORIES: GlobalFeedbackPayload['category'][] = ['Bad Card/Node', 'Malfunction', 'Bug', 'Confusing', 'Idea', 'Design', 'Praise', 'Other'];

export default function GlobalFeedbackButton() {
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
    setCategory('Bad Card/Node');
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
          report_type: 'bad_or_malfunctional_card_or_node',
          activeElement: document.activeElement instanceof HTMLElement ? { tag: document.activeElement.tagName, id: document.activeElement.id || null, name: document.activeElement.getAttribute('name'), ariaLabel: document.activeElement.getAttribute('aria-label') } : null,
        },
      });

      if (res.cp_earned) show(`Report sent +${res.cp_earned} CP`, 'success');
      else show(res.message || 'Report sent +10 CP', 'success');
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
        aria-label="Report bad card or node"
        title="Report bad card/node or give feedback"
        onClick={() => setOpen(true)}
      >
        !
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
                <h2 id="global-feedback-title">Report bad card/node</h2>
                <p className="global-feedback-reward">
                  <span>Earn +10 CP</span>
                  <span aria-hidden="true">·</span>
                  <button type="button" onClick={() => setCpExplainerOpen(true)}>What is CP?</button>
                </p>
              </div>
              <button type="button" aria-label="Close feedback" onClick={resetAndClose} disabled={submitting}>×</button>
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
