import type { Response } from 'express';
import type { AuthService } from './auth.service';
import { sessionSchema } from './auth.schemas';
import { asyncHandler, requireUser } from '../../common/utils/async-handler';

export class AuthController {
  constructor(private readonly auth: AuthService) {}

  session = asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const { displayName } = sessionSchema.parse(req.body ?? {});
    const profile = await this.auth.session(user.uid, displayName);
    res.json({ data: profile });
  });
}
