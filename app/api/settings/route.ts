import { NextResponse } from "next/server";  
  
const globalAny = global as any;  
// 默认基础代谢目标为 1350  
if (!globalAny.mySettings) {  
  globalAny.mySettings = { bmr: 1350 };  
}  
  
export async function GET() {  
  return NextResponse.json({ success: true, data: globalAny.mySettings });  
}  
  
export async function POST(req: Request) {  
  try {  
    const body = await req.json();  
    if (body.bmr) {  
      globalAny.mySettings.bmr = Number(body.bmr);  
    }  
    return NextResponse.json({ success: true, data: globalAny.mySettings });  
  } catch (error) {  
    return NextResponse.json({ success: false }, { status: 500 });  
  }  
}  
