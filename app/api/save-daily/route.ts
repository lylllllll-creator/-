import { NextResponse } from "next/server";  
  
// 我们用一个全局对象来临时模拟数据库，存储每天的健康数据  
const globalAny = global as any;  
if (!globalAny.myDailyHealthStats) {  
  // 预设几天的假数据，方便图表立刻能看到趋势  
  globalAny.myDailyHealthStats = [  
    { date: "10/1", weight: 68.0, intake: 2100, bmr: 1350, active: 200 },  
    { date: "10/2", weight: 67.8, intake: 1950, bmr: 1350, active: 300 },  
    { date: "10/3", weight: 67.5, intake: 1800, bmr: 1350, active: 450 },  
    { date: "10/4", weight: 67.6, intake: 2200, bmr: 1350, active: 100 },  
    { date: "10/5", weight: 67.0, intake: 1600, bmr: 1350, active: 500 },  
  ];  
}  
  
// GET 请求：获取所有日期的健康数据  
export async function GET() {  
  return NextResponse.json({   
    success: true,   
    data: globalAny.myDailyHealthStats   
  });  
}  
  
// POST 请求：保存/更新今天的健康数据  
export async function POST(req: Request) {  
  try {  
    const body = await req.json();  
    const { date, weight, intake, bmr, active } = body;  
  
    // 查找今天的数据是否已经存在  
    const existingIndex = globalAny.myDailyHealthStats.findIndex((item: any) => item.date === date);  
  
    const newRecord = {  
      date,  
      weight: Number(weight),  
      intake: Number(intake),  
      bmr: Number(bmr),  
      active: Number(active)  
    };  
  
    if (existingIndex >= 0) {  
      // 如果今天已经有数据了，就更新它  
      globalAny.myDailyHealthStats[existingIndex] = {  
        ...globalAny.myDailyHealthStats[existingIndex],  
        ...newRecord  
      };  
    } else {  
      // 如果今天没有，就新增一条  
      globalAny.myDailyHealthStats.push(newRecord);  
    }  
  
    return NextResponse.json({ success: true, data: globalAny.myDailyHealthStats });  
  } catch (error) {  
    return NextResponse.json(  
      { success: false, error: "保存失败" },  
      { status: 500 }  
    );  
  }  
}  
