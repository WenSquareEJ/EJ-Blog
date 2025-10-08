#!/usr/bin/env node
/**
 * Cleanup duplicate reactions from legacy likes system
 * Run with: npx tsx scripts/cleanupDuplicateReactions.ts
 */

import { getServiceClient } from '../lib/supabaseService';

async function cleanupDuplicateReactions() {
  const supabase = getServiceClient();
  
  console.log('🔍 Finding duplicate reactions...');
  
  // Find all anonymous reactions grouped by target_id
  const { data: reactions, error } = await supabase
    .from('reactions')
    .select('id, target_id, created_at')
    .eq('target_type', 'post')
    .eq('kind', 'like')
    .is('user_id', null)
    .order('target_id', { ascending: true })
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching reactions:', error);
    return;
  }
  
  if (!reactions || reactions.length === 0) {
    console.log('✅ No reactions found');
    return;
  }
  
  // Group by target_id and find duplicates
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.target_id]) {
      acc[reaction.target_id] = [];
    }
    acc[reaction.target_id].push(reaction);
    return acc;
  }, {} as Record<string, typeof reactions>);
  
  const duplicateGroups = Object.values(groupedReactions).filter(group => group.length > 1);
  
  console.log(`📊 Found ${duplicateGroups.length} target_ids with duplicates`);
  
  let totalDeleted = 0;
  
  // For each duplicate group, keep the most recent and delete the rest
  for (const group of duplicateGroups) {
    const [keep, ...toDelete] = group; // First item is most recent due to ordering
    
    console.log(`🧹 Cleaning target_id: ${keep.target_id} (${group.length} reactions, keeping most recent: ${keep.created_at})`);
    
    const idsToDelete = toDelete.map(r => r.id);
    
    const { error: deleteError } = await supabase
      .from('reactions')
      .delete()
      .in('id', idsToDelete);
    
    if (deleteError) {
      console.error(`❌ Error deleting reactions for ${keep.target_id}:`, deleteError);
    } else {
      console.log(`✅ Deleted ${idsToDelete.length} duplicate reactions for ${keep.target_id}`);
      totalDeleted += idsToDelete.length;
    }
  }
  
  console.log(`🎉 Cleanup complete! Deleted ${totalDeleted} duplicate reactions`);
  
  // Verify cleanup
  console.log('🔍 Verifying cleanup...');
  const { data: remainingDuplicates } = await supabase
    .rpc('count_reaction_duplicates');
  
  if (remainingDuplicates === 0) {
    console.log('✅ No duplicates remaining - cleanup successful!');
  } else {
    console.log(`⚠️  Still ${remainingDuplicates} duplicates found`);
  }
}

// Run the cleanup
cleanupDuplicateReactions().catch(console.error);