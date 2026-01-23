// routes/auth.ts
import express from "express";
import { validate } from "../middleware/validate";
import { loginSchema } from "../schema/auth";
import { login } from "../controller/auth";

const authRouter = express.Router();

authRouter.post("/login", validate({ body: loginSchema }), login);

export { authRouter };
