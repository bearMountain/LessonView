import React from 'react';

interface TimeSignatureSelectorProps {
  value: string;
  onChange: (signature: string) => void;
}

interface TimeSignature {
  value: string;
  display: string;
  name: string;
}

const TimeSignatureSelector: React.FC<TimeSignatureSelectorProps> = ({
  value,
  onChange,
}) => {
  const timeSignatures: TimeSignature[] = [
    {
      value: '4/4',
      display: '4/4',
      name: 'Four Four Time',
    },
    {
      value: '3/4',
      display: '3/4',
      name: 'Three Four Time (Waltz)',
    },
    {
      value: '2/4',
      display: '2/4',
      name: 'Two Four Time',
    },
    {
      value: '6/8',
      display: '6/8',
      name: 'Six Eight Time',
    },
    {
      value: '12/8',
      display: '12/8',
      name: 'Twelve Eight Time',
    },
    {
      value: '2/2',
      display: '2/2',
      name: 'Cut Time',
    },
  ];

  return (
    <div className="time-signature-selector">
      <span className="time-signature-selector__label">Time:</span>
      <div className="time-signature-dropdown">
        <select
          className="time-signature-dropdown__select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          title="Time Signature"
        >
          {timeSignatures.map((signature) => (
            <option
              key={signature.value}
              value={signature.value}
              title={signature.name}
            >
              {signature.display}
            </option>
          ))}
        </select>
        <div className="time-signature-display">
          <span className="time-signature-display__value">{value}</span>
        </div>
      </div>
    </div>
  );
};

export default TimeSignatureSelector; 