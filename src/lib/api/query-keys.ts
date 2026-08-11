export const queryKeys = {
  production: {
    configurationReleases: (organizationId: string) =>
      ["production", "configuration-releases", organizationId] as const,
    releaseAuthoringOptions: (organizationId: string) =>
      ["production", "configuration-release-authoring-options", organizationId] as const,
    productionProgramBindings: (organizationId: string) =>
      ["production", "program-bindings", organizationId] as const,
  },
};
