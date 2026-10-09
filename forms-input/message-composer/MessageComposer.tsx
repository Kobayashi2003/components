import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import { ControlIcon } from './internal/ControlIcon';
import { useControlState } from './internal/useControlState';

export interface MessageComposerProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onDictate?: () => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function MessageComposer({
  value,
  defaultValue = '',
  onChange,
  onSubmit,
  onDictate,
  placeholder = 'Ask anything…',
  label = 'Message',
  disabled = false,
  className = '',
  style,
}: MessageComposerProps) {
  const [text, update] = useControlState(value, defaultValue, onChange);
  const [focused, setFocused] = useState(false);
  const open = focused || !!text.trim();
  const filterId = useId().replace(/:/g, '');
  return (
    <form
      className={`atlas-control message-composer ${className}`}
      data-open={open}
      style={style}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onSubmit={event => {
        event.preventDefault();
        if (disabled || !text.trim()) return;
        onSubmit?.(text.trim());
        update('');
      }}
    >
      <svg className="message-composer__defs" aria-hidden="true">
        <defs>
          <filter
            id={filterId}
            x="-20%"
            y="-50%"
            width="140%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
            />
          </filter>
        </defs>
      </svg>
      <span
        className="message-composer__blobs"
        style={{ filter: `url(#${filterId})` }}
        aria-hidden="true"
      >
        <i />
        <i />
      </span>
      <div className="message-composer__field">
        <input
          aria-label={label}
          placeholder={placeholder}
          value={text}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onChange={event => update(event.target.value)}
        />
        <button
          type="button"
          className="message-composer__mic"
          aria-label="Dictate"
          aria-hidden={open}
          tabIndex={open ? -1 : 0}
          disabled={disabled || !onDictate}
          onClick={onDictate}
        >
          <ControlIcon name="wave" size={19} />
        </button>
      </div>
      <button
        className="message-composer__send"
        type="submit"
        aria-label="Send"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        disabled={disabled || !text.trim()}
      >
        <ControlIcon name="send" />
      </button>
    </form>
  );
}
