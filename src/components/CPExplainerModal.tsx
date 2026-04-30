type CPExplainerModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function CPExplainerModal({ open, onClose }: CPExplainerModalProps) {
  if (!open) return null;

  return (
    <div className="cp-explainer-backdrop" data-feedback-widget="true" onClick={onClose}>
      <section
        className="cp-explainer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cp-explainer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="cp-explainer-close" aria-label="Close CP explainer" onClick={onClose}>
          ×
        </button>
        <div className="cp-explainer-kicker">Contribution Points</div>
        <h2 id="cp-explainer-title">What is CP?</h2>
        <p>
          CP is Aura’s contribution score — a simple way to recognize people who help improve the product,
          community, and mission.
        </p>
        <ul>
          <li><strong>Feedback earns CP</strong> because noticing what’s broken, confusing, or useful helps Aura learn faster.</li>
          <li><strong>Bigger contributions earn more</strong>: code, design, docs, research, community support, and useful ideas all count.</li>
          <li><strong>CP builds reputation</strong> in the Ascension DAO and may unlock governance, rewards, and future participation as the system matures.</li>
        </ul>
        <div className="cp-explainer-note">Quality matters more than volume. Real value earns real signal.</div>
      </section>
    </div>
  );
}
