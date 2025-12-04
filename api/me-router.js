import express from "express";
import meHandler from "./me.js";

const router = express.Router();

router.get("/", meHandler);

export default router;
