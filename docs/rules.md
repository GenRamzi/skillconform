# Rule reference

SkillConform rule IDs are stable within a major version. Rules beginning with `SC` cover Agent Skills conformance; rules beginning with `SEC` flag security-review concerns.

## Conformance rules

| Rule | Default | Meaning |
|---|---:|---|
| `SC000` | Error | No `SKILL.md` exists at or below the target. |
| `SC001` | Error | YAML frontmatter is absent, malformed, or not a mapping. |
| `SC002` | Error | Required `name` is missing or empty. |
| `SC003` | Error | `name` violates length or lowercase hyphenated naming rules. |
| `SC004` | Error | `name` does not match the parent directory. |
| `SC005` | Error | Required `description` is missing or empty. |
| `SC006` | Error | `description` exceeds 1,024 characters. |
| `SC007` | Warning | `description` is too vague for reliable discovery. |
| `SC008` | Error | `license` is not a string. |
| `SC009` | Error | `compatibility` is not a string. |
| `SC010` | Error | `compatibility` is empty or exceeds 500 characters. |
| `SC011` | Error | `metadata` is not a mapping. |
| `SC012` | Error | A metadata value is not a string. |
| `SC013` | Error | `allowed-tools` is not a string. |
| `SC014` | Warning | An unknown top-level field may reduce portability. |
| `SC015` | Warning | `SKILL.md` exceeds the recommended 500 lines. |
| `SC016` | Warning | The instruction body exceeds approximately 5,000 tokens. |
| `SC017` | Error | A local reference is absolute or escapes the skill directory. |
| `SC018` | Error | A referenced local file does not exist. |

## Security rules

| Rule | Default | Meaning |
|---|---:|---|
| `SEC001` | Warning | Potentially destructive, privileged, or dynamic code execution. |
| `SEC002` | Error | A possible credential or private key is embedded in the skill. |
| `SEC003` | Warning | Instructions resemble prompt injection or safety bypass behavior. |
| `SEC004` | Warning | The skill pre-approves broad shell access. |
| `SEC005` | Warning | Network use appears in the skill without a compatibility declaration. |

## Severity policy

- **Error:** invalid format, missing resource, or likely secret. Block by default.
- **Warning:** risky or non-portable behavior requiring human review.
- **Note:** informational finding. Reserved for future advisory rules.

Choose the CI threshold with `--fail-on`. Use `--fail-on warning` for maintained public skill collections.

## False positives

Security detection is intentionally conservative. If a rule is expected in a controlled test fixture, record that expectation in `skillconform.yaml` rather than weakening the rule globally. Do not suppress a finding until a reviewer understands the matched instruction or script.
