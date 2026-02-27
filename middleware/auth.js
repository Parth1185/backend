import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  try {
    let token = req.cookies?.token;
    
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = payload.id;
    req.userRole = payload.role;   

    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
}

