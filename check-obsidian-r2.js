const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const HttpProxyAgent = require("http-proxy-agent");
const HttpsProxyAgent = require("https-proxy-agent");

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const agentConfig = proxyUrl ? {
  httpAgent: new HttpProxyAgent(proxyUrl),
  httpsAgent: new HttpsProxyAgent(proxyUrl),
} : {};

const R2 = new S3Client({
  region: "auto",
  endpoint: "https://d640993e1d64418cf6c1cd70ada214b8.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "d640993e1d64418cf6c1cd70ada214b8",
    secretAccessKey: "f239548964dd946ae105d31841744e20b08be697746a635a4e9415f221c7f708",
  },
  ...agentConfig,
});

async function checkObsidianR2() {
  try {
    console.log("Checking obsidian-pdf bucket...\n");

    // 奥義/01_土木共通 の全ファイルをリスト
    const cmd = new ListObjectsV2Command({
      Bucket: "obsidian-pdf",
      Prefix: "奥義/01_土木共通/",
      MaxKeys: 1000,
    });

    const resp = await R2.send(cmd);
    const files = resp.Contents || [];

    console.log(`Found ${files.length} files in 奥義/01_土木共通/\n`);

    if (files.length === 0) {
      console.log("No files found in this directory.\n");
    } else {
      console.log("Files:");
      files.forEach((file) => {
        const ext = file.Key.split(".").pop();
        console.log(` - ${file.Key} (${file.Size} bytes, ${new Date(file.LastModified).toISOString()})`);
      });

      // ファイルタイプの集計
      const types = {};
      files.forEach((file) => {
        const ext = file.Key.split(".").pop();
        types[ext] = (types[ext] || 0) + 1;
      });

      console.log("\nFile types:");
      Object.entries(types).forEach(([ext, count]) => {
        console.log(` - .${ext}: ${count} files`);
      });
    }
  } catch (e) {
    console.error("Error:", e.message);
    if (e["$metadata"]) {
      console.error("HTTP status:", e["$metadata"].httpStatusCode);
    }
  }
}

checkObsidianR2();
