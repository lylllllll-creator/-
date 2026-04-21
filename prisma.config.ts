import { defineConfig } from '@prisma/config';

export default defineConfig({
  // 按照报错的要求，这里改成 datasource
  datasource: {
    url: 'file:./dev.db',
  },
});