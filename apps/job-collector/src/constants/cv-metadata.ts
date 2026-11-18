import {
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT,
} from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import { JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER } from '../constants/workspace-binding';
import { stableRecordId } from '../utils/stable-record-id.util';

export const cvMetadataId = (key: string) =>
  stableRecordId(`job-collector-metadata:${key}`);

export const CV_OBJECTS = {
  jobRequirement: cvMetadataId('jobRequirement'),
  jobRequirementSkill: cvMetadataId('jobRequirementSkill'),
  jobRequirementExtraction: cvMetadataId('jobRequirementExtraction'),
  jobMasterCv: cvMetadataId('jobMasterCv'),
  jobCvExperience: cvMetadataId('jobCvExperience'),
  jobCvProject: cvMetadataId('jobCvProject'),
  jobCvCredential: cvMetadataId('jobCvCredential'),
  jobCvEvidence: cvMetadataId('jobCvEvidence'),
  jobSkill: cvMetadataId('jobSkill'),
  jobCvSkill: cvMetadataId('jobCvSkill'),
  jobEvidenceSkill: cvMetadataId('jobEvidenceSkill'),
  jobPersonLink: cvMetadataId('jobPersonLink'),
  jobPersonAssessment: cvMetadataId('jobPersonAssessment'),
  jobCvRecommendationDecision: cvMetadataId('jobCvRecommendationDecision'),
} as const;

type CvObject = keyof typeof CV_OBJECTS;
type RelationObject = CvObject | 'person' | 'jobPosition' | 'jobSourcePosting';

const relationObjects = {
  ...CV_OBJECTS,
  person: STANDARD_OBJECT.person.universalIdentifier,
  jobPosition: JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
  jobSourcePosting: IDENTIFIERS.POSTINGS_OBJECT,
};

const relations = [
  ['jobRequirement', 'jobPosition', 'jobPosition', 'postingRequirements'],
  [
    'jobRequirement',
    'sourcePosting',
    'jobSourcePosting',
    'postingRequirements',
  ],
  ['jobRequirementSkill', 'requirement', 'jobRequirement', 'requiredSkills'],
  ['jobRequirementSkill', 'skill', 'jobSkill', 'requirementSkills'],
  ['jobMasterCv', 'person', 'person', 'masterCvs'],
  ['jobCvExperience', 'masterCv', 'jobMasterCv', 'experiences'],
  ['jobCvProject', 'masterCv', 'jobMasterCv', 'projects'],
  ['jobCvProject', 'experience', 'jobCvExperience', 'projects'],
  ['jobCvCredential', 'masterCv', 'jobMasterCv', 'credentials'],
  ['jobCvEvidence', 'person', 'person', 'cvAchievements'],
  ['jobCvEvidence', 'masterCv', 'jobMasterCv', 'achievements'],
  ['jobCvEvidence', 'experience', 'jobCvExperience', 'achievements'],
  ['jobCvEvidence', 'project', 'jobCvProject', 'achievements'],
  ['jobCvSkill', 'masterCv', 'jobMasterCv', 'cvSkills'],
  ['jobCvSkill', 'skill', 'jobSkill', 'cvSkills'],
  ['jobEvidenceSkill', 'evidence', 'jobCvEvidence', 'achievementSkills'],
  ['jobEvidenceSkill', 'skill', 'jobSkill', 'achievementSkills'],
  ['jobPersonLink', 'person', 'person', 'jobAssignments'],
  ['jobPersonLink', 'jobPosition', 'jobPosition', 'personAssignments'],
  ['jobPersonLink', 'sourcePosting', 'jobSourcePosting', 'personAssignments'],
  ['jobPersonAssessment', 'person', 'person', 'jobAssessments'],
  [
    'jobCvRecommendationDecision',
    'assessment',
    'jobPersonAssessment',
    'recommendationDecisions',
  ],
  [
    'jobPersonAssessment',
    'sourcePosting',
    'jobSourcePosting',
    'personAssessments',
  ],
  [
    'jobPersonAssessment',
    'legacyPosition',
    'jobPosition',
    'legacyPersonAssessments',
  ],
] as const satisfies ReadonlyArray<
  readonly [CvObject, string, RelationObject, string]
>;

export const cvFieldId = (object: RelationObject, field: string) =>
  cvMetadataId(`${object}.${field}`);

const relationField = (
  object: RelationObject,
  name: string,
  target: RelationObject,
  inverse: string,
  isManyToOne: boolean,
) => ({
  universalIdentifier: cvFieldId(object, name),
  name,
  label: name
    .replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)
    .replace(/^./, (letter) => letter.toUpperCase()),
  type: FieldType.RELATION as const,
  relationTargetObjectMetadataUniversalIdentifier: relationObjects[target],
  relationTargetFieldMetadataUniversalIdentifier: cvFieldId(target, inverse),
  universalSettings: isManyToOne
    ? {
        relationType: RelationType.MANY_TO_ONE as const,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: `${name}Id`,
      }
    : { relationType: RelationType.ONE_TO_MANY as const },
});

export const cvInverseRelation = (object: RelationObject, name: string) => {
  const relation = relations.find(
    ([, , target, inverse]) => target === object && inverse === name,
  );
  if (!relation) throw new Error(`Missing relation ${object}.${name}`);
  const [source, field] = relation;
  return {
    ...relationField(object, name, source, field, false),
    objectUniversalIdentifier: relationObjects[object],
  };
};

type CvFieldType =
  | FieldType.TEXT
  | FieldType.BOOLEAN
  | FieldType.NUMBER
  | FieldType.DATE_TIME;
type CvField = {
  [TFieldType in CvFieldType]: { label: string; type: TFieldType };
}[CvFieldType];

export const cvObject = (
  object: CvObject,
  namePlural: string,
  labelSingular: string,
  labelPlural: string,
  icon: string,
  fields: Record<string, CvField>,
) => ({
  universalIdentifier: CV_OBJECTS[object],
  nameSingular: object,
  namePlural,
  labelSingular,
  labelPlural,
  icon,
  labelIdentifierFieldMetadataUniversalIdentifier: cvFieldId(object, 'name'),
  fields: [
    {
      universalIdentifier: cvFieldId(object, 'name'),
      name: 'name',
      label: 'Name',
      type: FieldType.TEXT as const,
    },
    ...Object.entries(fields).map(([name, field]) => ({
      universalIdentifier: cvFieldId(object, name),
      name,
      ...field,
    })),
    ...relations
      .filter(([source]) => source === object)
      .map(([source, field, target, inverse]) =>
        relationField(source, field, target, inverse, true),
      ),
    ...relations
      .filter(([, , target]) => target === object)
      .map(([source, field, target, inverse]) =>
        relationField(target, inverse, source, field, false),
      ),
  ],
});
