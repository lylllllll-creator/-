import type { NextConfig } from "next";  
  
const nextConfig: NextConfig = {  
  // 告诉 Next.js 导出适合 GitHub Pages 的静态网页  
  output: "export",  
  // 必须关闭图片优化，否则 GitHub Actions 会报错  
  images: {  
    unoptimized: true,  
  },  
};  
  
export default nextConfig;  
