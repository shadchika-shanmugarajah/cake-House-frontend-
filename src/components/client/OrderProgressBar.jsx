import React from 'react';
import './OrderProgressBar.css';

const OrderProgressBar = ({ steps = [], isCancelled = false }) => {
  if (!steps.length) return null;

  if (isCancelled) {
    return (
      <div className="order-progress-cancelled">
        This order was cancelled.
      </div>
    );
  }

  return (
    <div className="order-progress">
      {steps.map((step, index) => (
        <div
          key={step.key}
          className={`order-progress-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
        >
          <div className="order-progress-marker">
            <span>{index + 1}</span>
          </div>
          <div className="order-progress-label">{step.label}</div>
          {index < steps.length - 1 && (
            <div className={`order-progress-line ${step.completed && !step.active ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default OrderProgressBar;
