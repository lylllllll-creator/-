import { NextResponse } from "next/server";  
  
const globalAny = global as any;  
// 将原来的数组改成对象，用日期作为 Key： { "2023-10-24": [食物列表], "2023-10-25": [...] }  
if (!globalAny.myFoodsByDate) {  
  globalAny.myFoodsByDate = {};  
}  
  
// 获取某天的食物列表  
export async function GET(req: Request) {  
  const { searchParams } = new URL(req.url);  
  const date = searchParams.get("date"); // 格式如 2023-10-24  
    
  if (!date) return NextResponse.json({ success: false, error: "缺少日期" });  
    
  const foods = globalAny.myFoodsByDate[date] || [];  
  return NextResponse.json({ success: true, data: foods });  
}  
  
// 保存食物到指定的日期  
export async function POST(req: Request) {  
  try {  
    const body = await req.json();  
    const { date, food } = body;  
      
    if (!globalAny.myFoodsByDate[date]) {  
      globalAny.myFoodsByDate[date] = [];  
    }  
      
    // 给新食物加一个 ID 和时间戳  
    const newFood = {  
      ...food,  
      id: Date.now().toString(),  
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })  
    };  
      
    globalAny.myFoodsByDate[date].push(newFood);  
      
    return NextResponse.json({ success: true, data: globalAny.myFoodsByDate[date] });  
  } catch (error) {  
    return NextResponse.json({ success: false, error: "保存失败" }, { status: 500 });  
  }  
}  
