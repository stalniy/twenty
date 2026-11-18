import { z } from 'zod';

export const JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER = z
  .uuid()
  .parse(process.env.JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER);

export const JOB_POSITION_FIELDS = {
  NAME: 'f6bfa6e7-5c21-5c97-8def-b2e10c78b278',
  COMPANY: 'd2c60263-6dbd-4cb1-9ead-458de91d9ae3',
  STATUS: 'f361a499-c8fb-4bbd-a955-6ddbe5e8a800',
  LOCATION: '88d00001-ef7c-4c50-93ff-83e01159f438',
  SALARY: '0090ef98-b777-4fff-9f90-bec7b688c7d5',
  JOB_URL: '0f132193-4162-4d48-93c4-c9f7c09ee026',
  MENTIONS_TYPESCRIPT: 'c4c2465c-b3bf-4ea6-a8e7-c9ac5e7a6fb2',
  MINIMUM_SALARY_USD: '0ffa536b-92b3-4151-8b0a-298dff82572d',
} as const;
