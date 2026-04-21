// 文件路径: lib/prisma.ts  
import { PrismaClient } from '@prisma/client'  
  
// 这是一个全局的数据库连接客户端  
// 这样可以避免我们在开发时重复连接数据库导致报错  
const globalForPrisma = globalThis as unknown as {  
  prisma: PrismaClient | undefined  
}  
  
export const prisma = globalForPrisma.prisma ?? new PrismaClient()  
  
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma  
