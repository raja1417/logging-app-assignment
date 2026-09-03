# Contributing

Thanks for considering a contribution to the hotel-booking logging app!

## Getting started

```bash
cd app
npm ci
npm run lint
npm test
npm run build
```

## Local end-to-end stack

```bash
docker compose up --build
```

## Pull requests

- Keep changes focused and include tests for new behavior (`app/test/`).
- Run `npm run lint && npm test && npm run build` in `app/` before opening a PR.
- If you change `fluent-bit/fluent-bit.conf` or `parsers.conf`, keep
  `k8s-manifests/config-map.yaml` and `charts/logging-app/templates/configmap.yaml`
  in sync, and re-run `helm lint charts/logging-app`.
- If you change Kubernetes manifests or the Helm chart, validate with:
  ```bash
  helm lint charts/logging-app
  helm template charts/logging-app --set splunk.token=dummy | kubeconform -strict -summary
  kubeconform -strict -summary k8s-manifests/*.yaml
  ```

## Code style

- TypeScript/Node code is linted with ESLint (`app/.eslintrc.cjs`).
- Formatting conventions (indentation, line endings) are defined in
  `.editorconfig`; configure your editor to respect it.

## Reporting issues

Please open a GitHub issue describing the problem, expected behavior, and
steps to reproduce.
