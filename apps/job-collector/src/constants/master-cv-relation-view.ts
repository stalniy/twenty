import {
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import { cvFieldId, cvMetadataId, CV_OBJECTS } from './cv-metadata';

type MasterCvRelationViewOptions = {
  name: string;
  relation: string;
  object: keyof typeof CV_OBJECTS;
  fields: ReadonlyArray<readonly [string, number]>;
  personScoped?: boolean;
};

export const masterCvRelationViewId = (relation: string) =>
  cvMetadataId(`master-cv-view:${relation}`);

export const masterCvRelationView = ({
  name,
  relation,
  object,
  fields,
  personScoped = false,
}: MasterCvRelationViewOptions) => ({
  universalIdentifier: masterCvRelationViewId(relation),
  name,
  objectUniversalIdentifier: CV_OBJECTS[object],
  type: ViewType.TABLE_WIDGET,
  fields: fields.map(([field, size], position) => ({
    universalIdentifier: cvMetadataId(
      `master-cv-view:${relation}:field:${field}`,
    ),
    fieldMetadataUniversalIdentifier: cvFieldId(object, field),
    size,
    position,
    isVisible: true,
  })),
  filters: [
    {
      universalIdentifier: cvMetadataId(`master-cv-view:${relation}:filter`),
      fieldMetadataUniversalIdentifier: cvFieldId(
        object,
        personScoped ? 'person' : 'masterCv',
      ),
      operand: ViewFilterOperand.IS,
      value: { selectedRecordIds: [], isCurrentRecordSelected: true },
    },
  ],
  sorts: personScoped
    ? []
    : [
        {
          universalIdentifier: cvMetadataId(`master-cv-view:${relation}:sort`),
          fieldMetadataUniversalIdentifier: cvFieldId(object, 'resumeOrder'),
          direction: ViewSortDirection.ASC,
        },
      ],
});
