import { afterEach, expect, it, vi } from 'vitest';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { createCollectionRepository } from '../create-collection-repository';
import { BOARD, createJob } from '../../services/__tests__/fixtures';
import { JD_MATCH_ASSESSMENT } from '../../services/__tests__/jd-match-fixture';
import { WEIGHTED_REQUIREMENT_SCORING } from '../../services/jd-match-assessment.service';
import { prepareProfileMatches } from '../../services/profile-matching.service';
import { salaryFields } from '../../utils/salary-fields.util';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('saves a validated assessment for the specified Person and posting', async () => {
  const postingId = 'b648f321-9ed8-4490-ae5f-851846d333cc';
  const personId = 'af7b810d-3eea-462e-88e6-bb31321ec230';
  const posting = {
    id: postingId,
    name: 'Engineer',
    description: 'No listed qualifications.',
    location: null,
    workplaceType: null,
    salaryText: null,
    jobPositionId: null,
  };
  const cv = {
    id: personId,
    name: 'Candidate',
    personId,
    targetRole: 'Engineer',
    importStatus: 'COMPLETE',
  };
  const fingerprint = prepareProfileMatches(
    [posting],
    'Candidate\nEngineer\nSUMMARY\nEXPERIENCE\nPROJECTS\nSKILLS\nEDUCATION, QUALIFICATIONS & LANGUAGES',
    1,
  ).candidates[0].fingerprint;
  const request = vi.fn<typeof fetch>(async (_url, options) => {
    const { query } = JSON.parse(String(options?.body));
    const collection = query.match(/\{(job\w+)\(first:/)?.[1];
    if (!collection)
      return Response.json({
        data: { createJobPersonAssessment: { id: postingId } },
      });
    const matchingRecords =
      collection === 'jobMasterCvs'
        ? [cv]
        : collection === 'jobSourcePostings'
          ? [posting]
          : [];
    return Response.json({
      data: {
        [collection]: {
          edges: matchingRecords.map((node) => ({ node })),
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    });
  });
  const client = new RestApiClient({
    baseUrl: 'https://twenty.example.com',
    token: 'test-token',
    fetch: request,
  });
  await createCollectionRepository(client).saveProfileMatch({
    personId,
    postingId,
    fingerprint,
    linkedJson: '[]',
    assessment: JSON.stringify(JD_MATCH_ASSESSMENT),
  });
  const requests = request.mock.calls.map(([, options]) =>
    JSON.parse(String(options?.body)),
  );
  expect(
    requests.find(({ query }) => query.includes('jobPersonAssessments(')).query,
  ).toContain(`personId:{eq:"${personId}"}`);
  const { variables } = requests.find(({ query }) =>
    query.includes('createJobPersonAssessment('),
  );
  expect(variables.data).toMatchObject({
    id: expect.any(String),
    personId,
    sourcePostingId: postingId,
    matchFingerprint: fingerprint,
    profileMatchedAt: expect.any(String),
    scoringMethod: WEIGHTED_REQUIREMENT_SCORING,
    fitScore: null,
  });
});

it('rejects a malformed AI assessment without writing to the API', async () => {
  const request = vi.fn<typeof fetch>();
  const client = new RestApiClient({
    baseUrl: 'https://twenty.example.com',
    token: 'test-token',
    fetch: request,
  });
  await expect(
    createCollectionRepository(client).saveProfileMatch({
      personId: 'af7b810d-3eea-462e-88e6-bb31321ec230',
      postingId: 'b648f321-9ed8-4490-ae5f-851846d333cc',
      fingerprint: 'a'.repeat(64),
      assessment: '{"fitScore":200}',
    }),
  ).rejects.toThrow();
  expect(request).not.toHaveBeenCalled();
});

it('uses the collector API address when the worker cannot reach the public localhost URL', async () => {
  vi.stubEnv('TWENTY_API_URL', 'http://localhost:3000');
  vi.stubEnv('COLLECTOR_API_URL', 'http://server:3000');
  vi.stubEnv('TWENTY_APP_APPLICATION_ACCESS_TOKEN', 'test-token');
  const request = vi.fn<typeof fetch>().mockImplementation(async () =>
    Response.json({
      data: {
        jobpositions: {
          edges: [],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    }),
  );
  vi.stubGlobal('fetch', request);
  await createCollectionRepository().repository.listPositions();
  expect(request.mock.calls[0][0]).toBe('http://server:3000/graphql');
});

it.each([
  ['http://server:3000', 'http://server:3000/graphql'],
  ['', 'http://localhost:3000/graphql'],
])(
  'falls back to the runtime API configuration when no collector override is set: %s',
  async (internalUrl, expectedUrl) => {
    vi.stubEnv('COLLECTOR_API_URL', '');
    vi.stubEnv('TWENTY_INTERNAL_API_URL', internalUrl);
    vi.stubEnv('TWENTY_API_URL', 'http://localhost:3000');
    vi.stubEnv('TWENTY_APP_APPLICATION_ACCESS_TOKEN', 'test-token');
    const request = vi.fn<typeof fetch>().mockImplementation(async () =>
      Response.json({
        data: {
          jobpositions: {
            edges: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }),
    );
    vi.stubGlobal('fetch', request);
    await createCollectionRepository().repository.listPositions();
    expect(request.mock.calls[0][0]).toBe(expectedUrl);
  },
);

it('creates positions as New and updates existing locations without changing status', async () => {
  const request = vi.fn<typeof fetch>().mockImplementation(async () =>
    Response.json({
      data: {
        createJobposition: {
          id: 'position',
          companyId: BOARD.companyId,
          location: 'Europe',
          joburl: { primaryLinkUrl: createJob().sourceUrl },
        },
      },
    }),
  );
  const client = new RestApiClient({
    baseUrl: 'https://twenty.example.com',
    token: 'test-token',
    fetch: request,
  });
  const { repository } = createCollectionRepository(client);
  const job = createJob();
  await repository.createPosition(BOARD, job, salaryFields(job), 'position');
  const creation = JSON.parse(String(request.mock.calls[0][1]?.body));
  expect(creation.variables.data.status).toBe('NEW');
  expect(creation.query).not.toContain('upsert:true');
  expect(
    JSON.parse(String(request.mock.calls[0][1]?.body)).variables.data.location,
  ).toBe('Europe');
  await repository.updatePositionLocation('position', 'Remote - EMEA');
  expect(JSON.parse(String(request.mock.calls[1][1]?.body)).variables).toEqual({
    id: 'position',
    data: { location: 'Remote - EMEA' },
  });
});

it('seeds boards idempotently and preserves disabled boards', async () => {
  const boards: Record<string, unknown>[] = [];
  const request = vi.fn<typeof fetch>(async (_url, options) => {
    const { query, variables } = JSON.parse(String(options?.body)) as {
      query: string;
      variables: { data: Record<string, unknown>[] };
    };
    const connection = (records: Record<string, unknown>[]) => ({
      edges: records.map((node) => ({ node })),
      pageInfo: { hasNextPage: false, endCursor: null },
    });
    if (query.includes('companies('))
      return Response.json({
        data: {
          companies: connection([
            { id: 'company', name: 'Example', ashbyhqSlug: 'example' },
            { id: 'blank', name: 'Blank', ashbyhqSlug: '' },
          ]),
        },
      });
    if (query.includes('jobCollectorBoards('))
      return Response.json({
        data: { jobCollectorBoards: connection(boards) },
      });
    if (query.includes('createJobCollectorBoards(')) {
      boards.push(...variables.data);
      return Response.json({
        data: { createJobCollectorBoards: variables.data },
      });
    }
    throw new Error('Unexpected operation');
  });
  const client = new RestApiClient({
    baseUrl: 'https://twenty.example.com',
    token: 'test-token',
    fetch: request,
  });
  const { seedBoards } = createCollectionRepository(client);
  expect(await seedBoards('ashbyhqSlug')).toEqual({ created: 1 });
  boards[0].enabled = false;
  expect(await seedBoards('ashbyhqSlug')).toEqual({ created: 0 });
  expect(boards).toHaveLength(1);
  expect(boards[0].enabled).toBe(false);
});

it('backfills a detached posting and a position-only summary without replacing a newer assessment on retry', async () => {
  const personId = 'af7b810d-3eea-462e-88e6-bb31321ec230';
  const otherPersonId = '1a5709d7-8d43-4ba5-a38d-c67dd64abc27';
  const postingId = 'b648f321-9ed8-4490-ae5f-851846d333cc';
  const positionId = 'e799efa8-4c32-464b-9a32-2a2823623581';
  const profileMatchedAt = '2026-11-17T12:00:00.000Z';
  const original = {
    id: postingId,
    fitScore: 30,
    matchReport: 'Original posting report',
    profileMatchedAt,
  };
  const newer = {
    id: 'newer',
    personId,
    sourcePostingId: postingId,
    fitScore: 90,
    matchReport: 'Newer report',
  };
  const other = {
    id: 'other',
    personId: otherPersonId,
    sourcePostingId: postingId,
    fitScore: 12,
  };
  const records: Record<string, Array<Record<string, unknown>>> = {
    jobSourcePostings: [original],
    jobpositions: [
      {
        id: positionId,
        profileFitScore: 75,
        profileMatchReport: 'Position-only report',
        profileMatchedAt,
      },
    ],
    jobPersonLinks: [
      { id: 'other-link', personId: otherPersonId, sourcePostingId: postingId },
    ],
    jobPersonAssessments: [newer, other],
  };
  const request = vi.fn<typeof fetch>(async (_url, options) => {
    const { query, variables } = JSON.parse(String(options?.body));
    const creation = query.match(/create(JobPerson(?:Links|Assessments))\(/);
    if (creation) {
      const [, plural] = creation;
      records[plural[0].toLowerCase() + plural.slice(1)].push(
        ...variables.data,
      );
      return Response.json({ data: { [`create${plural}`]: variables.data } });
    }
    const [, collection] = query.match(/\{(\w+)\(first:100/);
    const matchingPerson = query.match(/personId:\{eq:"([^"]+)"/)?.[1];
    const ids = query.match(/id:\{in:(\[[^\]]*\])/);
    const nodes = records[collection].filter(
      (record) =>
        !query.includes('deletedAt:{is:NOT_NULL}') &&
        (!matchingPerson || record.personId === matchingPerson) &&
        (!ids || JSON.parse(ids[1]).includes(record.id)),
    );
    return Response.json({
      data: {
        [collection]: {
          edges: nodes.map((node) => ({ node })),
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    });
  });
  const client = new RestApiClient({
    baseUrl: 'https://twenty.example.com',
    token: 'test-token',
    fetch: request,
  });
  const repository = createCollectionRepository(client);
  for (let attempt = 0; attempt < 2; attempt++) {
    expect(await repository.backfillJobs(personId)).toMatchObject({
      complete: true,
      sourcePostings: { total: 1, linked: 1, missing: [] },
      jobPositions: { total: 1, linked: 1, missing: [] },
      unresolvedPostingAssessments: [],
      unresolvedPositionSummaries: [],
    });
  }
  expect(records.jobPersonLinks).toHaveLength(3);
  expect(records.jobPersonAssessments).toEqual([
    newer,
    other,
    expect.objectContaining({
      personId,
      legacyPositionId: positionId,
      matchReport: 'Position-only report',
      profileMatchedAt,
    }),
  ]);
  expect(records.jobSourcePostings).toEqual([original]);
});
