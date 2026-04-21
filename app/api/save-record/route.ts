import { NextResponse } from "next/server";  
  
const globalAny = global as any;  
if (!globalAny.myFoodRecords) {  
  globalAny.myFoodRecords = [];  
}  
  
export async function POST(req: Request) {  
  try {  
    const body = await req.json();  
      
    // 接收 mealType 字段  
    const { name, calories, analysis, imageUrl, mealType } = body;  
  
    const newRecord = {  
      id: Date.now().toString(),  
      name,  
      calories: Number(calories) || 0,  
      analysis,  
      imageUrl: imageUrl || null,  
      mealType: mealType || 'other', // 默认分类  
      createdAt: new Date().toISOString()  
    };  
  
    globalAny.myFoodRecords.unshift(newRecord);  
  
    return NextResponse.json({ success: true, data: newRecord });  
  } catch (error) {  
    return NextResponse.json(  
      { success: false, error: "保存失败" },  
      { status: 500 }  
    );  
  }  
}  
