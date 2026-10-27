<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# Questo progetto

I dati in `public/data/questions.json`, `data/taxonomy.json` e `public/figure/`
sono **generati** da `scripts/extract_quiz.py`. Non modificarli a mano: correggi
lo script e rilancialo. Le correzioni al PDF ufficiale vanno in `MANUAL_FIXES`,
con la motivazione accanto. Vedi README.md.
