export default {
  providers: [
    {
      domain: "https://api.stack-auth.com",
      applicationID:
        process.env.NEXT_PUBLIC_STACK_PROJECT_ID ??
        "ac82d149-11a6-419f-885c-13a859071e8a",
    },
  ],
};
