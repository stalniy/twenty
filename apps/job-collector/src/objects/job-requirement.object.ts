import { defineObject, FieldType } from 'twenty-sdk/define';
import { cvObject } from '../constants/cv-metadata';

export const jobRequirement = defineObject(
  cvObject(
    'jobRequirement',
    'jobRequirements',
    'Job requirement',
    'Job requirements',
    'IconListCheck',
    {
      severity: { label: 'Severity', type: FieldType.TEXT },
      priorityInferred: { label: 'Priority inferred', type: FieldType.BOOLEAN },
      responsibility: { label: 'Responsibility', type: FieldType.BOOLEAN },
      assessmentMethod: { label: 'Assessment method', type: FieldType.TEXT },
      skillRule: { label: 'Skill rule', type: FieldType.TEXT },
      sectionHeading: { label: 'Posting section', type: FieldType.TEXT },
      sourceText: { label: 'Posting evidence', type: FieldType.TEXT },
    },
  ),
);
