import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { rooms } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import * as Y from 'yjs';

export const POST = async ({ request }) => {
  try {
    // basic payload size guard (5MB)
    const contentLength = Number(request.headers.get('content-length') || '0');
    if (contentLength > 5 * 1024 * 1024) {
      return new Response('Payload too large', { status: 413 });
    }

    const { roomId, yjs_state } = await request.json();

    if (!roomId || !yjs_state) {
      return json({ success: false, error: 'missing payload' }, { status: 400 });
    }

    // validate UUID-ish roomId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(roomId)) {
      return json({ success: false, error: 'Invalid Room ID' }, { status: 400 });
    }

    // 將 Base64 轉回 Uint8Array
    const uint8Array = new Uint8Array(Buffer.from(yjs_state, 'base64'));

    // 解析 Yjs 資料生成快照（pages map）
    const tempDoc = new Y.Doc();
    Y.applyUpdate(tempDoc, uint8Array);
    const pagesMap = tempDoc.getMap('pages');
    const snapshot = { pages: pagesMap ? pagesMap.toJSON() : {} };

    // 使用 Drizzle 更新資料庫
    await db.update(rooms)
      .set({
        yjsState: uint8Array,
        contentSnapshot: snapshot,
        updatedAt: new Date()
      })
      .where(eq(rooms.id, roomId));

    return json({ success: true });
  } catch (err) {
    console.error('API Sync Error:', err);
    return json({ success: false }, { status: 500 });
  }
};
