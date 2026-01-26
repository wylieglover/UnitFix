// routes/auth.ts
import express from "express";
import { validate } from "../middleware/validate";
import { loginSchema } from "../schema/auth";
import { login, refresh, logout } from "../controller/auth";

const authRouter = express.Router();

authRouter.post("/login", validate({ body: loginSchema }), login);

authRouter.post("/refresh", refresh); 

authRouter.post("/logout", logout);

export { authRouter };
