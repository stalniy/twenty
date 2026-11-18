export const PROFILE_ELIGIBILITY_OPTIONS = [
  {
    value: 'POSSIBLE',
    label: 'Poland allowed; authorization unverified',
    color: 'green' as const,
    position: 0,
  },
  {
    value: 'RESTRICTED',
    label: 'Location restriction',
    color: 'red' as const,
    position: 1,
  },
  {
    value: 'UNKNOWN',
    label: 'Needs verification',
    color: 'orange' as const,
    position: 2,
  },
];
