#!/usr/bin/env node
// Thin CLI over the Mektup REST API - the fallback path for agents/environments
// without MCP support (Phase 4's "npx CLI" deliverable). Same operations as
// the MCP server, just invoked as subcommands with exit codes instead of
// JSON-RPC, so it composes cleanly in shell scripts too.
import { Command } from "commander";

const program = new Command();
program.name("mektup").description("Mektup email platform CLI").version("0.1.0");
program.option("--api-key <key>", "API key (defaults to MEKTUP_API_KEY env var)");
program.option("--base-url <url>", "API base URL (defaults to MEKTUP_API_BASE_URL or https://api.usemektup.com)");

function opts() {
  const o = program.opts();
  const apiKey = o.apiKey || process.env.MEKTUP_API_KEY;
  const baseUrl = o.baseUrl || process.env.MEKTUP_API_BASE_URL || "https://api.usemektup.com";
  if (!apiKey) {
    console.error("Error: no API key. Pass --api-key or set MEKTUP_API_KEY.");
    process.exit(1);
  }
  return { apiKey, baseUrl };
}

async function call(method, path, body) {
  const { apiKey, baseUrl } = opts();
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`Error: ${data.error || `HTTP ${res.status}`}`);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

program
  .command("create-domain <domain>")
  .description("Register a domain and get back the DNS records to add")
  .action((domain) => call("POST", "/v1/domains", { domain }));

program
  .command("list-domains")
  .description("List domains registered to this account")
  .action(() => call("GET", "/v1/domains"));

program
  .command("create-mailbox <domain> <localPart>")
  .description("Create a mailbox on an already-registered domain. Returns real IMAP/SMTP login credentials.")
  .option("--password <password>", "Password (min 12 chars) - omit to auto-generate a strong one")
  .action((domain, localPart, o) => call("POST", `/v1/domains/${encodeURIComponent(domain)}/mailboxes`, { localPart, password: o.password }));

program
  .command("list-mailboxes <domain>")
  .description("List mailboxes on a domain")
  .action((domain) => call("GET", `/v1/domains/${encodeURIComponent(domain)}/mailboxes`));

program
  .command("send-email")
  .description("Send a real email")
  .requiredOption("--from <address>", "Sender - domain must be registered to this account")
  .requiredOption("--to <address>", "Recipient")
  .requiredOption("--subject <text>", "Subject")
  .option("--text <text>", "Plain-text body")
  .option("--html <html>", "HTML body")
  .action((o) => call("POST", "/v1/emails", { from: o.from, to: o.to, subject: o.subject, text: o.text, html: o.html }));

program
  .command("list-messages <mailbox>")
  .description("List recent messages for a mailbox (e.g. hello@example.com)")
  .option("--limit <n>", "Max results (default 50)")
  .action((mailbox, o) => {
    const qs = new URLSearchParams({ mailbox, ...(o.limit ? { limit: o.limit } : {}) });
    return call("GET", `/v1/messages?${qs}`);
  });

program.parseAsync(process.argv);
