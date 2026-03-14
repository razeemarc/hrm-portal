import { Convex } from "convex/server";
import { auth } from "@convex-dev/auth/server";
import { schema } from "./schema";

const convex = new Convex({
  schema,
  auth: auth({
    providers: [
      {
        provider: "password",
        accountTable: "accounts",
        sessionTable: "sessions",
        account: {
          fields: {
            userId: "users",
          },
        },
        session: {
          fields: {
            userId: "users",
          },
        },
      },
    ],
    session: {
      tokenName: "session",
      expiration: 30 * 24 * 60 * 60 * 1000,
    },
  }),
});

export default convex;