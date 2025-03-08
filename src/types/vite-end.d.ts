interface ImportMeta {
  env: {
    SSR?: boolean;
    [key: string]: any; // Allow any additional env variables
  };
}
