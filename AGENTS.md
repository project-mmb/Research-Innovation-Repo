## Application structure
- Use the root route for the shared header, footer and Android-style bottom navigation so all content routes retain the same shell.
- Keep static demonstration data and the metadata helper in src/lib/markham-data.ts. Use src/lib/markham-api.ts for browser-safe public reads from the engine; never place database credentials or the engine's shared write API key in frontend code.
- Keep the Java business services, REST controllers, and MySQL schema under engine/ in their existing domain packages. See engine/docs/requirements.md for implemented and planned scope.
- Use src/components/markham for shared listing and shell UI, and src/styles.css for semantic visual tokens and layouts.
- Treat listing, pricing, safety and neighbourhood metrics as illustrative, not verified real-world data; mark them accordingly.
