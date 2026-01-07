import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { auditLogs } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async ({ params }) => {
  try {
    const rows = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.roomId, params.roomId))
      .orderBy(auditLogs.createdAt, 'desc')
      .limit(200);

    return json(rows);
  } catch (err) {
    console.error('Fetch logs error', err);
    return json({ error: 'failed' }, { status: 500 });
  }
};
