import { Router, Request, Response } from "express";
import close from "./close";
import create from "./create";
import join from "./join";

export const router = Router();

// post enpoints
router.post("/create", async function (req: Request, res: Response) {
  const {success, message} = await create(req, res);
  if (success) {
    res
      .json({
        success: true,
        message: message,
      })
      .status(200);
  }
  else {
    res
      .json({
        success: false,
        message: message,
      })
      .status(401);
  }
});

router.post("/close", function (req: Request, res: Response) {
  close(req, res);
  res.send("close");
});

router.post("/join", function (req: Request, res: Response) {
  join(req, res);
  res
    .json({
      success: true,
      message: "Joined discussion!",
    })
    .status(200);
});
