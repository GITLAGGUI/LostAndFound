// API QUERY FIXES FOR YOUR LOST & FOUND APPLICATION
// These are the correct ways to query your Supabase data

// 1. Fix for lost-items API query
// WRONG (causing foreign key error):
// const { data } = await supabase.from('lost_items').select('*, user_profiles(*)').eq('user_id', userId);

// CORRECT (use the view or proper join):
const fetchLostItems = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('lost_items_with_profiles')  // Use the view we created
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Lost items fetch error:', error);
    // Fallback to basic query without profile join
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('lost_items')
      .select('*')
      .eq('user_id', userId);
    
    return fallbackData || [];
  }
};

// 2. Fix for found-items API query
const fetchFoundItems = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('found_items_with_profiles')  // Use the view we created
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Found items fetch error:', error);
    // Fallback to basic query without profile join
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('found_items')
      .select('*')
      .eq('user_id', userId);
    
    return fallbackData || [];
  }
};

// 3. Fix for matches API query (the OR syntax was wrong)
// WRONG (causing parse error):
// .or(`lost_items.user_id.eq.${userId},found_items.user_id.eq.${userId}`)

// CORRECT (proper OR syntax for PostgREST):
const fetchMatches = async (userId) => {
  try {
    // First get lost items for the user
    const { data: userLostItems } = await supabase
      .from('lost_items')
      .select('id')
      .eq('user_id', userId);
    
    // Then get found items for the user  
    const { data: userFoundItems } = await supabase
      .from('found_items')
      .select('id')
      .eq('user_id', userId);
    
    const lostItemIds = userLostItems?.map(item => item.id) || [];
    const foundItemIds = userFoundItems?.map(item => item.id) || [];
    
    // Get matches where user's items are involved
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        lost_items(*),
        found_items(*)
      `)
      .or(`lost_item_id.in.(${lostItemIds.join(',')}),found_item_id.in.(${foundItemIds.join(',')})`);
    
    if (error) throw error;
    return matches || [];
  } catch (error) {
    console.error('Matches fetch error:', error);
    return [];
  }
};

// 4. Fix for file upload (storage policy issue)
const uploadImage = async (file, userId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('item-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// 5. Fix for creating lost items (RLS policy issue)
const createLostItem = async (itemData, userId) => {
  try {
    const { data, error } = await supabase
      .from('lost_items')
      .insert({
        ...itemData,
        user_id: userId  // Make sure this matches auth.uid()
      })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Lost item creation error:', error);
    throw error;
  }
};

// 6. Fix for creating found items
const createFoundItem = async (itemData, userId) => {
  try {
    const { data, error } = await supabase
      .from('found_items')
      .insert({
        ...itemData,
        user_id: userId  // Make sure this matches auth.uid()
      })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Found item creation error:', error);
    throw error;
  }
};

// 7. Fix for user profile creation/update
const createOrUpdateProfile = async (profileData, userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Profile creation/update error:', error);
    throw error;
  }
};

// 8. Helper function to get current user ID safely
const getCurrentUserId = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user.id;
};

// 9. Example API route fixes (for your /api/ folder)

// api/lost-items/route.js (or similar)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }
    
    const items = await fetchLostItems(userId);
    return Response.json(items);
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, ...itemData } = body;
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }
    
    const newItem = await createLostItem(itemData, userId);
    return Response.json(newItem);
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// EXPORT ALL FUNCTIONS FOR USE
export {
  fetchLostItems,
  fetchFoundItems,
  fetchMatches,
  uploadImage,
  createLostItem,
  createFoundItem,
  createOrUpdateProfile,
  getCurrentUserId
};