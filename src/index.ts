import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import prisma from "@/db/prisma";
import responseHandler from "./middleware/response.handler";
import eventRouter from "@/routers/event.router";
import memberRouter from "./routers/member.router";
import userRouter from "./routers/user.router";
import { blockSignup } from "./middleware/block-signup.middleware";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import projectRouter from "./routers/project.router";
import tagRouter from "./routers/tag.router";

const app = express();
const port = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(cookieParser());
app.use((req: Request, res: Response, next: NextFunction) => responseHandler(req, res, next));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use((req: Request, _res: Response, next: NextFunction) => {
  if (NODE_ENV === "development") {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// Block public user registration
app.use(blockSignup);

app.all("/api/auth/{*any}", toNodeHandler(auth));


app.use('/api/members', memberRouter);
app.use('/api/users', userRouter);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

app.get("/api/status", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      message: "API is running",
      version: "1.0.0",
      environment: NODE_ENV,
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      message: "API is running, but DB connection failed",
      environment: NODE_ENV,
      database: "disconnected",
      error: (error as Error).message,
    });
  }
});

app.use("/api/event", eventRouter);
app.use("/api/members", memberRouter);
app.use("/api/projects", projectRouter);
app.use("/api/tags", tagRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// FOR TESTING
export default app;
