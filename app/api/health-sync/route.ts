import { NextResponse } from 'next/server';  
  
export async function POST(request: Request) {  
  try {  
    // 1. 接收从苹果快捷指令发来的数据  
    const body = await request.json();  
      
    const { activeEnergy, steps, weight, date, secretKey } = body;  
  
    // 2. 安全校验（因为接口要暴露在公网，防止别人乱发数据）  
    // 你可以在快捷指令里设置这个暗号  
    if (secretKey !== "my_super_secret_key_123") {  
      return NextResponse.json({ success: false, error: "暗号错误" }, { status: 401 });  
    }  
  
    console.log("收到苹果健康数据:", { activeEnergy, steps, weight, date });  
  
    // 3. 在这里将数据存入你的数据库 (例如 Prisma, MongoDB, Vercel Postgres 等)  
    // await db.dailyRecord.update({  
    //   where: { date: date },  
    //   data: { activeEnergy: Number(activeEnergy), weight: Number(weight) }  
    // });  
  
    return NextResponse.json({   
      success: true,   
      message: "健康数据同步成功！",  
      data: { activeEnergy, steps, weight }  
    });  
  
  } catch (error) {  
    return NextResponse.json({ success: false, error: "同步失败" }, { status: 500 });  
  }  
}  
