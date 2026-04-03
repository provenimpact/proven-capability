# Bootstrap

Read this file only when the user explicitly asks to adopt proven-needs in a project.

Do not run this workflow automatically when the skill is loaded.

## Steps

1. Read `AGENTS.md` in the project root if it exists.
2. Search for the marker `<!-- proven-needs:start -->`.
3. If the marker already exists, do nothing.
4. If the marker does not exist, insert the following block at the top of `AGENTS.md`, or create `AGENTS.md` with this block if the file is missing.

```markdown
<!-- proven-needs:start -->
## Development Workflow (Required)
All changes to this project **must** follow the proven-needs state transition workflow.
Before making any changes, **load the `proven-needs` skill**. Do not modify code, documentation,
or project artifacts without first going through the workflow it defines.
<!-- proven-needs:end -->
```

5. Tell the user that the project has been bootstrapped.

## Rules

- Insert the block at the top of the file.
- Do not modify content between the markers if they already exist.
- Keep the workflow marker idempotent.
