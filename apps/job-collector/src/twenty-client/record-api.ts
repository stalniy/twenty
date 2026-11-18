export type Graphql = <TData>(
  query: string,
  variables?: Record<string, unknown>,
) => Promise<TData>;

type Connection<TRecord> = {
  edges: { node: TRecord }[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

export const listRecords = async <TRecord>(
  graphql: Graphql,
  collection: string,
  selection: string,
  filter: string | { type: string; value: Record<string, unknown> } = '',
): Promise<TRecord[]> => {
  const filterArgument =
    typeof filter === 'string' ? filter : ',filter:$recordFilter';
  const filterVariable = typeof filter === 'string' ? undefined : filter;
  const variableDeclaration = filterVariable
    ? `,$recordFilter:${filterVariable.type}`
    : '';
  const records: TRecord[] = [];
  let after: string | null = null;
  do {
    const data: Record<string, Connection<TRecord>> = await graphql(
      `query List($after:String${variableDeclaration}){${collection}(first:100,after:$after${filterArgument}){edges{node{${selection}}}pageInfo{hasNextPage endCursor}}}`,
      { after, ...(filterVariable && { recordFilter: filterVariable.value }) },
    );
    const connection: Connection<TRecord> = data[collection];
    records.push(...connection.edges.map(({ node }) => node));
    const { hasNextPage, endCursor } = connection.pageInfo;
    if (hasNextPage && (!endCursor || endCursor === after)) {
      throw new Error(
        `Twenty returned an invalid pagination cursor for ${collection}.`,
      );
    }
    after = hasNextPage ? endCursor : null;
  } while (after);
  return records;
};

export const fieldEquals = (field: string, value: string) =>
  `,filter:{${field}:{eq:${JSON.stringify(value)}}}`;

export const createRecord = async (
  graphql: Graphql,
  object: string,
  data: Record<string, unknown>,
  upsert = false,
) => {
  await graphql(
    `mutation Create($data:${object}CreateInput!){create${object}(data:$data${upsert ? ',upsert:true' : ''}){id}}`,
    { data },
  );
};

export const updateRecord = async (
  graphql: Graphql,
  object: string,
  id: string,
  data: Record<string, unknown>,
) => {
  await graphql(
    `mutation Update($id:UUID!,$data:${object}UpdateInput!){update${object}(id:$id,data:$data){id}}`,
    { id, data },
  );
};

type NewRecord = { id: string } & Record<string, unknown>;

export const createMissingRecords = async (
  graphql: Graphql,
  object: string,
  plural: string,
  records: NewRecord[],
) => {
  for (let offset = 0; offset < records.length; offset += 50) {
    const batch = records.slice(offset, offset + 50);
    const pendingRecords = async () => {
      const existing = await listRecords<{ id: string }>(
        graphql,
        plural,
        'id',
        `,filter:{id:{in:${JSON.stringify(batch.map(({ id }) => id))}}}`,
      );
      const existingIds = new Set(existing.map(({ id }) => id));
      return batch.filter(({ id }) => !existingIds.has(id));
    };
    let pending = await pendingRecords();
    while (pending.length) {
      try {
        await graphql(
          `mutation CreateMany($data:[${object}CreateInput!]!){create${plural[0].toUpperCase()}${plural.slice(1)}(data:$data){id}}`,
          { data: pending },
        );
        break;
      } catch (error) {
        const remaining = await pendingRecords();
        if (remaining.length >= pending.length) throw error;
        pending = remaining;
      }
    }
  }
};
