import { describe, expect, it, vi } from 'vitest';
import { RestApiClient } from 'twenty-client-sdk/rest';

import { createDashboardMatchingClient } from '../dashboard-matching-client';

const POSITION_ID = '026330dc-bd4b-4d74-8d79-d9ed85037365';
const PERSON_ID = 'b648f321-9ed8-4490-ae5f-851846d333cc';
const OTHER_POSITION_ID = 'c52f77c4-0a5a-48df-a41e-20837e943e71';

describe('dashboard matching', () => {
  it('loads filtered jobs without starting any scoring', async () => {
    const request = vi.fn<typeof fetch>(async () =>
      Response.json({
        data: {
          jobpositions: {
            edges: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }),
    );
    const client = new RestApiClient({
      baseUrl: 'https://twenty.example.com',
      token: 'test-token',
      fetch: request,
    });
    expect(await createDashboardMatchingClient(client).listJobs(true)).toEqual(
      [],
    );
    const body = JSON.parse(String(request.mock.calls[0][1]?.body));
    expect(body.query).toContain('mentionsTypeScript:{eq:true}');
    expect(body.query).toContain(
      'or:[{location:{is:NULL}},{location:{eq:""}},{location:{ilike:"%Remote%"}}]',
    );
    expect(body.query).toContain('salaryMinimumUsd:{gt:100000}');
    expect(body.query).not.toContain('mutation');
  });

  it.each([true, false])(
    'sends exactly the chosen jobs to the published workflow (single=%s)',
    async (single) => {
      const request = vi.fn<typeof fetch>(async (_url, options) => {
        const { query } = JSON.parse(String(options?.body));
        return Response.json({
          data: query.includes('coreWorkflows(')
            ? {
                coreWorkflows: {
                  pageInfo: { hasNextPage: false, endCursor: null },
                  edges: [
                    {
                      node: {
                        name: single
                          ? 'Match this job to my CV'
                          : 'Match selected jobs to my CV',
                        lastPublishedCoreWorkflowVersionId:
                          '7550ceb9-8466-4089-8372-96ce9b358eee',
                      },
                    },
                  ],
                },
              }
            : { runCoreWorkflowVersion: { workflowRunId: 'run-id' } },
        });
      });
      const client = new RestApiClient({
        baseUrl: 'https://twenty.example.com',
        token: 'test-token',
        fetch: request,
      });
      const ids = single ? [POSITION_ID] : [POSITION_ID, OTHER_POSITION_ID];
      expect(
        await createDashboardMatchingClient(client).startMatching(
          ids,
          single,
          PERSON_ID,
        ),
      ).toBe('run-id');
      expect(
        JSON.parse(String(request.mock.calls[1][1]?.body)).variables.input,
      ).toEqual({
        coreWorkflowVersionId: '7550ceb9-8466-4089-8372-96ce9b358eee',
        payload: single
          ? { id: POSITION_ID, personId: PERSON_ID }
          : { jobpositions: ids.map((id) => ({ id })), personId: PERSON_ID },
      });
    },
  );

  it('rejects an empty selection and multiple jobs for the single-job action', async () => {
    const request = vi.fn<typeof fetch>();
    const client = new RestApiClient({
      baseUrl: 'https://twenty.example.com',
      token: 'test-token',
      fetch: request,
    });
    await expect(
      createDashboardMatchingClient(client).startMatching([], false, PERSON_ID),
    ).rejects.toThrow();
    await expect(
      createDashboardMatchingClient(client).startMatching(
        [POSITION_ID, OTHER_POSITION_ID],
        true,
        PERSON_ID,
      ),
    ).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
});

it('loads all selected records using the CRM selection filter', async () => {
  const request = vi.fn<typeof fetch>(async () =>
    Response.json({
      data: {
        jobpositions: {
          edges: [{ node: { id: POSITION_ID } }],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    }),
  );
  const client = new RestApiClient({
    baseUrl: 'https://twenty.example.com',
    token: 'test-token',
    fetch: request,
  });
  const filter = { not: { id: { in: [OTHER_POSITION_ID] } } };
  await expect(
    createDashboardMatchingClient(client).listSelectedJobs([], filter),
  ).resolves.toEqual([{ id: POSITION_ID }]);
  const { query, variables } = JSON.parse(
    String(request.mock.calls[0][1]?.body),
  );
  expect(query).toContain('filter:$recordFilter');
  expect(variables.recordFilter).toEqual(filter);
});
