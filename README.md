# Mektup CLI

[Mektup](https://usemektup.com) is a self-hosted, multi-domain email platform. This is a thin command-line client over the real [Mektup REST API](https://usemektup.com/docs/api.md) - register a domain, create a mailbox, send a real email, or list messages, straight from a shell or script.

It's the fallback path for agents and environments that don't support [MCP](https://www.npmjs.com/package/mektup-mcp) yet. If your tool can run a shell command, it can use Mektup.

**Scope note:** this CLI covers the core 6 operations below. The [MCP server](https://www.npmjs.com/package/mektup-mcp) has grown to cover the full API (forms, contacts, drafts, vacation replies, forwarding, webhooks, delivery-status, and more) - if you need any of that and your environment supports MCP, use that instead. More CLI subcommands are on the roadmap.

## Install

```sh
npx mektup-cli <command>
```

or install it globally:

```sh
npm install -g mektup-cli
mektup <command>
```

## Auth

Every command needs a Mektup API key. Create one at [app.usemektup.com](https://app.usemektup.com) → **API keys**.

```sh
export MEKTUP_API_KEY=mek_live_...
```

or pass it per-command with `--api-key`. Self-hosting your own Mektup instance? Point at it with `--base-url` or `MEKTUP_API_BASE_URL` (defaults to `https://api.usemektup.com`).

## Commands

```sh
mektup create-domain <domain>
```
Register a domain and get back the exact DNS records to add (MX, SPF, DKIM, DMARC).

```sh
mektup list-domains
```
List domains registered to this account.

```sh
mektup create-mailbox <domain> <localPart> [--password <password>]
```
Create a mailbox on an already-registered domain. Returns real IMAP/SMTP login credentials - shown once. Omit `--password` to auto-generate a strong one.

```sh
mektup list-mailboxes <domain>
```
List mailboxes on a domain.

```sh
mektup send-email --from <address> --to <address> --subject <text> [--text <text>] [--html <html>]
```
Send a real email. `--from` must be a mailbox on a domain registered to this account.

```sh
mektup list-messages <mailbox> [--limit <n>]
```
List recent messages for a mailbox (e.g. `hello@example.com`). Default limit 50.

Every command exits `0` on success, `1` on failure (missing key, bad request, HTTP error), and prints the raw JSON response - it composes cleanly with `jq`, shell scripts, or CI.

## Example

```sh
export MEKTUP_API_KEY=mek_live_...

mektup create-domain example.com
# -> DNS records to add at your registrar

mektup create-mailbox example.com hello --password "a-strong-password-min-12-chars"

mektup send-email \
  --from hello@example.com \
  --to someone@gmail.com \
  --subject "Hello from Mektup" \
  --text "This is a real email, sent from a domain you own."

mektup list-messages hello@example.com --limit 10
```

## Links

- [Mektup](https://usemektup.com)
- [API docs](https://usemektup.com/docs/api.md)
- [MCP server](https://www.npmjs.com/package/mektup-mcp) (full API coverage, for MCP-capable agents)

## License

MIT
