import https from "node:https";

function githubApiIp() {
  return process.env.APP_FACTORY_GITHUB_API_IP || process.env.GITHUB_API_IP || "";
}

function githubComIp() {
  return process.env.APP_FACTORY_GITHUB_COM_IP || process.env.APP_FACTORY_GITHUB_IP || "";
}

export async function githubApiFetch(apiPath, options = {}) {
  const ip = githubApiIp();
  if (!ip) {
    return fetch(`https://api.github.com${apiPath}`, options);
  }

  return new Promise((resolve, reject) => {
    const body = options.body;
    const request = https.request({
      hostname: ip,
      port: 443,
      path: apiPath,
      method: options.method || "GET",
      servername: "api.github.com",
      headers: {
        "User-Agent": "ViberMode-App-Factory",
        ...(options.headers || {}),
        Host: "api.github.com",
      },
    }, (response) => {
      const chunks = [];
      response.setEncoding("utf8");
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const text = chunks.join("");
        resolve({
          status: response.statusCode,
          statusText: response.statusMessage,
          text: async () => text,
        });
      });
    });

    request.on("error", reject);
    request.setTimeout(Number(process.env.APP_FACTORY_GITHUB_API_TIMEOUT_MS || 30000), () => {
      request.destroy(new Error("GitHub API request timed out"));
    });

    if (body) request.write(body);
    request.end();
  });
}

export function githubGitConfigEnv({ token, repoUrl = "https://github.com" } = {}) {
  try {
    const parsed = new URL(repoUrl);
    if (parsed.hostname !== "github.com" || !parsed.protocol.startsWith("http")) {
      return {};
    }
  } catch {
    return {};
  }

  const entries = [];
  if (token) {
    entries.push([
      "http.https://github.com/.extraheader",
      `Authorization: Basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}`,
    ]);
  }

  const ip = githubComIp();
  if (ip) {
    entries.push(["http.curloptResolve", `github.com:443:${ip}`]);
  }

  return entries.reduce((env, [key, value], index) => ({
    ...env,
    GIT_CONFIG_COUNT: String(entries.length),
    [`GIT_CONFIG_KEY_${index}`]: key,
    [`GIT_CONFIG_VALUE_${index}`]: value,
  }), {});
}
