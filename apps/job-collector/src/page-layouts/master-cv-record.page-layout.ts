import {
  definePageLayout,
  type PageLayoutWidgetManifest,
  PageLayoutTabLayoutMode,
} from 'twenty-sdk/define';

import { cvFieldId, cvMetadataId, CV_OBJECTS } from '../constants/cv-metadata';
import { masterCvRelationViewId } from '../constants/master-cv-relation-view';

const fieldWidget = (
  field: string,
  title: string,
  fieldDisplayMode: 'FIELD' | 'EDITOR' = 'FIELD',
): PageLayoutWidgetManifest => ({
  universalIdentifier: cvMetadataId(`master-cv-layout:field:${field}`),
  title,
  type: 'FIELD',
  configuration: {
    configurationType: 'FIELD',
    fieldMetadataId: cvFieldId('jobMasterCv', field),
    fieldDisplayMode,
  },
});

const relationTable = (
  relation: string,
  title: string,
  personScoped = false,
): PageLayoutWidgetManifest => ({
  universalIdentifier: cvMetadataId(`master-cv-layout:table:${relation}`),
  title,
  type: 'FIELD',
  configuration: {
    configurationType: 'FIELD',
    fieldMetadataId: cvFieldId(
      'jobMasterCv',
      personScoped ? 'person' : relation,
    ),
    fieldDisplayMode: 'TABLE',
    viewId: masterCvRelationViewId(relation),
    ...(personScoped && {
      nestedRelationFieldMetadataId: cvFieldId('person', relation),
      isUIEditable: false,
    }),
  },
});

export const masterCvRecordPageLayout = definePageLayout({
  universalIdentifier: cvMetadataId('master-cv-layout'),
  name: 'Master CV',
  type: 'RECORD_PAGE',
  objectUniversalIdentifier: CV_OBJECTS.jobMasterCv,
  isFirstTabPinned: false,
  tabs: [
    {
      universalIdentifier: cvMetadataId('master-cv-layout:overview'),
      title: 'Overview',
      position: 0,
      icon: 'IconFileCv',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        fieldWidget('summary', 'Summary', 'EDITOR'),
        fieldWidget('person', 'Person'),
        fieldWidget('targetRole', 'Target role'),
        fieldWidget('location', 'Location'),
      ],
    },
    {
      universalIdentifier: cvMetadataId('master-cv-layout:work'),
      title: 'Experience',
      position: 1,
      icon: 'IconBriefcase',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        relationTable('experiences', 'Work experience'),
        relationTable('projects', 'Projects'),
      ],
    },
    {
      universalIdentifier: cvMetadataId('master-cv-layout:skills'),
      title: 'Skills',
      position: 2,
      icon: 'IconTag',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [relationTable('cvSkills', 'Skills')],
    },
    {
      universalIdentifier: cvMetadataId('master-cv-layout:credentials'),
      title: 'Credentials',
      position: 3,
      icon: 'IconSchool',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [relationTable('credentials', 'Education and credentials')],
    },
    {
      universalIdentifier: cvMetadataId('master-cv-layout:achievements'),
      title: 'Achievements',
      position: 4,
      icon: 'IconFileText',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [relationTable('achievements', 'Achievements')],
    },
    {
      universalIdentifier: cvMetadataId('master-cv-layout:jobs'),
      title: 'Jobs',
      position: 5,
      icon: 'IconBriefcase',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        relationTable('jobAssignments', 'Job assignments', true),
        relationTable('jobAssessments', 'Job assessments', true),
      ],
    },
    {
      universalIdentifier: cvMetadataId('master-cv-layout:files'),
      title: 'Files',
      position: 6,
      icon: 'IconPaperclip',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: cvMetadataId('master-cv-layout:files-widget'),
          title: 'Files',
          type: 'FILES',
          configuration: { configurationType: 'FILES' },
        },
      ],
    },
  ],
});
