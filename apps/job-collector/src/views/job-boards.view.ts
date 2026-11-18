import { defineView, ViewType } from 'twenty-sdk/define';
import { IDENTIFIERS } from '../constants/identifiers';
export const jobCollectorBoardView = defineView({
  universalIdentifier: IDENTIFIERS.BOARDS_VIEW,
  name: 'Job boards',
  objectUniversalIdentifier: IDENTIFIERS.BOARDS_OBJECT,
  type: ViewType.TABLE,
  icon: 'IconBriefcase',
  fields: [
    {
      universalIdentifier: '99c72598-a7e4-4473-9f0d-dd34aaba47cf',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.BOARD_NAME,
      position: 0,
      size: 240,
      isVisible: true,
    },
    {
      universalIdentifier: 'b70ef7ca-3a0b-44a9-83ae-5a6ec93a411b',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.BOARDS_COMPANY_FIELD,
      position: 1,
      size: 180,
      isVisible: true,
    },
    {
      universalIdentifier: '0955419b-755f-47ad-b5a5-407a61b3062e',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.BOARD_PROVIDER,
      position: 2,
      size: 120,
      isVisible: true,
    },
    {
      universalIdentifier: '00b72079-1b04-4140-87df-dc34580c9e9e',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.BOARD_SLUG,
      position: 3,
      size: 170,
      isVisible: true,
    },
    {
      universalIdentifier: 'c3f02d18-2940-410a-a464-75b3dc69513a',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.BOARD_ENABLED,
      position: 4,
      size: 100,
      isVisible: true,
    },
    {
      universalIdentifier: '022076fa-307e-4048-8fa4-80a6eeda0e31',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.BOARD_LAST_RUN_STATUS,
      position: 5,
      size: 130,
      isVisible: true,
    },
    {
      universalIdentifier: 'c30b0fcd-f44a-4cb4-9585-1e0bc4b9383c',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.BOARD_LAST_RUN_AT,
      position: 6,
      size: 180,
      isVisible: true,
    },
    {
      universalIdentifier: 'dfaedbfd-a216-4e36-a83d-1869518e69cc',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.BOARD_MATCH_COUNT,
      position: 7,
      size: 140,
      isVisible: true,
    },
    {
      universalIdentifier: '5e15d1cd-c167-428b-8556-2dc4f789adeb',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.BOARD_LAST_ERROR,
      position: 8,
      size: 260,
      isVisible: true,
    },
  ],
});
