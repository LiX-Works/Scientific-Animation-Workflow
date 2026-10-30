# Accuracy and limits

## Sources

Protocol behavior was checked on 2026-10-30 against the MCP specification, revision 2026-07-28:

- [Overview](https://modelcontextprotocol.io/specification/latest): hosts, clients and servers, and the base protocol.
- [Tools](https://modelcontextprotocol.io/specification/latest/server/tools): `tools/list`, `tools/call`, tool definitions, `isError`, and the message flow between model, client and server.
- [Versioning and compatibility](https://modelcontextprotocol.io/specification/latest/basic/lifecycle): "There is no negotiation handshake." The `initialize` handshake belongs to revisions 2025-11-25 and earlier.

History: Anthropic's [announcement of 9 December 2025](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation) describes the donation to the Agentic AI Foundation, a directed fund under the Linux Foundation, and says MCP was introduced one year earlier.

## What the film simplifies

- **The layer stack is schematic.** Programs differ. Scripting interfaces and the window are often parallel entry points that both call the same commands; the film draws the interface layer below the window so that its path can be followed.
- **The model's request is simplified.** The film writes `search_papers(query: ..., year_from: 2025)`. Model APIs each have their own format; the specification governs the `tools/call` message the application sends to the server.
- **The `tools/call` message is abbreviated.** It omits `jsonrpc`, `id` and the required `_meta` fields.
- **Results are shown as text.** Tool results can also contain images, audio and structured content.
- **Other parts of the protocol are left out.** The film covers tools only, not resources, prompts, sampling, elicitation or transports.

## What is illustrative

Tool names, paper titles, DOIs (the `10.1234` test prefix), collection names, error text, the dialog, and the commands shown during the dive are invented for the example. They are not the interface of any real server. The Origin window is drawn, not a screenshot. Software names identify familiar programs, and their owners have no connection to this film.
