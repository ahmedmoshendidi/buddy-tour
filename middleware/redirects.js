// Redirect middleware for domain and HTTPS enforcement
const redirectMiddleware = (req, res, next) => {
  const host = req.hostname;

  // Railway → Official domain
  if (host === "buddy-tour-production.up.railway.app") {
    return res.redirect(301, "https://buddytourguide.com" + req.originalUrl);
  }

  // www → apex domain
  if (host === "www.buddytourguide.com") {
    return res.redirect(301, "https://buddytourguide.com" + req.originalUrl);
  }

  // Force HTTPS (skip for local development)
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.");
  if (req.protocol === "http" && !isLocal) {
    return res.redirect(301, "https://" + host + req.originalUrl);
  }

  next();
};

module.exports = redirectMiddleware;