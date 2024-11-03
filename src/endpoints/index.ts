import { Router, Request, Response } from "express";
import close from "./close";
import create from "./create";
import join from "./join";
import chats from "./chats";

export const router = Router();

// post enpoints
router.post("/create", async function (req: Request, res: Response) {
  const {success, message} = await create(req, res);
  res
    .json({
      success: success,
      message: message,
    })
    .status(success ? 200 : 401);
});

router.post("/close", function (req: Request, res: Response) {
  close(req, res);
  res.send("close");
});

router.post("/join", async function (req: Request, res: Response) {
  const {success, message} = await join(req, res);
  res
    .json({
      success: success,
      message: message,
    })
    .status(success ? 200 : 401); 
});

router.post("/chats", async function (req: Request, res: Response) {
  const {success, message} = await chats(req, res);
  res.json({
    success: success,
    message: message
  }).status(success ? 200 : 500)
})
