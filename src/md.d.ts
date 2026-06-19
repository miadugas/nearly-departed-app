// .md files are inlined as strings by babel-plugin-inline-import (see
// babel.config.js). This tells TypeScript a default string export exists.
declare module "*.md" {
  const content: string;
  export default content;
}
