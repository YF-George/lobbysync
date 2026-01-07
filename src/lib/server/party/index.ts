import type { Party, PartyServer, PartyConnection, PartyRequest } from 'partykit/server';
import { onConnect } from 'y-partykit/server';
import * as Y from 'yjs';

export default class LobbysyncServer implements PartyServer {
  constructor(public party: Party) {}

  async onConnect(conn: PartyConnection, ctx: { request: PartyRequest }) {
    const url = new URL(ctx.request.url);
    const userId = url.searchParams.get('userId') || 'anonymous';
    const userName = url.searchParams.get('userName') || '神秘玩家';

    return onConnect(conn, this.party, {
      persist: true,

      callback: {
        handler: async (doc: Y.Doc) => {
          try {
            // 將完整狀態以 State Update 形式寫回 PartyKit KV（非正式 DB）
            const update = Y.encodeStateAsUpdate(doc);
            await this.party.storage.set('yjs-snapshot', update);
          } catch (err) {
            console.warn('[Party Persist Warning] 無法寫入 KV:', err);
          }
        }
      },

      async load() {
        // 先嘗試從 PartyKit KV 載入（Level 2），若無，回傳新的 Y.Doc
        try {
          const raw = await this.party.storage.get<Uint8Array>('yjs-snapshot');
          if (raw) {
            const doc = new Y.Doc();
            // raw 可能為 Buffer 或 Uint8Array
            const update = raw instanceof Uint8Array ? raw : new Uint8Array(raw as any);
            Y.applyUpdate(doc, update);
            return doc;
          }
        } catch (err) {
          console.warn('[Party Load Warning] 無法從 KV 載入:', err);
        }
        return new Y.Doc();
      }
    });
  }

  async onClose(conn: PartyConnection) {
    const connections = [...this.party.getConnections()];
    if (connections.length === 0) {
      await this.persistToDatabase();
    }
  }

  async persistToDatabase() {
    try {
      const ydocData = await this.party.storage.get<Uint8Array>('yjs-snapshot');
      if (!ydocData) return;

      console.log(`[Persist] 房間 ${this.party.id} 正在落庫中...`);

      const baseUrl = process.env.SVELTEKIT_URL || 'http://localhost:5173';
      const body = {
        roomId: this.party.id,
        yjs_state: Buffer.from(ydocData).toString('base64')
      };

      const response = await fetch(`${baseUrl}/api/rooms/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        console.log(`[Persist] 房間 ${this.party.id} 落庫成功`);
      } else {
        console.error('[Persist] API 回傳錯誤', response.status, await response.text());
      }
    } catch (err) {
      console.error('[Persist Error] 失敗:', err);
    }
  }

  async onAlarm() {
    await this.persistToDatabase();
    try {
      await this.party.storage.setAlarm(Date.now() + 5 * 60 * 1000);
    } catch (err) {
      console.warn('[Alarm Warning] 無法設定鬧鐘:', err);
    }
  }
}
