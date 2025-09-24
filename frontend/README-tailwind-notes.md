This project uses Tailwind via PostCSS. I added a small `tailwind.config.cjs` to define a custom utility `transition-discrete`.

What I added:
- `tailwind.config.cjs` with a plugin that defines `.transition-discrete { transition-timing-function: steps(1,end) }`.

How to apply changes locally:
1. Ensure dependencies are installed in `frontend`:

```bash
cd frontend
npm install
```

2. Run the dev server (Vite):

```bash
npm run dev
```

Tailwind will pick up `tailwind.config.cjs` and the new `.transition-discrete` utility will be available.

If you prefer not to add a config file, you can replace `transition-discrete` with Tailwind's built-in `transition` class in `MapPopup.tsx`.
