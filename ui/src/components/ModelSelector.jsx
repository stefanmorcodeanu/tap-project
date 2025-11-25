/**
 * Model selector component
 */

export default function ModelSelector({ config, selected, onSelect, options }) {
  const handleKeyDown = (e, route) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(route);
    }
  };

  return (
    <section className="options">
      <label style={{ display: "block", marginBottom: 12, fontWeight: 600 }}>
        Choose model
      </label>
      <div className="model-grid">
        <div
          role="button"
          tabIndex={0}
          className={`model-card ${selected === config.defaultRoute ? "active" : ""}`}
          onClick={() => onSelect(config.defaultRoute)}
          onKeyDown={(e) => handleKeyDown(e, config.defaultRoute)}
        >
          <div className="model-card-title">Auto</div>
          <div className="model-card-sub">
            Picks randomly between {config.fast.name} and {config.slow.name}
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          className={`model-card ${selected === config.fast.route ? "active" : ""}`}
          onClick={() => onSelect(config.fast.route)}
          onKeyDown={(e) => handleKeyDown(e, config.fast.route)}
        >
          <div className="model-card-title">{config.fast.label}</div>
          <div className="model-card-sub">{config.fast.name}</div>
        </div>

        <div
          role="button"
          tabIndex={0}
          className={`model-card ${selected === config.slow.route ? "active" : ""}`}
          onClick={() => onSelect(config.slow.route)}
          onKeyDown={(e) => handleKeyDown(e, config.slow.route)}
        >
          <div className="model-card-title">{config.slow.label}</div>
          <div className="model-card-sub">{config.slow.name}</div>
        </div>
      </div>
      <p style={{ color: "#475569", marginTop: 8 }}>
        {options.find((o) => o.value === selected)?.description}
      </p>
    </section>
  );
}

