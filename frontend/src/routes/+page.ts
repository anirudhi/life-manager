import PocketBase from 'pocketbase';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  const pb = new PocketBase('https://life-manager-database1-wispy-thunder-4413.fly.dev');
  
  try {
    const records = await pb.collection('tasks').getList(1, 50, {
      sort: '-created',
    });

    return {
      tasks: records.items
    };
  } catch (error) {
    console.error('Error loading tasks:', error);
    return {
      tasks: []
    };
  }
};
