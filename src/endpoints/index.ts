import { Router, Request, Response } from "express";
import close from "./close";
import create from "./create";
import join from "./join";

export const router = Router();

// post enpoints
router.post("/create", function (req: Request, res: Response) {
  create(req, res);
  res.send("create");
});

router.post("/close", function (req: Request, res: Response) {
  close(req, res);
  res.send("close");
});

router.post("/join", function (req: Request, res: Response) {
  join(req, res);
  res.json("join");
});
