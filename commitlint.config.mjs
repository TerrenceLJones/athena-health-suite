// Header format used in this repo: an optional ticket prefix (e.g. "US-SH-001",
// "EPIC-SH-000", "SH-000") followed by a Conventional Commits header, e.g.:
//   US-SH-001 feat: implement patient search for athena-provider
//   fix: resolve pnpm version conflict in GitHub Actions workflows
export default {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(?:[A-Z]{2,}(?:-[A-Z]{2,})*-\d+\s)?(\w+)(?:\(([\w$.\-*/ ]*)\))?!?: (.*)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
};
