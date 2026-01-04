import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { party } from '$lib/server/db/schema';

export const POST: RequestHandler = async () => {
	// Creating parties is disabled in this deployment.
	return json({ error: 'Creating parties is disabled' }, { status: 405 });
};

export const GET: RequestHandler = async ({ request: _request }) => {
	try {
		// 取得所有副本，按建立時間倒序排列
		const parties = await db.select().from(party).orderBy(party.created_at);

		return json({
			parties,
			count: parties.length
		});
	} catch (error) {
		console.error('Failed to fetch parties:', error);
		return json(
			{
				error: 'Failed to fetch parties',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
