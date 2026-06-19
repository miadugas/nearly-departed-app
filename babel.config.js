module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Inlines .md files as string literals at build time, so /legal/*.md is the
    // single source of truth for the legal copy (no hand-syncing).
    plugins: [["inline-import", { extensions: [".md"] }]],
  };
};
