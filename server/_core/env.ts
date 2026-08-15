export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  replicateApiToken: process.env.REPLICATE_API_TOKEN ?? "",
  replicateSadTalkerVersion:
    process.env.REPLICATE_SADTALKER_VERSION ??
    "a519cc0cfebaaeade068b23899165a11ec76aaa1d2b313d40d214f204ec957a3",
  replicateVideoRetalkingVersion:
    process.env.REPLICATE_VIDEO_RETALKING_VERSION ??
    "db5a650c807b007dc5f9e5abe27c53e1b62880d1f94d218d27ce7fa802711d67",
  replicateMotionTransferModel: "kwaivgi/kling-v2.6-motion-control",
};
