import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playersRouter from "./players";
import gamesRouter from "./games";
import statsRouter from "./stats";
import analyticsRouter from "./analytics";
import verticalJumpsRouter from "./verticalJumps";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playersRouter);
router.use(gamesRouter);
router.use(statsRouter);
router.use(analyticsRouter);
router.use(verticalJumpsRouter);

export default router;
