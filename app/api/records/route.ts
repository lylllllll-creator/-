import { NextResponse } from "next/server";  
  
// 告诉 Next.js 不要缓存这个接口的数据，每次都拉取最新  
export const dynamic = "force-dynamic";  
  
// 连接同一个全局变量"临时数据库"  
const globalAny = global as any;  
if (!globalAny.myFoodRecords) {  
  globalAny.myFoodRecords = [];  
}  
  
export async function GET() {  
  try {  
    // 强制获取全局变量里的最新数据  
    const currentRecords = globalAny.myFoodRecords || [];  
      
    // 直接把临时数据库里的所有记录返回给日记页面  
    return NextResponse.json({  
      success: true,  
      data: currentRecords,  
    });  
  } catch (error) {  
    console.error("读取数据失败:", error);  
    return NextResponse.json(  
      { success: false, error: "读取数据失败" },  
      { status: 500 }  
    );  
  }  
}  
