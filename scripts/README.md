# Deployment Automation Scripts

These scripts follow best practices for efficient deployment management.

## Available Scripts

### `update-backend-env.sh`
Update environment variables on Render backend.

```bash
./scripts/update-backend-env.sh OPENAI_API_KEY sk-proj-xxxxx
```

### `update-frontend-env.sh`
Update environment variables on Vercel frontend.

```bash
# Update production
./scripts/update-frontend-env.sh NEXT_PUBLIC_AGENT_ENDPOINT https://alleato-pm-1.onrender.com

# Update specific environment
./scripts/update-frontend-env.sh NEXT_PUBLIC_AGENT_ENDPOINT https://staging.example.com preview
```

### `health-check.sh`
Check health of both backend and frontend.

```bash
./scripts/health-check.sh
```

## Quick Commands

```bash
# Check system health
./scripts/health-check.sh

# Update backend API key
./scripts/update-backend-env.sh OPENAI_API_KEY sk-proj-new-key

# Update frontend backend URL
./scripts/update-frontend-env.sh NEXT_PUBLIC_AGENT_ENDPOINT https://new-backend.onrender.com

# View backend logs
render logs --service alleato-backend --tail

# View frontend logs
vercel logs --follow

# Redeploy (trigger via git)
git commit --allow-empty -m "chore: trigger redeploy" && git push origin main
```

## Best Practices

1. **Use these scripts instead of web dashboards** - Faster and reproducible
2. **Always test locally first** - Use .env files for local development
3. **Document changes** - Commit messages should explain why env vars changed
4. **Never commit secrets** - These scripts use platform CLIs, keeping secrets secure

## See Also

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Full deployment guide
- [Render CLI Docs](https://render.com/docs/cli)
- [Vercel CLI Docs](https://vercel.com/docs/cli)
