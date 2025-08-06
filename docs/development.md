# Development

Notes for developers while working on the project.

## Nice to have commands

List all files in the project excluding generated directories like `node_modules` and `target`:
```bash
find . \( -path './node_modules' -o -path './.next' -o -path './.git'   \) -prune -o -print
```

List all files in the project that are named `*:Zone.Identifier`°
```bash 
find . \( -path './node_modules' -o -path './.next' -o -path './.git'   \)  -prune -o -name '*:Zone.Identifier' -print
```

Remove all `*:Zone.Identifier` files in the project: (Dangerous, use with caution)
```bash
 find . \( -path './node_modules' -o -path './.next' -o -path './.git' \) -prune -o -name '*:Zone.Identifier' -type f -exec rm -f {} +
```
