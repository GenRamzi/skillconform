# Model matrix

Verified on 2026-08-05. Always confirm availability in your own provider account before a production run.

| Requested name | Project target | API identifier guidance | Note |
|---|---|---|---|
| ChatGPT 5.6 | GPT-5.6 family | Set `OPENAI_MODEL` to an identifier returned by your account's `/v1/models` endpoint | ChatGPT product labels and API IDs are not guaranteed to be identical. |
| Claude Fable 5 | Claude Fable 5 | `claude-fable-5` | Public Claude API model. |
| Claude Ops 5 | Claude Opus 5 | `claude-opus-5` | “Ops” is treated as a typo for “Opus”. |
| Gemini 3.1 | Gemini 3.1 Pro Preview | `gemini-3.1-pro-preview` | “Gemini 3.1” is a family; specify the variant. |
| Gemini 3.5 Flash | Gemini 3.5 Flash | `gemini-3.5-flash` | Stable text/multimodal model. |

## Environment examples

```bash
export OPENAI_API_KEY="..."
export OPENAI_MODEL="<id returned by /v1/models>"

export ANTHROPIC_API_KEY="..."
export ANTHROPIC_MODEL="claude-fable-5"

export GEMINI_API_KEY="..."
export GEMINI_MODEL="gemini-3.5-flash"
```

Do not commit `.env` files or API keys.
