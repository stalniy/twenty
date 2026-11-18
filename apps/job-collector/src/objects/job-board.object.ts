import { defineObject, FieldType } from 'twenty-sdk/define';
import { IDENTIFIERS } from '../constants/identifiers';
export const jobCollectorBoard = defineObject({
  universalIdentifier: IDENTIFIERS.BOARDS_OBJECT,
  nameSingular: 'jobCollectorBoard',
  namePlural: 'jobCollectorBoards',
  labelSingular: 'Job board',
  labelPlural: 'Job boards',
  icon: 'IconBriefcase',
  labelIdentifierFieldMetadataUniversalIdentifier: IDENTIFIERS.BOARD_NAME,
  fields: [
    {
      universalIdentifier: IDENTIFIERS.BOARD_NAME,
      name: 'name',
      label: 'Name',
      type: FieldType.TEXT,
    },
    {
      universalIdentifier: IDENTIFIERS.BOARD_PROVIDER,
      name: 'provider',
      label: 'Source',
      type: FieldType.SELECT,
      options: [
        { value: 'ASHBY', label: 'Ashby', color: 'blue', position: 0 },
        { value: 'LEVER', label: 'Lever', color: 'green', position: 1 },
        {
          value: 'WORK_AT_A_STARTUP',
          label: 'Work at a Startup / YC',
          color: 'orange',
          position: 2,
        },
        { value: 'ELASTIC', label: 'Elastic', color: 'yellow', position: 3 },
        { value: 'FYUL', label: 'FYUL', color: 'purple', position: 4 },
        { value: 'THE_AA', label: 'The AA', color: 'yellow', position: 5 },
      ],
    },
    {
      universalIdentifier: IDENTIFIERS.BOARD_SLUG,
      name: 'slug',
      label: 'Board slug',
      type: FieldType.TEXT,
    },
    {
      universalIdentifier: IDENTIFIERS.BOARD_REGION,
      name: 'region',
      label: 'Lever region',
      type: FieldType.SELECT,
      options: [
        { value: 'GLOBAL', label: 'Global', color: 'blue', position: 0 },
        { value: 'EU', label: 'Europe', color: 'green', position: 1 },
      ],
      defaultValue: "'GLOBAL'",
    },
    {
      universalIdentifier: IDENTIFIERS.BOARD_ENABLED,
      name: 'enabled',
      label: 'Enabled',
      type: FieldType.BOOLEAN,
      defaultValue: true,
    },
    {
      universalIdentifier: IDENTIFIERS.BOARD_LAST_RUN_AT,
      name: 'lastRunAt',
      label: 'Last collection',
      type: FieldType.DATE_TIME,
    },
    {
      universalIdentifier: IDENTIFIERS.BOARD_LAST_RUN_STATUS,
      name: 'lastRunStatus',
      label: 'Last result',
      type: FieldType.SELECT,
      options: [
        { value: 'SUCCESS', label: 'Success', color: 'green', position: 0 },
        { value: 'ERROR', label: 'Error', color: 'red', position: 1 },
      ],
    },
    {
      universalIdentifier: IDENTIFIERS.BOARD_LAST_ERROR,
      name: 'lastError',
      label: 'Last error',
      type: FieldType.TEXT,
    },
    {
      universalIdentifier: IDENTIFIERS.BOARD_MATCH_COUNT,
      name: 'matchCount',
      label: 'Matching jobs',
      type: FieldType.NUMBER,
    },
  ],
});
