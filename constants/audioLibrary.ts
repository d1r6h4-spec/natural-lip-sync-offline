export type AudioTrack = {
  id: string;
  title: string;
  category: "Viral" | "Comedy" | "Cinematic" | "Narration";
  duration: string;
  author: string;
  previewUrl: string;
};

export const BUILTIN_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: "v1",
    title: "Viral Upbeat Pop Drop",
    category: "Viral",
    duration: "0:15",
    author: "Creator Studio",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "v2",
    title: "Trending Club Beat 2026",
    category: "Viral",
    duration: "0:20",
    author: "BeatWave Labs",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "c1",
    title: "Funny Shocked Gasp & Laugh",
    category: "Comedy",
    duration: "0:08",
    author: "Meme Central",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "c2",
    title: "Dramatic Vinyl Record Scratch",
    category: "Comedy",
    duration: "0:05",
    author: "Comedy FX",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  {
    id: "s1",
    title: "Cinematic Epic Trailer Intro",
    category: "Cinematic",
    duration: "0:25",
    author: "Orchestral Sound",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
  {
    id: "n1",
    title: "Confident Tech Startup Pitch",
    category: "Narration",
    duration: "0:18",
    author: "Voice Pro",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  },
];
