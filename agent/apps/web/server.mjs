import { createServer as createHttpsServer } from "https";
import { createServer as createHttpServer } from "http";
import { parse } from "url";
import next from "next";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localsongbird.com";
const port = parseInt(process.env.PORT || "8188", 10);
const useHttps = process.env.USE_HTTPS === "true";

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const requestHandler = async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  };

  let server;

  if (useHttps) {
    // HTTPS server with self-signed certificate
    const httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, ".certs/key.pem")),
      cert: fs.readFileSync(path.join(__dirname, ".certs/cert.pem")),
    };

    server = createHttpsServer(httpsOptions, requestHandler);
    console.log(`🔒 HTTPS enabled`);
  } else {
    // HTTP server (default)
    server = createHttpServer(requestHandler);
  }

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    const protocol = useHttps ? "https" : "http";
    console.log(`✅ Ready on ${protocol}://${hostname}:${port}`);
  });
});
