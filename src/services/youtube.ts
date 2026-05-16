/// <reference types="vite/client" />

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  bannerUrl?: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
  publishedAt: string;
  country?: string;
  customUrl?: string;
  uploadsPlaylistId?: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  duration?: string;
}

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const isYouTubeKeyAvailable = !!API_KEY;

function checkYouTubeError(data: any) {
  if (data?.error?.message) {
    if (data.error.errors?.some((e: any) => e.reason === 'quotaExceeded')) {
      throw new Error("YouTube API quota exceeded. Please try again tomorrow.");
    }
    throw new Error(data.error.message.replace(/<[^>]*>?/gm, ''));
  }
}

export async function searchYouTubeChannel(query: string): Promise<YouTubeChannel | null> {
  if (!API_KEY) throw new Error("YouTube API Key is missing. Please add VITE_YOUTUBE_API_KEY to your environment variables.");
  
  // 1. Search for the channel ID
  const searchUrl = `${BASE_URL}/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&key=${API_KEY}&maxResults=1`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  checkYouTubeError(searchData);

  if (!searchData.items || searchData.items.length === 0) {
    return null;
  }

  const channelId = searchData.items[0].snippet.channelId;

  // 2. Fetch channel statistics and content details
  const statsUrl = `${BASE_URL}/channels?part=snippet,statistics,brandingSettings,contentDetails&id=${channelId}&key=${API_KEY}`;
  const statsRes = await fetch(statsUrl);
  const statsData = await statsRes.json();
  checkYouTubeError(statsData);

  if (!statsData.items || statsData.items.length === 0) {
    return null;
  }

  const item = statsData.items[0];
  return {
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: item.snippet.thumbnails.high.url,
    bannerUrl: item.brandingSettings?.image?.bannerExternalUrl,
    subscriberCount: item.statistics.subscriberCount,
    viewCount: item.statistics.viewCount,
    videoCount: item.statistics.videoCount,
    publishedAt: item.snippet.publishedAt,
    country: item.snippet.country || item.brandingSettings?.channel?.country,
    customUrl: item.snippet.customUrl,
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads,
  };
}

export async function getRecentChannelVideos(channelId: string, uploadsPlaylistId?: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
  if (!API_KEY) throw new Error("YouTube API Key is missing.");

  let videoIds: string;

  // 1. Get recent videos (Optimized to use playlistItems if possible to save 99% quota cost)
  if (uploadsPlaylistId) {
    const playlistUrl = `${BASE_URL}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${API_KEY}`;
    const playlistRes = await fetch(playlistUrl);
    const playlistData = await playlistRes.json();
    checkYouTubeError(playlistData);
    if (!playlistData.items || playlistData.items.length === 0) return [];
    videoIds = playlistData.items.map((item: any) => item.contentDetails.videoId).join(',');
  } else {
    const searchUrl = `${BASE_URL}/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=${maxResults}&key=${API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    checkYouTubeError(searchData);
    if (!searchData.items || searchData.items.length === 0) return [];
    videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
  }

  // 2. Fetch all statistics for those videos in one single request
  const statsUrl = `${BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`;
  const statsRes = await fetch(statsUrl);
  const statsData = await statsRes.json();
  checkYouTubeError(statsData);

  return statsData.items.map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: item.snippet.thumbnails.high.url,
    publishedAt: item.snippet.publishedAt,
    viewCount: item.statistics.viewCount || '0',
    likeCount: item.statistics.likeCount || '0',
    commentCount: item.statistics.commentCount || '0',
    duration: item.contentDetails?.duration,
  }));
}

export async function getTrendingVideosInNiche(query: string, maxResults: number = 12): Promise<any[]> {
  if (!API_KEY) throw new Error("YouTube API Key is missing.");

  // Get videos from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const publishedAfter = thirtyDaysAgo.toISOString();

  const searchUrl = `${BASE_URL}/search?part=snippet&type=video&q=${encodeURIComponent(query)}&publishedAfter=${publishedAfter}&order=viewCount&maxResults=${maxResults}&key=${API_KEY}`;
  
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  checkYouTubeError(searchData);
  if (!searchData.items || searchData.items.length === 0) return [];
  
  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
  
  const statsUrl = `${BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`;
  const statsRes = await fetch(statsUrl);
  const statsData = await statsRes.json();
  checkYouTubeError(statsData);

  return statsData.items.map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: item.snippet.thumbnails.high.url,
    publishedAt: item.snippet.publishedAt,
    viewCount: item.statistics.viewCount || '0',
    likeCount: item.statistics.likeCount || '0',
    commentCount: item.statistics.commentCount || '0',
    duration: item.contentDetails?.duration,
    channelTitle: item.snippet.channelTitle,
    channelId: item.snippet.channelId
  }));
}
