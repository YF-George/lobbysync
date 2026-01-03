import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
  const partyId = params.id;
  
  try {
    const res = await fetch(`/api/party/${partyId}`);
    
    if (!res.ok) {
      console.error(`Failed to fetch party ${partyId}:`, res.status, res.statusText);
      throw error(res.status, '找不到指定的團隊');
    }
    
    const data = await res.json();
    
    if (!data.party) {
      throw error(404, '團隊資料不完整');
    }
    
    return {
      party: data.party,
      slots: data.slots || []
    };
  } catch (err: any) {
    console.error('Error loading party:', err);
    throw error(500, '無法載入團隊資料');
  }
};
