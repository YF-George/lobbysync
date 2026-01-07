import * as Y from 'yjs';
import { YPartyKitProvider } from 'y-partykit/provider';

export class RoomSync {
  doc: Y.Doc;
  pages: Y.Map<any>;

  isConnected = false;
  activeTab = 1;

  user: { id: string; name: string } = { id: '', name: '' };
  ownerId = '';
  get isAdmin() {
    return this.user.id === this.ownerId;
  }

  presence: Record<number, number> = {};

  provider: any;

  constructor(roomId: string, user: { id: string; name: string }, ownerId: string, host = 'localhost') {
    this.doc = new Y.Doc();
    this.pages = this.doc.getMap('pages');

    this.user = user;
    this.ownerId = ownerId;

    // 初始化 PartyKit Provider
    this.provider = new YPartyKitProvider(host, roomId, this.doc, {
      params: { userId: user.id, userName: user.name }
    });

    this.provider.on('status', ({ status }: { status: string }) => {
      this.isConnected = status === 'connected';
    });

    // 監聽 Awareness 變動：計算每個分頁有多少人
    this.provider.awareness.on('change', () => {
      const states = this.provider.awareness.getStates();
      const counts: Record<number, number> = {};
      states.forEach((state: any) => {
        const tab = state.activeTab || 1;
        counts[tab] = (counts[tab] || 0) + 1;
      });
      this.presence = counts;
    });
  }

  // 取得當前分頁的 Slots 陣列
  get currentSlots() {
    const page = this.pages.get(`page_${this.activeTab}`) as Y.Map<any>;
    if (!page) return [];
    return (page.get('slots') as Y.Array<any>) || [];
  }

  // 新增一個 Slot（協作或管理員權限）
  addSlot() {
    const slots = this.currentSlots as Y.Array<any>;
    if (slots) {
      const newSlot = new Y.Map();
      newSlot.set('id', crypto.randomUUID());
      newSlot.set('name', '');
      newSlot.set('role', 'DPS');
      newSlot.set('gearScore', 0);
      slots.push([newSlot]);
    }
  }
}
