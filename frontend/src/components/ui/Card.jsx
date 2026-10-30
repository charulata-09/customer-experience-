import React from 'react';

export const Card = ({
  children,
  className = '',
  hover = false,
  title,
  description,
  action,
  headerClassName = '',
  bodyClassName = '',
  footer,
  ...props
}) => {
  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden transition-all duration-200 ${
        hover ? 'glass-card-hover' : ''
      } ${className}`}
      {...props}
    >
      {(title || description || action) && (
        <div className={`p-5 sm:p-6 border-b border-white/5 flex items-start justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">{title}</h3>}
            {description && <p className="text-xs sm:text-sm text-slate-400 mt-1">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-5 sm:p-6 ${bodyClassName}`}>{children}</div>
      {footer && <div className="p-4 sm:p-5 bg-slate-900/40 border-t border-white/5">{footer}</div>}
    </div>
  );
};
