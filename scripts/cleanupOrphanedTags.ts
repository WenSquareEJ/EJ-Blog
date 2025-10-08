#!/usr/bin/env node
/**
 * Cleanup orphaned tags that have no approved posts
 * Run with: npx tsx scripts/cleanupOrphanedTags.ts
 */

import { getServiceClient } from '../lib/supabaseService';

async function cleanupOrphanedTags() {
  const supabase = getServiceClient();
  
  console.log('🔍 Finding orphaned tags...');
  
  // First, let's see current tag counts
  const { data: currentTags, error: currentError } = await supabase
    .rpc('get_tag_counts_by_status');
  
  if (currentError) {
    console.log('ℹ️  Custom RPC not available, using manual query...');
    
    // Manual approach: Get tags and check their approved post counts
    const { data: tagsData, error: tagsError } = await supabase
      .from('tags')
      .select(`
        id,
        name,
        slug,
        post_tags (
          post_id,
          posts!inner (
            id,
            status
          )
        )
      `);
    
    if (tagsError) {
      console.error('❌ Error fetching tags:', tagsError);
      return;
    }
    
    const orphanedTags = (tagsData || []).filter(tag => {
      const approvedPosts = (tag.post_tags || []).filter(pt => 
        pt.posts && Array.isArray(pt.posts) && pt.posts.some(p => p.status === 'approved')
      );
      return approvedPosts.length === 0;
    });
    
    console.log(`📊 Found ${orphanedTags.length} orphaned tags:`);
    orphanedTags.forEach(tag => {
      const totalPosts = tag.post_tags?.length || 0;
      console.log(`  - ${tag.name} (${totalPosts} total posts, 0 approved)`);
    });
    
    if (orphanedTags.length === 0) {
      console.log('✅ No orphaned tags to clean up!');
      return;
    }
    
    // Remove post_tags entries for non-approved posts first
    console.log('🧹 Removing post_tags entries for non-approved posts...');
    
    const { error: cleanupError } = await supabase
      .from('post_tags')
      .delete()
      .in('post_id', [])  // We'll need to get these IDs first
      .select();
    
    // Get non-approved post IDs
    const { data: nonApprovedPosts } = await supabase
      .from('posts')
      .select('id')
      .not('status', 'eq', 'approved');
    
    if (nonApprovedPosts && nonApprovedPosts.length > 0) {
      const nonApprovedIds = nonApprovedPosts.map(p => p.id);
      
      const { error: cleanupPostTagsError } = await supabase
        .from('post_tags')
        .delete()
        .in('post_id', nonApprovedIds);
      
      if (cleanupPostTagsError) {
        console.error('❌ Error cleaning up post_tags:', cleanupPostTagsError);
        return;
      }
      
      console.log(`✅ Removed ${nonApprovedIds.length} post_tags entries for non-approved posts`);
    }
    
    // Remove orphaned tags
    console.log('🧹 Removing orphaned tags...');
    
    const orphanedTagIds = orphanedTags.map(tag => tag.id);
    const { error: deleteTagsError } = await supabase
      .from('tags')
      .delete()
      .in('id', orphanedTagIds);
    
    if (deleteTagsError) {
      console.error('❌ Error deleting orphaned tags:', deleteTagsError);
      return;
    }
    
    console.log(`✅ Deleted ${orphanedTagIds.length} orphaned tags`);
    
  } else {
    console.log('📊 Current tag status:', currentTags);
  }
  
  // Verify cleanup
  console.log('🔍 Verifying cleanup...');
  
  const { data: remainingTags, error: verifyError } = await supabase
    .from('tags')
    .select(`
      id,
      name,
      slug,
      post_tags (
        posts!inner (
          status
        )
      )
    `);
  
  if (verifyError) {
    console.error('❌ Error verifying cleanup:', verifyError);
    return;
  }
  
  const tagsWithCounts = (remainingTags || []).map(tag => {
    const approvedCount = (tag.post_tags || []).filter(pt => 
      Array.isArray(pt.posts) && pt.posts.some(p => p.status === 'approved')
    ).length;
    
    return {
      name: tag.name,
      slug: tag.slug,
      approvedPosts: approvedCount
    };
  });
  
  const stillOrphaned = tagsWithCounts.filter(tag => tag.approvedPosts === 0);
  
  if (stillOrphaned.length === 0) {
    console.log('🎉 Cleanup complete! All remaining tags have approved posts.');
  } else {
    console.log(`⚠️  Still ${stillOrphaned.length} tags with 0 approved posts:`);
    stillOrphaned.forEach(tag => {
      console.log(`  - ${tag.name}`);
    });
  }
  
  console.log(`📊 Final summary: ${tagsWithCounts.length} tags remaining`);
  tagsWithCounts
    .sort((a, b) => b.approvedPosts - a.approvedPosts)
    .slice(0, 10)
    .forEach(tag => {
      console.log(`  ${tag.name}: ${tag.approvedPosts} approved posts`);
    });
}

// Run the cleanup
cleanupOrphanedTags().catch(console.error);