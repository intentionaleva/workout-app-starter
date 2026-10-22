# Contributing

This is a personal project, shared as-is. I may not answer issues or review pull requests quickly,
or at all. **Forks are very welcome**: the whole point is that you make your own version.

## Exercises for the shared library

If you've animated an exercise you're happy with, a pull request adding it to
[`examples/library/extra-exercises.js`](examples/library/extra-exercises.js) is welcome. Please:

1. Make it self-contained: no `extends`, and no shared constants from `config/exercises.js` (write the values out). Named bases (`supine`, `standing`, `quadruped`) are fine.
2. Give it German and English names, phase labels and cues. (If you only speak one, write that one and say so in the PR.)
3. Use a descriptive id like `"side-lying-leg-raise"`.
4. Run the checks:

   ```sh
   npm run check
   ```

   CI runs the same checks plus a headless browser test on every pull request.
5. Add a row to the table in [`examples/library/README.md`](examples/library/README.md).

Animating one of the text-only exercises (like `jumping-jacks`) is a nice first contribution.

## Code changes

Bug fixes are welcome. For bigger changes, consider keeping them in your fork: the template is meant
to stay small and easy to understand. Before opening a PR, run `npm install` once, then `npm test`
(checks plus the smoke test).

Keep it: no build step, no runtime dependencies, no external requests, works offline.
